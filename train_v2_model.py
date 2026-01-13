import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix
import joblib

# 1. Load Data
print("Loading v2 dataset...")
df = pd.read_csv('Dataset/Default v2.cvs.csv')

# 2. Rename & Clean
print("Cleaning data...")
df.columns = ['id', 'employed', 'bank_balance', 'annual_salary', 'defaulted']
df = df.drop('id', axis=1)

# 3. Feature Engineering
print("Engineering features...")
# DTI: Debt to Income (Handling 0 income if any - though EDA showed min salary ~9k)
df['debt_to_income'] = df['bank_balance'] / df['annual_salary']

# Feature Selection
features = ['employed', 'bank_balance', 'annual_salary', 'debt_to_income']
target = 'defaulted'

X = df[features]
y = df[target]

print(f"Features: {features}")
print(f"Target distribution:\n{y.value_counts(normalize=True)}")

# 4. Split (Stratified)
splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(splitter.split(X, y))
X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

# 5. Preprocessing (Scaling)
print("Scaling data...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 6. Train Model (Weighted Logistic Regression)
print("Training Balanced Logistic Regression...")
model = LogisticRegression(class_weight='balanced', random_state=42)
model.fit(X_train_scaled, y_train)

# 7. Evaluate
print("\n--- Evaluation on Test Set ---")
y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
y_pred = model.predict(X_test_scaled)

roc_auc = roc_auc_score(y_test, y_pred_proba)
print(f"ROC-AUC Score: {roc_auc:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)

# 8. Save Artifacts for v2
print("\nSaving v2 artifacts...")
joblib.dump(model, 'model_v2.pkl')
joblib.dump(scaler, 'scaler_v2.pkl')
joblib.dump(features, 'feature_names_v2.pkl')

# Save a sample for LIME (using numpy array structure)
sample_size = min(500, len(X_train_scaled))
joblib.dump(X_train_scaled[:sample_size], 'train_sample_v2.pkl')

print("Done. Model v2 ready.")
