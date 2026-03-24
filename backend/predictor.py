import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os
from datetime import datetime, timedelta

class DemandModel:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
        self.cat_map = {}

    def preprocess(self, df):
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['day_of_week'] = df['date'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Dynamic mapping for categories
        if not self.cat_map:
            cats = df['category'].unique()
            self.cat_map = {cat: i for i, cat in enumerate(cats)}
            joblib.dump(self.cat_map, 'cat_map.pkl')
            
        df['cat_id'] = df['category'].map(self.cat_map)
        
        return df[['month', 'day_of_week', 'is_weekend', 'cat_id']], df['quantity_sold']

    def train(self, sales_path='electronics_sales.csv'):
        if not os.path.exists(sales_path):
            from data_generator import generate_electronics_data
            sales_df, inv_df = generate_electronics_data()
            sales_df.to_csv(sales_path, index=False)
            inv_df.to_csv('electronics_inventory.csv', index=False)
        else:
            sales_df = pd.read_csv(sales_path)
            
        X, y = self.preprocess(sales_df)
        self.model.fit(X, y)
        self.is_trained = True
        joblib.dump(self.model, 'demand_model.pkl')
        print("Demand Prediction Model re-trained with all categories.")

    def predict_future(self, category, days_ahead=30):
        if not self.is_trained:
            if os.path.exists('demand_model.pkl'):
                self.model = joblib.load('demand_model.pkl')
                self.cat_map = joblib.load('cat_map.pkl')
                self.is_trained = True
            else:
                self.train()

        cat_id = self.cat_map.get(category, 0)
        predictions = []
        start_date = datetime.now()
        
        for i in range(days_ahead):
            future_date = start_date + timedelta(days=i)
            features = pd.DataFrame([{
                'month': future_date.month,
                'day_of_week': future_date.weekday(),
                'is_weekend': 1 if future_date.weekday() >= 5 else 0,
                'cat_id': cat_id
            }])
            
            pred = self.model.predict(features)[0]
            predictions.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted_demand': int(round(pred))
            })
            
        return predictions
