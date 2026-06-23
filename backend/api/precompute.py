import sys
import os
import json
import pandas as pd
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.process import load_and_clean_data
from ml.hotspot_detector import detect_hotspots
from ml.grandmaster_ml import SingleDatasetGridlockAI
from ml.temporal_forecaster import forecast_temporal
from ml.enforcement_optimizer import optimize_enforcement

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSV_PATH = os.path.join(BASE_DIR, "backend", "data", "jan to may police violation_anonymized791b166.csv") 
OUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "data")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    df = load_and_clean_data(CSV_PATH)
    
    # 1. Restore Analytics Payload (FIXED: Added byPoliceStation for the dropdown)
    print("Generating Analytics Data...")
    analytics_data = {
        "summary": {
            "totalViolations": len(df),
            "avgDailyViolations": int(len(df) / 150),
            "topZone": df['police_station'].mode().iloc[0],
            "peakHour": f"{df['hour_ist'].mode().iloc[0]%12 or 12}:00 {'AM' if df['hour_ist'].mode().iloc[0] < 12 else 'PM'}"
        },
        "byHour": [{"hour": int(h), "hourIST": f"{int(h)%12 or 12}:00 {'AM' if int(h) < 12 else 'PM'}", "count": int(c)} for h, c in df['hour_ist'].value_counts().sort_index().items()],
        "byDayOfWeek": [{"day": d, "count": int(c)} for d, c in df['day_of_week'].value_counts().items()],
        "byViolationType": [{"type": t, "count": int(c)} for t, c in df['primary_violation'].value_counts().head(10).items()],
        "byVehicleType": [{"type": t, "count": int(c)} for t, c in df['vehicle_type'].value_counts().head(10).items()],
        "byPoliceStation": [{"station": s, "count": int(c)} for s, c in df['police_station'].value_counts().items()],
        "byStationData": {s: df[df['police_station'] == s]['primary_violation'].value_counts().to_dict() for s in df['police_station'].unique()}
    }
    with open(os.path.join(OUT_DIR, "analytics_data.json"), "w") as f:
        json.dump(analytics_data, f)
    
    # 2. AI & Hotspots
    ai_engine = SingleDatasetGridlockAI()
    train_df = ai_engine.engineer_gridlock_target(df)
    ai_engine.train_predictor(train_df)
    
    # Save model evaluation metrics
    with open(os.path.join(OUT_DIR, "model_metrics.json"), "w") as f:
        json.dump(ai_engine.metrics, f, indent=2)
    
    hotspots, df_sampled = detect_hotspots(df)
    hotspots = ai_engine.predict_hotspot_severity(hotspots)
    
    hotspots_data = {
        "hotspots": hotspots,
        "stats": {
            "totalHotspots": len(hotspots),
            "avgCIS": round(sum(h['cisScore'] for h in hotspots) / len(hotspots), 1) if hotspots else 0,
            "criticalCount": sum(1 for h in hotspots if h['severity'] == 'critical'),
            "highCount": sum(1 for h in hotspots if h['severity'] == 'high')
        }
    }
    with open(os.path.join(OUT_DIR, "hotspots_data.json"), "w") as f:
        json.dump(hotspots_data, f)
        
    # 3. UI Analytics & Enforcement
    temporal_data = forecast_temporal(df)
    with open(os.path.join(OUT_DIR, "temporal_data.json"), "w") as f:
        json.dump({"hourly": temporal_data['hourly']}, f)
    with open(os.path.join(OUT_DIR, "predictions_data.json"), "w") as f:
        json.dump({"zoneForecasts": temporal_data['zoneForecasts']}, f)
        
    enforcement_data = optimize_enforcement(hotspots)
    with open(os.path.join(OUT_DIR, "enforcement_data.json"), "w") as f:
        json.dump(enforcement_data, f)
        
    # 4. Restore Violations Points for Heatmap (FIXED: Added dynamic mapping arrays)
    print("Generating violations points (compact format)...")
    violation_types = df['primary_violation'].unique().tolist()
    vehicle_types = df['vehicle_type'].unique().tolist()
    
    violation_idx = {v: i for i, v in enumerate(violation_types)}
    vehicle_idx = {v: i for i, v in enumerate(vehicle_types)}
    
    severity_map = {
        'PARKING IN A MAIN ROAD': 3,
        'DOUBLE PARKING': 3,
        'WRONG PARKING': 2,
        'NO PARKING': 1
    }
    
    points = []
    for _, row in df[['latitude', 'longitude', 'hour_ist', 'primary_violation', 'vehicle_type', 'is_weekend']].iterrows():
        points.append([
            round(row['longitude'], 5), 
            round(row['latitude'], 5),
            int(row['hour_ist']),
            violation_idx[row['primary_violation']],
            vehicle_idx[row['vehicle_type']],
            int(row['is_weekend']),
            severity_map.get(row['primary_violation'], 1)
        ])
        
    violations_points = {
        "points": points,
        "violationTypes": violation_types,
        "vehicleTypes": vehicle_types,
        "totalCount": len(df)
    }
    with open(os.path.join(OUT_DIR, "violations_points.json"), "w") as f:
        json.dump(violations_points, f)
        
    print("Done! React Dashboard will now load perfectly.")

if __name__ == "__main__":
    main()