import pandas as pd
import json
import warnings
warnings.filterwarnings('ignore')

def load_and_clean_data(csv_path):
    print("Ingesting 298,450 Spatio-Temporal Records...")
    df = pd.read_csv(csv_path, low_memory=False)
    
    def parse_violation(v):
        if pd.isna(v): return ['UNKNOWN']
        try: return json.loads(v)
        except: return ['UNKNOWN']
    
    df['parsed_violations'] = df['violation_type'].apply(parse_violation)
    df['primary_violation'] = df['parsed_violations'].apply(lambda x: x[0] if len(x) > 0 else 'UNKNOWN')
    
    # Timezone correction
    df['created_dt'] = pd.to_datetime(df['created_datetime'], utc=True, format='mixed')    
    df['created_ist'] = df['created_dt'] + pd.Timedelta(hours=13)
    df['hour_ist'] = df['created_ist'].dt.hour
    df['day_of_week'] = df['created_ist'].dt.day_name()
    df['month'] = df['created_ist'].dt.strftime('%Y-%m')
    df['is_weekend'] = df['created_ist'].dt.dayofweek >= 5
    
    df['vehicle_type'] = df['vehicle_type'].fillna('UNKNOWN')
    df['police_station'] = df['police_station'].fillna('UNKNOWN')
    df['junction_name'] = df['junction_name'].fillna('No Junction')
    
    df = df.dropna(subset=['latitude', 'longitude'])
    return df