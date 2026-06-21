import pandas as pd

def forecast_temporal(df):
    print("Forecasting temporal patterns...")
    
    zone_hour = df.groupby(['police_station', 'hour_ist']).size().unstack(fill_value=0)
    
    zone_forecasts = []
    top_zones = df['police_station'].value_counts().head(20).index
    
    for zone in top_zones:
        if zone == 'UNKNOWN':
            continue
            
        zone_df = df[df['police_station'] == zone]
        days_in_dataset = 150
        hourly_avg = zone_df.groupby('hour_ist').size().reindex(range(24), fill_value=0) / days_in_dataset
        
        morning = hourly_avg.loc[6:11].sum()
        afternoon = hourly_avg.loc[12:16].sum()
        evening = hourly_avg.loc[17:21].sum()
        night = hourly_avg.loc[[22, 23, 0, 1, 2, 3, 4, 5]].sum()
        
        total_pred = morning + afternoon + evening + night
        
        if total_pred > 100:
            risk = 'critical'
        elif total_pred > 50:
            risk = 'high'
        elif total_pred > 20:
            risk = 'medium'
        else:
            risk = 'low'
            
        top_type = zone_df['primary_violation'].mode().iloc[0] if not zone_df['primary_violation'].mode().empty else 'UNKNOWN'
            
        zone_forecasts.append({
            'zone': zone,
            'predictedViolations': {
                'morning': int(morning * 1.2), 
                'afternoon': int(afternoon * 1.2),
                'evening': int(evening * 1.2),
                'night': int(night * 1.2)
            },
            'riskLevel': risk,
            'confidence': round(0.75 + (0.2 * (total_pred / 150)), 2),
            'topPredictedType': top_type,
            'trend': 'increasing' if evening > afternoon else 'stable'
        })
        
    hourly_overall = df.groupby('hour_ist').size() / days_in_dataset * 1.2
    
    hourly_data = []
    for h in range(24):
        hourly_data.append({
            'hour': h,
            'hourIST': f"{h%12 or 12}:00 {'AM' if h < 12 else 'PM'}",
            'avgViolations': int(hourly_overall.get(h, 0)),
            'zones': {z: int(zone_hour.loc[z, h] / days_in_dataset * 1.2) if h in zone_hour.columns else 0 for z in top_zones[:5]}
        })
        
    return {
        'zoneForecasts': zone_forecasts,
        'hourly': hourly_data
    }
