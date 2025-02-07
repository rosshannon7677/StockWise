import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import os

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
        
    def fetch_inventory_data(self):
        inventory_ref = db.collection('inventoryItems')
        docs = inventory_ref.stream()
        
        stock_data = []
        for doc in docs:
            data = doc.to_dict()
            # Calculate daily consumption rate
            stock_data.append({
                'product_id': doc.id,
                'name': data['name'],
                'current_quantity': data['quantity'],
                'price': data['price'],
                'category': data['category'],
                'days_until_low': self._calculate_days_until_low(data)
            })
        
        return pd.DataFrame(stock_data)
    
    def _calculate_days_until_low(self, item_data):
        # Simple calculation - can be enhanced with actual historical data
        current_quantity = item_data['quantity']
        if current_quantity <= 10:
            return 0
        
        # Estimate consumption rate (can be improved with real data)
        daily_consumption = 0.5 if current_quantity > 20 else 1
        return int((current_quantity - 10) / daily_consumption)
    
    def train_model(self):
        data = self.fetch_inventory_data()
        
        # Features for prediction
        X = data[['current_quantity', 'price']]
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
        # Train model if not already trained
        if not self.is_trained:
            self.train_model()
            self.is_trained = True
            
        data = self.fetch_inventory_data()
        predictions = []
        
        for _, item in data.iterrows():
            prediction = {
                'product_id': item['product_id'],
                'name': item['name'],
                'current_quantity': item['current_quantity'],
                'predicted_days_until_low': int(max(0, self.model.predict([[
                    item['current_quantity'], 
                    item['price']
                ]])[0])),
                'confidence_score': self._calculate_confidence(item),
                'recommended_restock_date': (
                    datetime.now() + timedelta(days=int(item['days_until_low']))
                ).isoformat()
            }
            predictions.append(prediction)
        
        return predictions
    
    def _calculate_confidence(self, item):
        # Simplified confidence calculation
        if item['current_quantity'] < 5:
            return 0.9
        elif item['current_quantity'] < 10:
            return 0.7
        return 0.5