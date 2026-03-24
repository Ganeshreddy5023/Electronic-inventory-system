import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_electronics_data(num_days=365):
    np.random.seed(42)
    categories = [
        'Smartphone', 'Laptop', 'Tablet', 'Headphones', 
        'Smartwatch', 'Charger', 'Accessory', 'Camera', 'TV',
        'Gaming Console', 'Drone', 'VR Headset', 'Speaker', 'Projector'
    ]
    brands = {
        'Smartphone': ['iPhone', 'Galaxy', 'Pixel', 'OnePlus', 'Redmi'],
        'Laptop': ['MacBook', 'XPS', 'ThinkPad', 'ZenBook', 'Razer Blade'],
        'Tablet': ['iPad', 'Galaxy Tab', 'Surface Pro', 'Lenovo Tab'],
        'Headphones': ['Sony', 'Bose', 'AirPods', 'Sennheiser', 'JBL'],
        'Smartwatch': ['Apple Watch', 'Galaxy Watch', 'Garmin', 'Fitbit'],
        'Charger': ['Anker', 'Belkin', 'Samsung 45W', 'Apple 20W'],
        'Accessory': ['Silicone Case', 'USB-C Cable', 'Screen Protector', 'Power Bank'],
        'Camera': ['Sony Alpha', 'Canon EOS', 'Fujifilm X', 'Nikon Z'],
        'TV': ['Samsung QLED', 'LG OLED', 'Sony Bravia', 'TCL MiniLED'],
        'Gaming Console': ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch'],
        'Drone': ['DJI Mavic', 'DJI Mini', 'Autel Robotics', 'Ryze Tello'],
        'VR Headset': ['Meta Quest', 'PlayStation VR', 'Valve Index', 'HP Reverb'],
        'Speaker': ['Marshall Emberton', 'Sonos One', 'JBL Boombox', 'Bose SoundLink'],
        'Projector': ['BenQ 4K', 'Epson Home Cinema', 'ViewSonic', 'Optoma']
    }
    
    products = []
    for cat in categories:
        for brand in brands[cat]:
            # Each brand might have 2-3 specific models
            models = ['Base', 'Pro', 'Ultra'] if cat in ['Smartphone', 'Laptop', 'Tablet'] else ['Standard']
            for model in models:
                products.append({
                    'name': f"{brand} {model}" if model != 'Standard' else brand, 
                    'category': cat, 
                    'base_demand': random.randint(3, 15) if cat not in ['Charger', 'Accessory'] else random.randint(15, 40)
                })
    
    start_date = datetime.now() - timedelta(days=num_days)
    sales_data = []
    
    for day in range(num_days):
        current_date = start_date + timedelta(days=day)
        is_weekend = current_date.weekday() >= 5
        month = current_date.month
        
        # Seasonal boost (Holidays, Sale seasons)
        seasonal_boost = 1.6 if month in [10, 11, 12] else (1.3 if month in [5, 6] else 1.0)
        
        for p in products:
            daily_variation = np.random.normal(1, 0.25)
            weekend_boost = 1.35 if is_weekend else 1.0
            
            quantity_sold = int(p['base_demand'] * seasonal_boost * weekend_boost * daily_variation)
            quantity_sold = max(0, quantity_sold)
            
            sales_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'product_name': p['name'],
                'category': p['category'],
                'quantity_sold': quantity_sold,
                'price': random.randint(100, 2500)
            })
            
    df = pd.DataFrame(sales_data)
    
    # Current Inventory
    inventory = []
    for p in products:
        price_range = {
            'Smartphone': (15000, 120000), 'Laptop': (35000, 250000), 'Tablet': (20000, 90000),
            'Headphones': (2000, 35000), 'Smartwatch': (5000, 50000), 'Charger': (500, 5000),
            'Accessory': (300, 10000), 'Camera': (40000, 350000), 'TV': (30000, 450000),
            'Gaming Console': (30000, 60000), 'Drone': (25000, 300000), 'VR Headset': (35000, 120000),
            'Speaker': (10000, 80000), 'Projector': (40000, 250000)
        }
        low, high = price_range[p['category']]
        
        # High volume items have higher stock levels
        stock_multiplier = 4 if p['category'] in ['Charger', 'Accessory'] else 1
        
        inventory.append({
            'name': p['name'],
            'category': p['category'],
            'current_stock': random.randint(10, 100) * stock_multiplier,
            'min_threshold': 20 * stock_multiplier,
            'price': random.randint(low, high)
        })
    inv_df = pd.DataFrame(inventory)
    
    return df, inv_df

if __name__ == "__main__":
    sales_df, inv_df = generate_electronics_data()
    sales_df.to_csv('electronics_sales.csv', index=False)
    inv_df.to_csv('electronics_inventory.csv', index=False)
    print(f"Dataset generated. {len(sales_df)} sales rows across {len(inv_df)} products.")
