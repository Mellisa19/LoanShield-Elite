from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
from lime import lime_tabular
import random

app = FastAPI(title="LoanShield Elite API")

# Mount static files
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load model, scaler and LIME requirements
try:
    model = joblib.load('model.pkl')
    scaler = joblib.load('scaler.pkl')
    train_sample = joblib.load('train_sample.pkl')
    feature_names = joblib.load('feature_names.pkl')
    
    # Initialize LIME explainer
    explainer = lime_tabular.LimeTabularExplainer(
        train_sample,
        feature_names=feature_names,
        class_names=['Low Risk', 'High Risk'],
        mode='classification'
    )
except Exception as e:
    print(f"Error loading system files: {e}")

class TransactionData(BaseModel):
    student: str
    balance: float
    income: float
    threshold: float = 0.3

@app.get("/")
async def read_index():
    from fastapi.responses import FileResponse
    return FileResponse('static/index.html')

@app.post("/predict")
async def predict_fraud(data: TransactionData):
    try:
        student_val = 1 if data.student.lower() == "yes" else 0
        input_df = pd.DataFrame([{
            'balance': data.balance,
            'income': data.income,
            'student_Yes': student_val
        }])
        
        input_scaled = scaler.transform(input_df)
        prob = float(model.predict_proba(input_scaled)[0, 1])
        
        # Use dynamic threshold from request
        is_high_risk = bool(prob >= data.threshold)
        
        # --- NEW: Risk Tier Logic ---
        if prob < 0.1: tier = "Low Risk"
        elif prob < 0.3: tier = "Minimal Risk"
        elif prob < 0.6: tier = "Elevated Risk"
        elif prob < 0.8: tier = "High Risk"
        else: tier = "Critical Risk"
        
        # --- PHASE 2: Generate LIME Explanation ---
        exp = explainer.explain_instance(
            input_scaled[0], 
            model.predict_proba,
            num_features=3
        )
        
        explanation_list = exp.as_list()
        reasons = []
        for feature, weight in explanation_list:
            impact = "Increases Risk" if weight > 0 else "Decreases Risk"
            clean_name = feature.split(' ')[0].replace('_Yes', '').capitalize()
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
        student = random.choice(["Yes", "No"])
        balance = random.uniform(0, 3000)
        income = random.uniform(10000, 70000)
        
        student_val = 1 if student == "Yes" else 0
        input_df = pd.DataFrame([{'balance': balance, 'income': income, 'student_Yes': student_val}])
        input_scaled = scaler.transform(input_df)
        prob = model.predict_proba(input_scaled)[0, 1]
        
        results.append({
            "student": student,
            "balance": round(balance, 2),
            "income": round(income, 2),
            "is_fraud": bool(prob >= 0.3)
        })
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
