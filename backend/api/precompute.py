import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from data.process import load_and_clean_data
from ml.hotspot_detector import detect_hotspots
from ml.congestion_scorer import compute_cis
from ml.temporal_forecaster import forecast_temporal
from ml.enforcement_optimizer import optimize_enforcement

# Base directory of the project (2 levels up from backend/api/precompute.py)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Using relative paths so it works on any computer
CSV_PATH = os.path.join(BASE_DIR, "backend", "data", "dataset.csv") 
OUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "data")

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # 1. Process
    df = load_and_clean_data(CSV_PATH)
    
    # 2. Analytics Data
    print("Generating analytics data...")
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
        "byMonth": [{"month": m, "count": int(c)} for m, c in df['month'].value_counts().sort_index().items()],
        "byPoliceStation": [{"station": s, "count": int(c)} for s, c in df['police_station'].value_counts().items()],
        "byStationData": {}
    }
    
    for station in df['police_station'].dropna().unique():
        sdf = df[df['police_station'] == station]
        peak_hour_val = int(sdf['hour_ist'].mode().iloc[0]) if not sdf.empty else 12
        analytics_data['byStationData'][str(station)] = {
            "summary": {
                "totalViolations": len(sdf),
                "avgDailyViolations": int(len(sdf) / 150),
                "peakHour": f"{peak_hour_val%12 or 12}:00 {'AM' if peak_hour_val < 12 else 'PM'}"
            },
            "byHour": [{"hour": int(h), "hourIST": f"{int(h)%12 or 12}:00 {'AM' if int(h) < 12 else 'PM'}", "count": int(c)} for h, c in sdf['hour_ist'].value_counts().sort_index().items()],
            "byViolationType": [{"type": t, "count": int(c)} for t, c in sdf['primary_violation'].value_counts().head(10).items()]
        }
        
    with open(os.path.join(OUT_DIR, "analytics_data.json"), "w") as f:
        json.dump(analytics_data, f)
        
    # 3. Hotspots
    hotspots, df = detect_hotspots(df)
    hotspots = compute_cis(hotspots)
    
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
        
    analytics_data['summary']['totalHotspots'] = len(hotspots)
    analytics_data['summary']['avgCIS'] = hotspots_data['stats']['avgCIS']
    with open(os.path.join(OUT_DIR, "analytics_data.json"), "w") as f:
        json.dump(analytics_data, f)
        
    # 4. Temporal & Forecaster
    temporal_data = forecast_temporal(df)
    
    predictions_data = {
        "zoneForecasts": temporal_data['zoneForecasts']
    }
    with open(os.path.join(OUT_DIR, "temporal_data.json"), "w") as f:
        json.dump({"hourly": temporal_data['hourly']}, f)
        
    with open(os.path.join(OUT_DIR, "predictions_data.json"), "w") as f:
        json.dump(predictions_data, f)
        
    # 5. Enforcement Optimization
    enforcement_data = optimize_enforcement(hotspots)
    with open(os.path.join(OUT_DIR, "enforcement_data.json"), "w") as f:
        json.dump(enforcement_data, f)
        
    # 6. Violations Points
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
        
    print("Done! Output written to", OUT_DIR)

if __name__ == "__main__":
    main()
