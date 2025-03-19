import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import os
import matplotlib.pyplot as plt
import io
import base64
import numpy as np
import math  # Add this import
from fastapi import HTTPException
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get the directory containing the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(current_dir, 'serviceAccountKey.json')

# Initialize Firebase
cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

class StockPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        self.logger = logging.getLogger(__name__)
        self.last_known_quantities = {}  # Track quantities between checks
        # Initialize email service at startup
        from EmailService import EmailService
        self.email_service = EmailService()
        
    def fetch_inventory_data(self):
        inventory_ref = db.collection('inventoryItems')
        docs = inventory_ref.stream()
        
        stock_data = []
        for doc in docs:
            data = doc.to_dict()
            # Debug log for price
            self.logger.debug(f"Raw price for {data['name']}: {data.get('price')}")
            
            # Ensure price is properly converted to float
            try:
                price = float(data.get('price', 0))
            except (TypeError, ValueError):
                price = 0.0
                self.logger.warning(f"Invalid price for {data['name']}, defaulting to 0")
            
            self.logger.debug(f"Processed price for {data['name']}: €{price}")
            
            usage_history = data.get('used_stock', [])
            
            # Debug price info
            self.logger.debug(f"Fetched price for {data['name']}: {data.get('price', 0)}")
            
            if usage_history:
                try:
                    # Sort usage history by date
                    sorted_history = sorted(usage_history, 
                        key=lambda x: datetime.fromisoformat(x['date'].replace('Z', ''))
                    )
                    
                    # Calculate total units used
                    total_used = sum(usage['quantity'] for usage in sorted_history)
                    
                    # Get unique days where stock was actually used
                    usage_dates = {
                        datetime.fromisoformat(usage['date'].replace('Z', '')).date() 
                        for usage in sorted_history
                    }
                    active_days = len(usage_dates)
                    
                    # Calculate consumption rate based only on active usage days
                    daily_consumption = total_used / active_days if active_days > 0 else 0
                    
                    self.logger.debug(f"""
                        Item: {data['name']}
                        Price: €{data.get('price', 0)}
                        Total used: {total_used} units
                        Active usage days: {active_days}
                        Daily consumption rate: {daily_consumption:.2f}
                    """)
                    
                except (ValueError, KeyError, IndexError) as e:
                    print(f"Error calculating consumption for {data['name']}: {e}")
                    daily_consumption = 0
            else:
                daily_consumption = 0
                
            # Update days until low calculation based on actual usage
            days_until_low = self._calculate_days_until_low(data, daily_consumption)
            
            stock_data.append({
                'product_id': doc.id,
                'name': data['name'],
                'current_quantity': data['quantity'],
                'price': price,  # Add processed price
                'category': data.get('category', ''),
                'daily_consumption': round(daily_consumption, 2),
                'days_until_low': days_until_low,
                'used_stock': usage_history,
                'total_usage': total_used if usage_history else 0
            })
        
        return pd.DataFrame(stock_data)
    
    def _calculate_days_until_low(self, item_data, daily_consumption):
        current_quantity = item_data['quantity']
        
        self.logger.debug(f"""
            Days until low detailed calculation:
            - Item name: {item_data.get('name')}
            - Current quantity: {current_quantity}
            - Daily consumption: {daily_consumption}
            - Target threshold: 10
        """)
        
        if current_quantity <= 10:
            return 0
            
        # Use actual consumption rate if available
        if daily_consumption > 0:
            days = int((current_quantity - 10) / daily_consumption)
            self.logger.debug(f"Calculated days until low: {days}")
            return days
            
        return int((current_quantity - 10) / (0.5 if current_quantity > 20 else 1))
    
    def train_model(self):
        data = self.fetch_inventory_data()
        
        # Define feature names
        feature_names = ['current_quantity', 'price']
        
        # Features for prediction with named columns
        X = pd.DataFrame(data[feature_names])
        y = data['days_until_low']
        
        # Split dataset
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        return self.model.score(X_test, y_test)
    
    def predict_stock_levels(self):
        try:
            data = self.fetch_inventory_data()
            predictions = []
            newly_low_items = []  # Track items that just went below threshold
            
            for _, item in data.iterrows():
                current_quantity = item['current_quantity']
                product_id = item['product_id']
                
                # Calculate days until low
                days_until_low = self._calculate_days_until_low(
                    {'quantity': current_quantity}, 
                    item['daily_consumption']
                )
                
                # Check if this item just went below threshold
                if (product_id in self.last_known_quantities and 
                    self.last_known_quantities[product_id] > 10 and 
                    current_quantity <= 10):
                    self.logger.debug(f"Item {item['name']} crossed below threshold!")
                    newly_low_items.append(item)
                
                # Update last known quantity
                self.last_known_quantities[product_id] = current_quantity
                
                prediction = {
                    'product_id': product_id,
                    'name': item['name'],
                    'current_quantity': current_quantity,
                    'predicted_days_until_low': days_until_low,
                    'daily_consumption': item['daily_consumption'],
                    'price': float(item['price']),
                    'confidence_score': self._calculate_confidence(item),
                    'recommended_restock_date': (
                        datetime.now() + 
                        timedelta(days=days_until_low)
                    ).isoformat(),
                    'category': item['category'],
                    'usage_history': item.get('used_stock', []),
                    'is_newly_low': product_id in [i['product_id'] for i in newly_low_items]
                }
                predictions.append(prediction)
            
            return predictions
            
        except Exception as e:
            self.logger.error(f"Error in predict_stock_levels: {e}", exc_info=True)
            raise
    
    def _calculate_confidence(self, item):
        # Base confidence on usage history and current quantity
        has_usage_history = len(item['used_stock']) > 0
        daily_consumption = item['daily_consumption']
        
        if has_usage_history and daily_consumption > 0:
            if item['current_quantity'] < 10:
                return 0.9  # High confidence when low stock + usage data
            elif item['current_quantity'] < 20:
                return 0.8  # Good confidence with moderate stock + usage data
            return 0.7     # Moderate confidence with high stock + usage data
        
        # Lower confidence without usage history
        if item['current_quantity'] < 5:
            return 0.6
        elif item['current_quantity'] < 10:
            return 0.5
        return 0.4

    def generate_consumption_plot(self, item_name):
        try:
            data = self.fetch_inventory_data()
            print(f"Looking for item: {item_name} in {len(data)} items")  # Debug log
            
            # Filter for specific item
            item_data = data[data['name'] == item_name]
            if item_data.empty:
                raise HTTPException(status_code=404, detail=f"Item {item_name} not found")
            
            item_data = item_data.iloc[0]
            usage_history = item_data['used_stock']
            
            if not usage_history:
                raise HTTPException(status_code=400, detail="No usage history available")
            
            self.logger.debug(f"Fetched data for plotting: {len(data)} items")
            
            # Filter for specific item
            item_data = data[data['name'] == item_name]
            if item_data.empty:
                self.logger.error(f"Item not found: {item_name}")
                raise HTTPException(status_code=404, detail=f"Item {item_name} not found")
            
            item_data = item_data.iloc[0]
            usage_history = sorted(
                item_data['used_stock'],
                key=lambda x: datetime.fromisoformat(x['date'].replace('Z', ''))
            )
            
            if not usage_history:
                self.logger.error(f"No usage history for item: {item_name}")
                raise HTTPException(status_code=400, detail="No usage history available")
            
            # Debug log the usage history
            self.logger.debug(f"Usage history for {item_name}: {len(usage_history)} records")
            
            # Create plot
            dates = [datetime.fromisoformat(u['date'].replace('Z', '')) for u in usage_history]
            quantities = [u['quantity'] for u in usage_history]
            
            plt.figure(figsize=(10, 6))
            plt.plot(dates, quantities, 'b-o', label='Units Used')
            
            if len(dates) > 1:
                try:
                    days_since_start = [(d - dates[0]).days for d in dates]
                    days_since_start = np.array(days_since_start) + np.random.normal(0, 0.01, len(days_since_start))
                    z = np.polyfit(days_since_start, quantities, 1)
                    p = np.poly1d(z)
                    x_trend = np.linspace(min(days_since_start), max(days_since_start), 100)
                    y_trend = p(x_trend)
                    trend_dates = [dates[0] + timedelta(days=x) for x in x_trend]
                    plt.plot(trend_dates, y_trend, "r--", label=f'Trend (avg: {z[0]:.2f} units/day)')
                except np.linalg.LinAlgError as e:
                    self.logger.warning(f"Could not calculate trend line: {e}")
            
            plt.title(f'Usage History for {item_name}')
            plt.xlabel('Date')
            plt.ylabel('Units Used')
            plt.xticks(rotation=45)
            plt.grid(True)
            plt.legend()
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png')
            plt.close()
            buf.seek(0)
            plot_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            return plot_base64
            
        except Exception as e:
            self.logger.error(f"Error generating plot for {item_name}: {e}", exc_info=True)
            raise HTTPException(status_code=400, detail=str(e))

    def _calculate_recommended_quantity(self, current_quantity: float, daily_consumption: float) -> float:
        """Calculate the recommended quantity to order based on current stock and daily consumption"""
        # Calculate target stock level (10 days worth)
        target_stock = math.ceil(daily_consumption * 10)
        
        # Add minimum target stock threshold
        min_target = 10  # Minimum stock to maintain
        target_stock = max(target_stock, min_target)
        
        # Calculate difference needed
        recommended = target_stock - current_quantity
        
        self.logger.debug(f"""
                Calculating recommended quantity:
                - Current quantity: {current_quantity}
                - Daily consumption: {daily_consumption}
                - Target stock: {target_stock}
                - Recommended: {max(recommended, 0)}
        """)
        
        # Return max of 0 and recommended quantity
        return max(recommended, 0)