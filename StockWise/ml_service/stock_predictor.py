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
        self.logger = logging.getLogger(__name__)  # Add logger to the class
        
    def fetch_inventory_data(self):
        inventory_ref = db.collection('inventoryItems')
        docs = inventory_ref.stream()
        
        stock_data = []
        for doc in docs:
            data = doc.to_dict()
            usage_history = data.get('used_stock', [])
            
            if usage_history:
                try:
                    # Sort usage history by date
                    sorted_history = sorted(usage_history, 
                        key=lambda x: datetime.fromisoformat(x['date'].replace('Z', '+00:00').replace('+00:00', ''))
                    )
                    
                    # Calculate total units used
                    total_used = sum(usage['quantity'] for usage in sorted_history)
                    
                    # Get first date and current date (both timezone naive)
                    first_date = datetime.fromisoformat(sorted_history[0]['date'].replace('Z', ''))
                    current_date = datetime.now()
                    
                    # Calculate date range
                    date_range = (current_date - first_date).days + 1
                    
                    daily_consumption = total_used / date_range if date_range > 0 else total_used
                    print(f"Debug - {data['name']}: Total used: {total_used}, Days: {date_range}, Rate: {daily_consumption}")
                    
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
                'price': data['price'],
                'category': data['category'],
                'daily_consumption': round(daily_consumption, 2),
                'days_until_low': days_until_low,
                'used_stock': usage_history,
                'total_usage': total_used if usage_history else 0
            })
        
        return pd.DataFrame(stock_data)
    
    def _calculate_days_until_low(self, item_data, daily_consumption):
        current_quantity = item_data['quantity']
        if current_quantity <= 10:
            return 0
        
        # Use actual consumption rate if available
        if daily_consumption > 0:
            return int((current_quantity - 10) / daily_consumption)
        
        # Fallback to estimation if no usage history
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
        if not self.is_trained:
            self.train_model()
            self.is_trained = True
            
        data = self.fetch_inventory_data()
        predictions = []
        
        for _, item in data.iterrows():
            X_pred = pd.DataFrame([[item['current_quantity'], item['price']]], 
                                columns=['current_quantity', 'price'])
            
            days_until_low = int(max(0, self.model.predict(X_pred)[0]))
            
            # Add debug logging
            print(f"Prediction for {item['name']}:")
            print(f"- Current quantity: {item['current_quantity']}")
            print(f"- Daily consumption: {item['daily_consumption']}")
            print(f"- Days until low: {days_until_low}")
            print(f"- Usage history: {len(item['used_stock'])} records")
            
            prediction = {
                'product_id': item['product_id'],
                'name': item['name'],
                'current_quantity': item['current_quantity'],
                'predicted_days_until_low': days_until_low,
                'confidence_score': self._calculate_confidence(item),
                'recommended_restock_date': (
                    datetime.now() + timedelta(days=days_until_low)
                ).isoformat(),
                'usage_history': item['used_stock'],
                'daily_consumption': float(item['daily_consumption'])  # Make sure this is a float
            }
            predictions.append(prediction)
        
        return predictions
    
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