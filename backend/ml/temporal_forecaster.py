import pandas as pd
import numpy as np

def forecast_temporal(df):
    print("Forecasting temporal patterns...")
    
    # Compute actual days in dataset instead of hardcoding
    date_series = pd.to_datetime(df['created_ist']).dt.date
    days_in_dataset = max(1, (date_series.max() - date_series.min()).days + 1)
    
    zone_forecasts = []
    top_zones = df['police_station'].value_counts().head(20).index
    zone_hour = df.groupby(['police_station', 'hour_ist']).size().unstack(fill_value=0)
    
    for zone in top_zones:
        if zone == 'UNKNOWN':
            continue
            
        zone_df = df[df['police_station'] == zone]
        
        # ── Exponential Smoothing on daily violation counts ──
        daily_counts = zone_df.groupby(date_series[zone_df.index]).size()
        full_date_range = pd.date_range(daily_counts.index.min(), daily_counts.index.max(), freq='D').date
        daily_counts = daily_counts.reindex(full_date_range, fill_value=0)
        
        # Single Exponential Smoothing (alpha=0.3)
        alpha = 0.3
        smoothed = np.zeros(len(daily_counts))
        smoothed[0] = daily_counts.iloc[0]
        for i in range(1, len(daily_counts)):
            smoothed[i] = alpha * daily_counts.iloc[i] + (1 - alpha) * smoothed[i - 1]
        
        # Trend detection: compare smoothed avg of last 20% vs first 20%
        n = len(smoothed)
        window = max(1, n // 5)
        early_avg = smoothed[:window].mean()
        late_avg = smoothed[-window:].mean()
        trend_pct = ((late_avg - early_avg) / early_avg * 100) if early_avg > 0 else 0
        
        if trend_pct > 15:
            trend = 'increasing'
        elif trend_pct < -15:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        # ── Growth-adjusted hourly forecast ──
        # Recent 30-day rate vs overall rate gives a data-driven multiplier
        hourly_avg = zone_df.groupby('hour_ist').size().reindex(range(24), fill_value=0) / days_in_dataset
        recent_rate = daily_counts.iloc[-30:].mean() if len(daily_counts) >= 30 else daily_counts.mean()
        overall_rate = daily_counts.mean()
        growth_factor = (recent_rate / overall_rate) if overall_rate > 0 else 1.0
        
        predicted_hourly = hourly_avg * growth_factor
        
        morning = predicted_hourly.loc[6:11].sum()
        afternoon = predicted_hourly.loc[12:16].sum()
        evening = predicted_hourly.loc[17:21].sum()
        night = predicted_hourly.loc[[22, 23, 0, 1, 2, 3, 4, 5]].sum()
        total_pred = morning + afternoon + evening + night
        
        if total_pred > 100:
            risk = 'critical'
        elif total_pred > 50:
            risk = 'high'
        elif total_pred > 20:
            risk = 'medium'
        else:
            risk = 'low'
            
        # ── Confidence from coefficient of variation ──
        cv = (daily_counts.std() / daily_counts.mean()) if daily_counts.mean() > 0 else 1.0
        confidence = round(max(0.50, min(0.98, 1.0 - cv * 0.3)), 2)
        
        top_type = zone_df['primary_violation'].mode().iloc[0] if not zone_df['primary_violation'].mode().empty else 'UNKNOWN'
            
        zone_forecasts.append({
            'zone': zone,
            'predictedViolations': {
                'morning': int(morning),
                'afternoon': int(afternoon),
                'evening': int(evening),
                'night': int(night)
            },
            'riskLevel': risk,
            'confidence': confidence,
            'topPredictedType': top_type,
            'trend': trend
        })
        
    # ── Global hourly forecast with growth adjustment ──
    global_daily = df.groupby(date_series).size()
    global_recent = global_daily.iloc[-30:].mean() if len(global_daily) >= 30 else global_daily.mean()
    global_overall = global_daily.mean()
    global_growth = (global_recent / global_overall) if global_overall > 0 else 1.0
    
    hourly_overall = df.groupby('hour_ist').size() / days_in_dataset * global_growth
    
    hourly_data = []
    for h in range(24):
        hourly_data.append({
            'hour': h,
            'hourIST': f"{h%12 or 12}:00 {'AM' if h < 12 else 'PM'}",
            'avgViolations': int(hourly_overall.get(h, 0)),
            'zones': {z: int(zone_hour.loc[z, h] / days_in_dataset * global_growth) if z in zone_hour.index and h in zone_hour.columns else 0 for z in top_zones[:5]}
        })
        
    return {
        'zoneForecasts': zone_forecasts,
        'hourly': hourly_data
    }
