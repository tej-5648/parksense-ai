import numpy as np
from sklearn.cluster import HDBSCAN
import pandas as pd

def detect_hotspots(df):
    print("Detecting hotspots with HDBSCAN on full dataset...", flush=True)
    
    if len(df) > 30000:
        sample_df = df.sample(30000, random_state=42).copy()
    else:
        sample_df = df.copy()
        
    coords = sample_df[['latitude', 'longitude']].values
    coords_rad = np.radians(coords)
    
    hdbscan = HDBSCAN(
        min_cluster_size=15,
        metric='haversine'
    )
    labels = hdbscan.fit_predict(coords_rad)
    sample_df['cluster_id'] = labels
    
    # First pass: get raw clusters
    raw_clusters = []
    clustered_df = sample_df[sample_df['cluster_id'] >= 0]
    
    for cluster_id, group in clustered_df.groupby('cluster_id'):
        centroid_lat = group['latitude'].mean()
        centroid_lon = group['longitude'].mean()
        scale_factor = len(df) / len(sample_df)
        count = int(len(group) * scale_factor)
        
        lat_std = group['latitude'].std()
        lon_std = group['longitude'].std()
        radius_m = max(lat_std, lon_std) * 111000
        if pd.isna(radius_m):
            radius_m = 50
            
        top_violation = group['primary_violation'].mode().iloc[0] if not group['primary_violation'].mode().empty else 'UNKNOWN'
        top_vehicle = group['vehicle_type'].mode().iloc[0] if not group['vehicle_type'].mode().empty else 'UNKNOWN'
        peak_hour = int(group['hour_ist'].mode().iloc[0]) if not group['hour_ist'].mode().empty else 0
        
        junction = group['junction_name'].mode().iloc[0] if not group['junction_name'].mode().empty else 'No Junction'
        police_station = group['police_station'].mode().iloc[0] if not group['police_station'].mode().empty else 'UNKNOWN'
        
        violation_breakdown = group['primary_violation'].value_counts().to_dict()
        vehicle_breakdown = group['vehicle_type'].value_counts().to_dict()
        hourly_distribution = group['hour_ist'].value_counts().sort_index().to_dict()
        hourly_list = [int(hourly_distribution.get(i, 0)) for i in range(24)]
        
        # Per-vehicle detailed stats
        per_vehicle = {}
        for vtype, vgroup in group.groupby('vehicle_type'):
            v_violations = vgroup['primary_violation'].value_counts().to_dict()
            v_peak = int(vgroup['hour_ist'].mode().iloc[0]) if not vgroup['hour_ist'].mode().empty else 0
            v_hourly = vgroup['hour_ist'].value_counts().sort_index().to_dict()
            per_vehicle[str(vtype)] = {
                'count': int(len(vgroup)),
                'violations': {str(k): int(v) for k, v in v_violations.items()},
                'peakHour': v_peak,
                'hourly': [int(v_hourly.get(i, 0)) for i in range(24)]
            }
        
        raw_clusters.append({
            'id': int(cluster_id),
            'centroid': [float(centroid_lat), float(centroid_lon)],
            'radius_m': float(radius_m),
            'violationCount': int(count),
            'topViolationType': top_violation,
            'topVehicleType': top_vehicle,
            'peakHour': peak_hour,
            'junctionName': junction,
            'policeStation': police_station,
            'violationBreakdown': {str(k): int(v) for k, v in violation_breakdown.items()},
            'vehicleBreakdown': {str(k): int(v) for k, v in vehicle_breakdown.items()},
            'hourlyDistribution': hourly_list,
            'perVehicle': per_vehicle
        })
    
    # Second pass: merge clusters by police station
    print(f"  Raw clusters: {len(raw_clusters)}, merging by police station...")
    station_groups = {}
    for c in raw_clusters:
        ps = c['policeStation']
        if ps not in station_groups:
            station_groups[ps] = []
        station_groups[ps].append(c)
    
    hotspots = []
    for ps, clusters in station_groups.items():
        total_violations = sum(c['violationCount'] for c in clusters)
        num_micro = len(clusters)
        
        # Weighted centroid
        total_w = sum(c['violationCount'] for c in clusters)
        w_lat = sum(c['centroid'][0] * c['violationCount'] for c in clusters) / total_w
        w_lon = sum(c['centroid'][1] * c['violationCount'] for c in clusters) / total_w
        
        # Merge violation breakdowns
        merged_violations = {}
        for c in clusters:
            for k, v in c['violationBreakdown'].items():
                merged_violations[k] = merged_violations.get(k, 0) + v
        
        # Merge vehicle breakdowns
        merged_vehicles = {}
        for c in clusters:
            for k, v in c['vehicleBreakdown'].items():
                merged_vehicles[k] = merged_vehicles.get(k, 0) + v
        
        # Merge per-vehicle detailed stats
        merged_per_vehicle = {}
        scale_factor = len(df) / len(sample_df) if len(sample_df) > 0 else 1
        for c in clusters:
            for vtype, vdata in c.get('perVehicle', {}).items():
                if vtype not in merged_per_vehicle:
                    merged_per_vehicle[vtype] = {'count': 0, 'violations': {}, 'hourly': [0]*24}
                merged_per_vehicle[vtype]['count'] += vdata['count']
                for vk, vv in vdata['violations'].items():
                    merged_per_vehicle[vtype]['violations'][vk] = merged_per_vehicle[vtype]['violations'].get(vk, 0) + vv
                for i in range(24):
                    merged_per_vehicle[vtype]['hourly'][i] += vdata['hourly'][i]
        
        # Build vehicleDetails list (sorted by count desc)
        vehicle_details = []
        for vtype, vdata in sorted(merged_per_vehicle.items(), key=lambda x: x[1]['count'], reverse=True):
            v_peak = int(np.argmax(vdata['hourly'])) if any(vdata['hourly']) else 0
            top_viols = sorted(vdata['violations'].items(), key=lambda x: x[1], reverse=True)[:3]
            scaled_count = int(vdata['count'] * scale_factor)
            vehicle_details.append({
                'type': vtype,
                'count': scaled_count,
                'peakHour': v_peak,
                'peakHourIST': f"{v_peak%12 or 12}:00 {'AM' if v_peak < 12 else 'PM'}",
                'topViolations': [{'type': k, 'count': int(v * scale_factor)} for k, v in top_viols]
            })
        
        # Merge hourly distributions
        merged_hourly = [0] * 24
        for c in clusters:
            for i in range(24):
                merged_hourly[i] += c['hourlyDistribution'][i]
        
        # Top violation + vehicle from merged
        top_violation = max(merged_violations, key=merged_violations.get) if merged_violations else 'UNKNOWN'
        top_vehicle = max(merged_vehicles, key=merged_vehicles.get) if merged_vehicles else 'UNKNOWN'
        
        # Top 5 violations with counts
        sorted_violations = sorted(merged_violations.items(), key=lambda x: x[1], reverse=True)[:5]
        sorted_vehicles = sorted(merged_vehicles.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Peak hour from merged hourly
        peak_hour = int(np.argmax(merged_hourly))
        
        # Max radius across sub-clusters
        max_radius = max(c['radius_m'] for c in clusters)
        
        # Best junction name (non-"No Junction" if possible)
        junctions = [c['junctionName'] for c in clusters if c['junctionName'] != 'No Junction']
        junction = junctions[0] if junctions else 'No Junction'
        
        hotspots.append({
            'id': len(hotspots),
            'centroid': [float(w_lat), float(w_lon)],
            'lat': float(w_lat),
            'lng': float(w_lon),
            'radius_m': float(max_radius),
            'violationCount': total_violations,
            'microClusters': num_micro,
            'topViolationType': top_violation,
            'topVehicleType': top_vehicle,
            'peakHour': peak_hour,
            'peakHourIST': f"{peak_hour%12 or 12}:00 {'AM' if peak_hour < 12 else 'PM'}",
            'junctionName': junction,
            'policeStation': ps,
            'violationBreakdown': {str(k): int(v) for k, v in merged_violations.items()},
            'vehicleBreakdown': {str(k): int(v) for k, v in merged_vehicles.items()},
            'topViolations': [{'type': k, 'count': int(v)} for k, v in sorted_violations],
            'topVehicles': [{'type': k, 'count': int(v)} for k, v in sorted_vehicles],
            'vehicleDetails': vehicle_details,
            'hourlyDistribution': merged_hourly
        })
    
    print(f"  Merged into {len(hotspots)} station-level hotspots")
    return hotspots, df
