import pandas as pd
import numpy as np
import pygeohash as pgh
from catboost import CatBoostRegressor

class SingleDatasetGridlockAI:
    def __init__(self):
        self.model = CatBoostRegressor(
            iterations=2000, 
            learning_rate=0.035, 
            depth=7,
            eval_metric='RMSE', 
            task_type="GPU", 
            verbose=200, 
            random_seed=42
        )
        self.cat_features = ['geohash7']
        self.metrics = {} 

    def engineer_gridlock_target(self, df):
        print("Calculating Theoretical Gridlock Index (TGI)...")
        severity_map = {
            'PARKING IN A MAIN ROAD': 3, 
            'DOUBLE PARKING': 3, 
            'WRONG PARKING': 2, 
            'NO PARKING': 1
        }
        blockage_map = {
            'BUS (BMTC/KSRTC)': 3, 'PRIVATE BUS': 3, 'HGV': 3, 
            'LORRY/GOODS VEHICLE': 3, 'CAR': 2, 'MAXI-CAB': 2, 
            'JEEP': 2, 'VAN': 2, 'PASSENGER AUTO': 1.5, 
            'GOODS AUTO': 1.5, 'LGV': 2, 'SCOOTER': 1, 
            'MOTOR CYCLE': 1, 'MOPED': 1
        }
        
        df['severity_weight'] = df['primary_violation'].map(severity_map).fillna(1)
        df['blockage_weight'] = df['vehicle_type'].map(blockage_map).fillna(1)
        df['date'] = pd.to_datetime(df['created_ist']).dt.date
        df['geohash7'] = df.apply(lambda row: pgh.encode(row['latitude'], row['longitude'], precision=7), axis=1)
        
        agg_df = df.groupby(['geohash7', 'date', 'hour_ist', 'day_of_week']).agg(
            violation_count=('id', 'count'), 
            avg_severity=('severity_weight', 'mean'), 
            avg_blockage=('blockage_weight', 'mean')
        ).reset_index()
        
        # Base calculation
        agg_df['target_tgi'] = agg_df['violation_count'] * agg_df['avg_severity'] * agg_df['avg_blockage']
        
        # Apply Square Root Power Transform to stretch the middle values
        agg_df['target_tgi'] = np.sqrt(agg_df['target_tgi'])
        
        # Tighten the outlier boundary from 99th to 95th percentile
        max_tgi = agg_df['target_tgi'].quantile(0.95)
        
        # Scale to 100
        agg_df['target_tgi'] = (agg_df['target_tgi'] / max_tgi) * 100
        agg_df['target_tgi'] = agg_df['target_tgi'].clip(0, 100)
        return agg_df

    def train_predictor(self, train_df):
        print("STAGE 1: Finding Optimal Iterations via 80/20 Split...")
        train_df['time_sin'] = np.sin(2 * np.pi * train_df['hour_ist'] / 24)
        train_df['time_cos'] = np.cos(2 * np.pi * train_df['hour_ist'] / 24)
        
        day_map = {'Monday':0, 'Tuesday':1, 'Wednesday':2, 'Thursday':3, 'Friday':4, 'Saturday':5, 'Sunday':6}
        train_df['day_idx'] = train_df['day_of_week'].map(day_map).fillna(0).astype(int)

        X = train_df[['geohash7', 'hour_ist', 'day_idx', 'time_sin', 'time_cos']].copy()
        y = train_df['target_tgi']
        X['geohash7'] = X['geohash7'].astype(str)
        
        # 1. The Discovery Run (80/20 Split)
        np.random.seed(42)
        validation_mask = np.random.rand(len(X)) < 0.20
        
        X_train, y_train = X[~validation_mask], y[~validation_mask]
        X_val, y_val = X[validation_mask], y[validation_mask]
        
        discovery_model = CatBoostRegressor(
            iterations=2000, learning_rate=0.035, depth=7,
            eval_metric='RMSE', task_type="GPU", random_seed=42
        )
        
        discovery_model.fit(
            X_train, y_train,
            eval_set=(X_val, y_val),
            cat_features=self.cat_features,
            early_stopping_rounds=50,
            verbose=False # Keep terminal clean
        )
        
        optimal_iterations = discovery_model.get_best_iteration()
        print(f"-> Optimal tree depth discovered: {optimal_iterations} iterations.")
        
        # 2. The Production Run (100% Data)
        print("STAGE 2: Retraining Production Model on 100% of Data...")
        self.model = CatBoostRegressor(
            iterations=optimal_iterations, # Use the exact number we just found
            learning_rate=0.035, 
            depth=7,
            eval_metric='RMSE', 
            task_type="GPU", 
            verbose=200, 
            random_seed=42
        )
        
        # Train on EVERYTHING (X and y)
        self.model.fit(X, y, cat_features=self.cat_features)
        
        self.metrics = {
            "algorithm": "CatBoostRegressor",
            "target": "Theoretical Gridlock Index (TGI)",
            "training_mode": "100% Full Corpus",
            "optimal_iterations_used": int(optimal_iterations),
            "features": list(X.columns)
        }
        
        print(f"Production Model Locked. Ready for UI Deployment.")
        return self.model

    def predict_hotspot_severity(self, hotspots):
        print("Predicting AI Severity Scores (Applying Relative Scaling)...")
        if not hotspots: return hotspots
        
        pred_rows = []
        for h in hotspots:
            pred_rows.append({
                'geohash7': pgh.encode(h['centroid'][0], h['centroid'][1], precision=7),
                'hour_ist': h['peakHour'],
                'day_idx': 2, 
                'time_sin': np.sin(2 * np.pi * h['peakHour'] / 24),
                'time_cos': np.cos(2 * np.pi * h['peakHour'] / 24)
            })
            
        pred_df = pd.DataFrame(pred_rows)
        raw_predictions = self.model.predict(pred_df)
        
        # Scale the predictions relative to the current hotspots to guarantee full UI spectrum usage
        max_pred = np.percentile(raw_predictions, 95) if len(raw_predictions) > 0 else 1.0
        min_pred = np.min(raw_predictions) if len(raw_predictions) > 0 else 0.0
        
        for i, h in enumerate(hotspots):
            if max_pred == min_pred:
                scaled_score = 50.0 
            else:
                scaled_score = ((raw_predictions[i] - min_pred) / (max_pred - min_pred)) * 100
            
            # Mathematical floor to ensure the baseline visualization map stays active
            final_score = (scaled_score * 0.8) + 20 
            
            h['cisScore'] = max(0.0, min(100.0, round(final_score, 1)))
            
            if h['cisScore'] >= 75: h['severity'] = 'critical'
            elif h['cisScore'] >= 55: h['severity'] = 'high'
            elif h['cisScore'] >= 35: h['severity'] = 'medium'
            else: h['severity'] = 'low'
            
        return hotspots