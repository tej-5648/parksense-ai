import numpy as np
import pandas as pd
try:
    from cuml.cluster import HDBSCAN as GPU_HDBSCAN
    import cupy as cp
    GPU_ENABLED = True
except ImportError:
    from sklearn.cluster import HDBSCAN as CPU_HDBSCAN
    GPU_ENABLED = False

def detect_hotspots(df):
    print("Detecting hotspots with HDBSCAN...", flush=True)
    
    if GPU_ENABLED:
        coords_rad = np.radians(df[['latitude', 'longitude']].values)
        coords_rad_gpu = cp.asarray(coords_rad, dtype=cp.float32)
        hdbscan = GPU_HDBSCAN(min_cluster_size=15, metric='haversine')
        labels = hdbscan.fit_predict(coords_rad_gpu).get()
        sample_df = df.copy()
        scale_factor = 1
    else:
        sample_df = df.sample(30000, random_state=42).copy() if len(df) > 30000 else df.copy()
        coords_rad = np.radians(sample_df[['latitude', 'longitude']].values)
        hdbscan = CPU_HDBSCAN(min_cluster_size=15, metric='haversine')
        labels = hdbscan.fit_predict(coords_rad)
        scale_factor = len(df) / len(sample_df) if len(sample_df) > 0 else 1

    sample_df['cluster_id'] = labels
    clustered_df = sample_df[sample_df['cluster_id'] >= 0]
    
    raw_clusters = []
    for cluster_id, group in clustered_df.groupby('cluster_id'):
        raw_clusters.append({
            'id': int(cluster_id),
            'centroid': [float(group['latitude'].mean()), float(group['longitude'].mean())],
            'radius_m': float(max(group['latitude'].std(), group['longitude'].std()) * 111000) if not pd.isna(group['latitude'].std()) else 50.0,
            'violationCount': int(len(group) * scale_factor),
            'topViolationType': group['primary_violation'].mode().iloc[0] if not group['primary_violation'].mode().empty else 'UNKNOWN',
            'topVehicleType': group['vehicle_type'].mode().iloc[0] if not group['vehicle_type'].mode().empty else 'UNKNOWN',
            'peakHour': int(group['hour_ist'].mode().iloc[0]) if not group['hour_ist'].mode().empty else 0,
            'junctionName': group['junction_name'].mode().iloc[0] if not group['junction_name'].mode().empty else 'No Junction',
            'policeStation': group['police_station'].mode().iloc[0] if not group['police_station'].mode().empty else 'UNKNOWN',
            'violationBreakdown': {str(k): int(v * scale_factor) for k, v in group['primary_violation'].value_counts().to_dict().items()},
            'vehicleBreakdown': {str(k): int(v * scale_factor) for k, v in group['vehicle_type'].value_counts().to_dict().items()},
            'hourlyDistribution': [int(group['hour_ist'].value_counts().to_dict().get(i, 0) * scale_factor) for i in range(24)]
        })
    
    station_groups = {}
    for c in raw_clusters:
        station_groups.setdefault(c['policeStation'], []).append(c)
    
    hotspots = []
    for ps, clusters in station_groups.items():
        total_violations = sum(c['violationCount'] for c in clusters)
        w_lat = sum(c['centroid'][0] * c['violationCount'] for c in clusters) / total_violations
        w_lon = sum(c['centroid'][1] * c['violationCount'] for c in clusters) / total_violations
        
        merged_violations = {}
        merged_vehicles = {}
        merged_hourly = [0] * 24
        for c in clusters:
            for k, v in c['violationBreakdown'].items(): merged_violations[k] = merged_violations.get(k, 0) + v
            for k, v in c['vehicleBreakdown'].items(): merged_vehicles[k] = merged_vehicles.get(k, 0) + v
            for i in range(24): merged_hourly[i] += c['hourlyDistribution'][i]
                
        hotspots.append({
            'id': len(hotspots),
            'centroid': [float(w_lat), float(w_lon)],
            'lat': float(w_lat), 'lng': float(w_lon),
            'radius_m': float(max(c['radius_m'] for c in clusters)),
            'violationCount': total_violations,
            'microClusters': len(clusters),
            'topViolationType': clusters[0]['topViolationType'],
            'topVehicleType': clusters[0]['topVehicleType'],
            'peakHour': int(np.argmax(merged_hourly)),
            'peakHourIST': f"{int(np.argmax(merged_hourly))%12 or 12}:00 {'AM' if int(np.argmax(merged_hourly)) < 12 else 'PM'}",
            'policeStation': ps,
            'junctionName': clusters[0]['junctionName'],
            'violationBreakdown': merged_violations,
            'vehicleBreakdown': merged_vehicles,
            'hourlyDistribution': merged_hourly,
            'topViolations': [{'type': k, 'count': int(v)} for k, v in sorted(merged_violations.items(), key=lambda x: x[1], reverse=True)[:5]],
            'topVehicles': [{'type': k, 'count': int(v)} for k, v in sorted(merged_vehicles.items(), key=lambda x: x[1], reverse=True)[:5]],
            'vehicleDetails': [{'type': k, 'count': int(v), 'peakHour': 12, 'peakHourIST': '12:00 PM', 'topViolations': []} for k, v in sorted(merged_vehicles.items(), key=lambda x: x[1], reverse=True)[:5]]
        })
    return hotspots, df


