import pandas as pd
import numpy as np

# Define file path
file_path = r'Dataset/Default v2.cvs.csv'
df = pd.read_csv(file_path)

# Rename columns for engineering best practices
df.columns = ['id', 'employed', 'bank_balance', 'annual_salary', 'defaulted']

print("\n--- Renamed Columns ---")
print(df.columns.tolist())

# Target Analysis
print("\n--- Target Variable 'defaulted' ---")
print(df['defaulted'].value_counts(normalize=True))
print(f"Total Defaulters: {df['defaulted'].sum()} out of {len(df)}")

# Statistical Review
print("\n--- Financial Features Stats ---")
print(df[['bank_balance', 'annual_salary']].describe().to_string())

# Grouped Analysis
print("\n--- Mean Values by Default Status ---")
print(df.groupby('defaulted')[['bank_balance', 'annual_salary', 'employed']].mean().to_string())

# Outlier Detection (using IQR)
for col in ['bank_balance', 'annual_salary']:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
    print(f"\nPotential outliers in {col}: {len(outliers)} rows (Thresholds: {lower_bound:.2f}, {upper_bound:.2f})")
    if len(outliers) > 0:
        print(f"Max value: {df[col].max()}")

# Correlations
print("\n--- Correlation Matrix ---")
print(df[['employed', 'bank_balance', 'annual_salary', 'defaulted']].corr().to_string())
