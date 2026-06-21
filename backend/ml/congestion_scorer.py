def compute_cis(hotspots):
    print("Computing Congestion Impact Score (CIS)...")
    
    # Sort by count to find 95th percentile to avoid outlier skew
    counts = sorted([h['violationCount'] for h in hotspots])
    p95_count = counts[int(len(counts) * 0.95)] if len(counts) > 0 else 1
    
    for h in hotspots:
        # Cap at 1.0
        d_violation = min(h['violationCount'] / p95_count, 1.0)
        
        severity_map = {
            'PARKING IN A MAIN ROAD': 3,
            'DOUBLE PARKING': 3,
            'WRONG PARKING': 2,
            'NO PARKING': 1
        }
        s_severity = severity_map.get(h['topViolationType'], 1) / 3.0
        
        blockage_map = {
            'BUS (BMTC/KSRTC)': 3,
            'PRIVATE BUS': 3,
            'HGV': 3,
            'LORRY/GOODS VEHICLE': 3,
            'CAR': 2,
            'MAXI-CAB': 2,
            'JEEP': 2,
            'VAN': 2,
            'PASSENGER AUTO': 1.5,
            'GOODS AUTO': 1.5,
            'LGV': 2,
            'SCOOTER': 1,
            'MOTOR CYCLE': 1,
            'MOPED': 1
        }
        v_blockage = blockage_map.get(h['topVehicleType'], 1) / 3.0
        
        peak = h['peakHour']
        if (8 <= peak <= 11) or (17 <= peak <= 20):
            t_temporal = 1.0
        elif (22 <= peak <= 23) or (0 <= peak <= 5):
            t_temporal = 0.2
        else:
            t_temporal = 0.5
            
        r_road = 1.0 if h['junctionName'] != 'No Junction' else 0.5
        
        # Boost base score slightly
        cis = (0.35 * d_violation + 0.25 * s_severity + 0.15 * v_blockage + 0.15 * t_temporal + 0.1 * r_road) * 100
        h['cisScore'] = round(min(cis, 100), 1)
        
        # Lowered thresholds for better distribution
        if h['cisScore'] >= 65:
            h['severity'] = 'critical'
        elif h['cisScore'] >= 45:
            h['severity'] = 'high'
        elif h['cisScore'] >= 25:
            h['severity'] = 'medium'
        else:
            h['severity'] = 'low'
            
    return hotspots
