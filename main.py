from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
from lime import lime_tabular
import random

app = FastAPI(title="LoanShield Elite API v2")

# Mount static files
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load v2 model artifacts
try:
    print("Loading v2 model artifacts...")
    model = joblib.load('model_v2.pkl')
    scaler = joblib.load('scaler_v2.pkl')
    train_sample = joblib.load('train_sample_v2.pkl')
    # Feature names were saved as list: ['employed', 'bank_balance', 'annual_salary', 'debt_to_income']
    feature_names = joblib.load('feature_names_v2.pkl')
    
    # Initialize LIME explainer
    explainer = lime_tabular.LimeTabularExplainer(
        train_sample,
        feature_names=feature_names,
        class_names=['Low Risk', 'High Risk'],
        mode='classification'
    )
    print("Model v2 Loaded Successfully.")
except Exception as e:
    print(f"Error loading system files: {e}")
    model = None

class TransactionData(BaseModel):
    employed: str
    balance: float
    income: float
    threshold: float = 0.3

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_version": "v2", "model_loaded": model is not None}

@app.get("/")
async def read_index():
    from fastapi.responses import FileResponse
    return FileResponse('static/index.html')

@app.post("/predict")
async def predict_fraud(data: TransactionData):
    try:
        # Feature Engineering for v2
        employed_val = 1 if data.employed.lower() in ["yes", "employed"] else 0
        
        # Guard against zero income division
        income_safe = data.income if data.income > 0 else 1.0
        dti = data.balance / income_safe
        
        # Prepare DataFrame with exact feature order used in training
        input_df = pd.DataFrame([{
            'employed': employed_val,
            'bank_balance': data.balance,
            'annual_salary': data.income,
            'debt_to_income': dti
        }])
        
        # Scale
        input_scaled = scaler.transform(input_df)
        
        # Predict
        prob = float(model.predict_proba(input_scaled)[0, 1])
        
        # Use dynamic threshold
        is_high_risk = bool(prob >= data.threshold)
        
        # Risk Tier Logic
        if prob < 0.1: tier = "Low Risk"
        elif prob < 0.3: tier = "Minimal Risk"
        elif prob < 0.6: tier = "Elevated Risk"
        elif prob < 0.8: tier = "High Risk"
        else: tier = "Critical Risk"
        
        # Generate LIME Explanation
        exp = explainer.explain_instance(
            input_scaled[0], 
            model.predict_proba,
            num_features=3
        )
        
        explanation_list = exp.as_list()
        reasons = []
        for feature, weight in explanation_list:
            impact = "Increases Risk" if weight > 0 else "Decreases Risk"
            # Cleaning the name manually if needed, but feature_names passed to explainer should handle it mostly
            clean_name = feature.split(' ')[0].replace('_', ' ').title()
            reasons.append({"feature": clean_name, "impact": impact, "weight": float(weight)})

        return {
            "is_fraud": is_high_risk,
            "probability": round(prob, 4),
            "tier": tier,
            "threshold": data.threshold,
            "status": "Risk Identified" if is_high_risk else "Safe",
            "explanation": reasons
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stress-test")
async def stress_test():
    """Generates 50 random transactions to show UI dynamics"""
    results = []
    for _ in range(50):
        # Simulate realistic distributions
        employed = random.choice(["Yes", "No"]) 
        # Non-defaulters usually have lower balance, Defaulters higher
        balance = random.uniform(0, 25000)
        income = random.uniform(30000, 150000)
        
        # Feature Calc
        employed_val = 1 if employed == "Yes" else 0
        dti = balance / income if income > 0 else 0
        
        input_df = pd.DataFrame([{
            'employed': employed_val, 
            'bank_balance': balance, 
            'annual_salary': income,
            'debt_to_income': dti
        }])
        
        input_scaled = scaler.transform(input_df)
        prob = model.predict_proba(input_scaled)[0, 1]
        
        results.append({
            "employed": employed,
            "balance": round(balance, 2),
            "income": round(income, 2),
            "is_fraud": bool(prob >= 0.3)
        })
    return results

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
