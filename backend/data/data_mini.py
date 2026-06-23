import pandas as pd
import json

# Replace with your actual file name
FILE_PATH = r"C:\Users\Vivek\Downloads\prototype_phase_datasets\jan to may police violation_anonymized791b166.csv"

print("Loading 100MB dataset...")
df = pd.read_csv(FILE_PATH)

print("\n=========================================")
print("1. DATASET SHAPE (Rows x Columns)")
print("=========================================")
print(df.shape)

print("\n=========================================")
print("2. COLUMN NAMES & MISSING VALUES")
print("=========================================")
missing_data = df.isnull().sum()
print(missing_data[missing_data > 0])
print("\nAll Columns:", df.columns.tolist())

print("\n=========================================")
print("3. RAW JSON FORMAT CHECK (First 3 Rows)")
print("=========================================")
# We need to see exactly how the dates and JSON strings are formatted
sample_records = df.head(3).to_dict(orient='records')
print(json.dumps(sample_records, indent=2, default=str))

print("\n=========================================")
print("4. TOP VEHICLE TYPES (Raw Data)")
print("=========================================")
if 'vehicle_type' in df.columns:
    print(df['vehicle_type'].value_counts().head(10))

print("\n=========================================")
print("5. TOP RAW VIOLATIONS (Raw Data)")
print("=========================================")
if 'violation_type' in df.columns:
    print(df['violation_type'].value_counts().head(10))