# ParkSense AI 

<div align="center">
  <h3>Predictive Spatio-Temporal Intelligence & Resource Optimization Framework</h3>
  <p>Transforming 298,450 reactive traffic citations into a proactive, machine-learning-driven city enforcement command center.</p>
  
  [![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
  [![CatBoost](https://img.shields.io/badge/ML-CatBoost%20Regressor-ff6600.svg)](https://catboost.ai/)
  [![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://react.dev/)
  [![GPU-Accelerated](https://img.shields.io/badge/Hardware-NVIDIA%20GPU%20Enabled-green.svg)](https://developer.nvidia.com/)
</div>

---

##  Executive Summary
Urban parking congestion is historically treated as a reactive policing problem—violations are logged via tickets or cameras *after* traffic flow has already choked. **ParkSense AI** shifts the paradigm from reactive enforcement to **proactive incident prevention**. 

By processing a large scale dataset of historical citations from the Bangalore Traffic Police, ParkSense AI maps high-density geometric parking anomalies, scores their physical congestion impact via automated target engineering, and deploys predictive intelligence models to forecast gridlock risks before they manifest.

---

##  Advanced Machine Learning Architecture

Our framework rejects arbitrary spatial grids and static heuristics. Instead, it relies on a multi-tiered, decoupled machine learning pipeline that handles spatial clustering, custom feature engineering, and high-performance non-linear regression.

```text
[Raw Violation Data] 
       │
       ▼ (GPU Haversine Metrics)
 1. HDBSCAN Clustering ───► Filters Spatial Noise & Extracts Hotspot Centroids
       │
       ▼ (Target Variable Engineering)
 2. Theoretical Gridlock Index (TGI) ───► Accounts for Vehicle Volume & Blockage Mass
       │
       ▼ (Feature Engineering: Cyclical Time & Geohash7)
 3. Two-Stage CatBoost Regressor ───► 80/20 Train-Val Auto-Convergence Pipeline
       │
       ▼ (Resource Allocation Optimization)
 4. Dynamic Quantile Enforcement ───► Generates Shift Schedules & Patrol Vectors
```
### 1\. Spatial Hotspot Identification (HDBSCAN)

Instead of using rigid grid shapes like K-Means, which distort linear street topologies, we utilize **Hierarchical Density-Based Spatial Clustering of Applications with Noise (HDBSCAN)** operating with **Haversine distance tracking**.

-   **Arbitrary Shape Discovery:** HDBSCAN natively detects irregular, long, and continuous linear clusters formed by illegal parking along arterial corridors.

-   **Deterministic Noise Isolation:** Outlying, isolated citations are flagged as algorithmic noise rather than system hotspots, keeping enforcement coordinates spatially precise.

### 2\. Custom Target Engineering: Theoretical Gridlock Index (TGI)

To solve the lack of direct ground-truth traffic velocity metrics, the pipeline engineers an active proxy target---the **Theoretical Gridlock Index (TGI)**---which represents the true physical disruption to road width:

$$\text{Base TGI} = \text{Violation Count} \times \text{Avg}(\text{Severity Weight}) \times \text{Avg}(\text{Vehicle Blockage Weight})$$

-   **Impedance Weighting:** Severe violations (e.g., Double Parking) and high-volume vehicles (e.g., heavy goods vehicles, transit buses) receive exponentially greater mathematical multipliers than light vehicles or simple parking errors.

-   **Variance Stabilizing Transformation:** To compress extreme volume outliers and smooth the data landscape, a square root power transform is applied before scaling the distribution dynamically against the 95th percentile boundary.

### 3\. Predictive Forecasting Engine (CatBoost Regressor)

The system trains a high-performance **CatBoost Regressor** on the GPU cluster to forecast localized TGI scores based on temporal and geographic coordinates.

-   **Cyclical Time Feature Mapping:** To ensure the model recognizes that 23:59 and 00:01 are chronologically adjacent, hours are transformed into continuous two-dimensional space using sine and cosine functions:

    $$x_{\sin} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad x_{\cos} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)$$

-   **Native Categorical Processing:** Spatial regions are mapped via **Geohash7 encoding**, creating tight 150m × 150m localized bounding boxes. CatBoost processes these high-cardinality geographic text identifiers natively, preventing the memory explosion associated with classic one-hot encoding matrices.

-   **Two-Stage Auto-Convergence Pipeline:** * *Stage 1 (Discovery):* The dataset is split using a strict temporal sequence (80% training, 20% validation). The model trains with **Early Stopping (50 rounds)** to find the exact tree iteration where the unseen validation loss curve hits its minimum, completely eliminating overfitting.

    -   *Stage 2 (Production Deployment):* The validation split is collapsed, the dataset is rejoined to 100% capacity to maximize geographical feature coverage, and a final production model is retrained to the exact iteration limit discovered in Stage 1.

### 4\. Dynamic Severity & Enforcement Optimization

Rather than using fragile, hardcoded numeric cutoffs that create highly skewed empty categories in localized dashboards, the application uses **Dynamic Quantile-Based Classification**. The system evaluates predicted severities across all active hotspots simultaneously and partitions them by real-time mathematical percentiles:

| **Tier** | **Mathematical Criterion** | **Target UI Distribution Profile** | **Strategic Action Required** |
| --- | --- | --- | --- |
| 🔴 **Critical** | Top 10% Scores | $\approx 5$ Primary Hubs | Instant deployment of permanent static assets |
| 🟠 **High Risk** | Next 32% Scores | $\approx 18$ Urban Corridors | Increased frequency targeted patrol loops |
| 🔵 **Medium** | Next 38% Scores | $\approx 21$ Standard Vectors | Programmed routine monitoring checks |
| 🟢 **Low Risk** | Bottom 20% Scores | Baseline Rest | Periodic observation intervals |

📈 Enterprise Value & Core Metrics
----------------------------------

-   **Manpower Efficiency:** Traffic command centers no longer deploy patrols blindly. The Enforcement Optimizer mathematically balances violation density against predicted severity.

-   **Operational Impact:** Deploying active patrol shifts to the AI's Top 10 prioritized sector recommendations covers up to **59% of all high-severity traffic violations** city-wide with a minimal workforce allocation footprint.

🛠 Tech Stack & Architecture
----------------------------

### Backend Pipeline (Python)

-   **CatBoost:** High-performance gradient boosting optimized for GPU processing loops.

-   **Pandas & NumPy:** Linear algebra operations, data wrangling, and UTC-to-IST chronological timezone normalization.

-   **PyGeohash:** High-precision string spatial geohashing.

### Visualization Hub (React + Vite + Vercel)

-   **Deck.GL & Mapbox GL:** GPU-accelerated WebGL spatial data rendering delivering fluid 60FPS client-side coordinate performance over hundreds of thousands of active points.

-   **Recharts:** High-fidelity component animation tracking analytics across all 54 distinct municipal police jurisdictions.

 Execution & Local Replicability
----------------------------------

### Part 1: Running the Machine Learning Pipeline (Backend)

1.  Ensure Python 3.10+ is active on your host system.

2.  Navigate to the backend directory workspace:

    Bash

    ```
    cd backend

    ```

3.  Install the optimized machine learning dependencies:

    Bash

    ```
    pip install pandas numpy pygeohash catboost scikit-learn fastapi uvicorn

    ```

4.  Verify your raw historical citation CSV (`jan to may police violation_anonymized791b166.csv`) is present inside the `backend/data/` folder directory.

5.  Execute the core precomputation engine to trigger the two-stage model training loop, process spatial quantiles, and generate the static UI payloads:

    Bash

    ```
    python api/precompute.py

    ```

6.  Spin up the localized API delivery network instance:

    Bash

    ```
    python api/main.py

    ```

### Part 2: Booting the Dashboard Console (Frontend)

1.  Open a new terminal instance and navigate to the UI environment folder:

    Bash

    ```
    cd frontend

    ```

2.  Download the frontend node environment components:

    Bash

    ```
    npm install

    ```

3.  Boot up the Vite local serving thread:

    Bash

    ```
    npm run dev

    ```

4.  Launch your browser window and navigate directly to: `http://localhost:5173`

*Developed for the National Predictive Traffic Enforcement Initiative.*
