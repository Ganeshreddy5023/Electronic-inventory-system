from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import random
from datetime import datetime, timedelta
from predictor import DemandModel
import os

import json

app = Flask(__name__)
CORS(app)

model = DemandModel()

USER_DB = 'users.json'

def initialize_data():
    if not os.path.exists(USER_DB):
        with open(USER_DB, 'w') as f:
            json.dump([], f)
    
    # Also ensure it has a valid list even if it exists but is empty/corrupt
    try:
        with open(USER_DB, 'r') as f:
            json.load(f)
    except:
        with open(USER_DB, 'w') as f:
            json.dump([], f)

    
    if os.path.exists('electronics_sales.csv'):
        os.remove('electronics_sales.csv')
    if os.path.exists('electronics_inventory.csv'):
        os.remove('electronics_inventory.csv')
    
    from data_setup import generate_electronics_data
    sales_df, inv_df = generate_electronics_data()
    sales_df.to_csv('electronics_sales.csv', index=False)
    inv_df.to_csv('electronics_inventory.csv', index=False)
    model.train()

# Auth Endpoints
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
        
    with open(USER_DB, 'r') as f:
        users = json.load(f)
        
    if any(u['username'] == username for u in users):
        return jsonify({"error": "User already exists"}), 400
        
    users.append({"username": username, "password": password})
    with open(USER_DB, 'wb') as f:
        f.write(json.dumps(users).encode('utf-8'))
        
    return jsonify({"message": "Registration successful"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    with open(USER_DB, 'r') as f:
        users = json.load(f)
        
    user = next((u for u in users if u['username'] == username and u['password'] == password), None)
    
    if user:
        return jsonify({"message": "Login successful", "user": {"username": username}}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# Re-initialize with full data
initialize_data()
if not os.path.exists('cat_map.pkl'):
    pass # initialize_data already called


@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    inv_df = pd.read_csv('electronics_inventory.csv')
    return jsonify(inv_df.to_dict(orient='records'))

@app.route('/api/product', methods=['POST'])
def add_product():
    data = request.json
    inv_df = pd.read_csv('electronics_inventory.csv')
    
    new_product = {
        'name': data.get('name'),
        'category': data.get('category'),
        'current_stock': int(data.get('current_stock', 0)),
        'min_threshold': int(data.get('min_threshold', 20)),
        'price': int(data.get('price', 0))
    }
    
    # Check if exists
    if new_product['name'] in inv_df['name'].values:
        return jsonify({"error": "Product already exists"}), 400
        
    inv_df = pd.concat([inv_df, pd.DataFrame([new_product])], ignore_index=True)
    inv_df.to_csv('electronics_inventory.csv', index=False)
    return jsonify({"message": "Product added successfully", "product": new_product})

@app.route('/api/product/<string:name>', methods=['PUT'])
def update_product(name):
    data = request.json
    inv_df = pd.read_csv('electronics_inventory.csv')
    
    if name not in inv_df['name'].values:
        return jsonify({"error": "Product not found"}), 404
        
    idx = inv_df[inv_df['name'] == name].index[0]
    
    if 'current_stock' in data: inv_df.at[idx, 'current_stock'] = int(data['current_stock'])
    if 'price' in data: inv_df.at[idx, 'price'] = int(data['price'])
    if 'min_threshold' in data: inv_df.at[idx, 'min_threshold'] = int(data['min_threshold'])
    if 'category' in data: inv_df.at[idx, 'category'] = data['category']
    
    inv_df.to_csv('electronics_inventory.csv', index=False)
    return jsonify({"message": "Product updated successfully"})

@app.route('/api/product/<string:name>', methods=['DELETE'])
def delete_product(name):
    inv_df = pd.read_csv('electronics_inventory.csv')
    
    if name not in inv_df['name'].values:
        return jsonify({"error": "Product not found"}), 404
        
    inv_df = inv_df[inv_df['name'] != name]
    inv_df.to_csv('electronics_inventory.csv', index=False)
    return jsonify({"message": "Product deleted successfully"})

@app.route('/api/predict', methods=['GET'])
def get_predictions():
    cat = request.args.get('category', 'Smartphone')
    days = int(request.args.get('days', 30))
    predictions = model.predict_future(cat, days_ahead=days)
    return jsonify(predictions)

@app.route('/api/restock', methods=['POST'])
def restock_product():
    data = request.json
    name = data.get('name')
    quantity = int(data.get('quantity', 0))
    
    inv_df = pd.read_csv('electronics_inventory.csv')
    if name not in inv_df['name'].values:
        return jsonify({"error": "Product not found"}), 404
        
    idx = inv_df[inv_df['name'] == name].index[0]
    inv_df.at[idx, 'current_stock'] = int(inv_df.at[idx, 'current_stock']) + quantity
    
    inv_df.to_csv('electronics_inventory.csv', index=False)
    return jsonify({
        "message": f"Restocked {quantity} units of {name}",
        "new_stock": int(inv_df.at[idx, 'current_stock'])
    })

@app.route('/api/sell', methods=['POST'])
def sell_product():
    data = request.json
    name = data.get('name')
    quantity = int(data.get('quantity', 1))
    
    inv_df = pd.read_csv('electronics_inventory.csv')
    if name not in inv_df['name'].values:
        return jsonify({"error": "Product not found"}), 404
        
    idx = inv_df[inv_df['name'] == name].index[0]
    current_stock = int(inv_df.at[idx, 'current_stock'])
    
    if current_stock < quantity:
        return jsonify({"error": f"Insufficient stock. Available: {current_stock}"}), 400
        
    inv_df.at[idx, 'current_stock'] = current_stock - quantity
    inv_df.to_csv('electronics_inventory.csv', index=False)
    
    # Record sale in sales history
    sales_df = pd.read_csv('electronics_sales.csv')
    new_sale = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'category': inv_df.at[idx, 'category'],
        'quantity_sold': quantity
    }
    sales_df = pd.concat([sales_df, pd.DataFrame([new_sale])], ignore_index=True)
    sales_df.to_csv('electronics_sales.csv', index=False)
    
    return jsonify({
        "message": f"Sold {quantity} units of {name}",
        "new_stock": int(inv_df.at[idx, 'current_stock'])
    })

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_summary():
    inv_df = pd.read_csv('electronics_inventory.csv')
    sales_df = pd.read_csv('electronics_sales.csv')
    
    # Multi-category analysis
    cat_summary = inv_df.groupby('category')['current_stock'].sum().to_dict()
    
    # Detailed recommendations
    low_stock = inv_df[inv_df['current_stock'] <= inv_df['min_threshold']]
    recommendations = []
    
    # Take top 5 critical items
    for _, item in low_stock.head(5).iterrows():
        pred = model.predict_future(item['category'], days_ahead=30)
        total_pred = sum([p['predicted_demand'] for p in pred])
        recommendations.append({
            'product': item['name'],
            'current_stock': int(item['current_stock']),
            'predicted_demand_30d': total_pred,
            'suggested_order': int(max(20, total_pred - item['current_stock'] + 10)),
            'priority': 'Critical' if item['current_stock'] < (item['min_threshold'] / 2) else 'High'
        })

    sales_df['date'] = pd.to_datetime(sales_df['date'])
    last_30 = sales_df[sales_df['date'] > (datetime.now() - timedelta(days=30))]
    trend = last_30.groupby('date')['quantity_sold'].sum().reset_index()
    trend['date'] = trend['date'].dt.strftime('%b %d')

    return jsonify({
        'stats': {
            'total_products': len(inv_df),
            'stock_value': int((inv_df['current_stock'] * inv_df['price']).sum()),
            'low_stock_count': len(low_stock)
        },
        'cat_summary': cat_summary,
        'recommendations': recommendations,
        'sales_trend': trend.to_dict(orient='records'),
        'alerts': [
            {"id": 1, "msg": "Camera section seeing 20% growth", "type": "info"},
            {"id": 2, "msg": "Logistics delay for TV shipments", "type": "warning"}
        ]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
