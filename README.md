# ParkSense AI 🚦

<div align="center">
  <h3>Intelligent Spatial-Analytics & Predictive Enforcement for Traffic Police</h3>
  <p>Transforming raw historical citation data into predictive intelligence to shift the paradigm from reactive ticketing to proactive city management.</p>
</div>

---

##  Executive Summary
Bengaluru's rapid growth has led to severe traffic bottlenecks, often exacerbated by illegal parking on main arterial roads and critical junctions. Manual enforcement cannot scale to cover every street simultaneously. **ParkSense AI** solves this by using advanced Machine Learning (ML) to identify hidden patterns in historical traffic violation data, telling the Bengaluru Traffic Police (BTP) exactly *where* and *when* violations are most likely to occur.

---

##  Machine Learning Engine

The core of ParkSense AI is built around advanced spatial clustering and temporal forecasting. We do not rely on arbitrary grid systems or basic heatmaps; we use precise density-based mathematical models.

### 1. HDBSCAN Spatial Clustering
We utilize **HDBSCAN** (Hierarchical Density-Based Spatial Clustering of Applications with Noise) as our primary clustering algorithm.
* **Why HDBSCAN?** Unlike standard K-Means (which forces all points into a cluster) or basic DBSCAN (which struggles with varying densities), HDBSCAN excels at finding dense clusters of varying shapes and sizes while explicitly ignoring "noise" (random, one-off parking tickets).
* **Application:** By feeding hundreds of thousands of latitude/longitude violation coordinates into HDBSCAN, the AI identifies true, systemic violation "Hotspots"—the critical bottlenecks causing major city congestion.

### 2. Congestion Impact Score (CIS)
Not all hotspots are created equal. We developed a proprietary **Congestion Impact Score (CIS)** to mathematically rank the severity of each identified hotspot. The CIS is a weighted metric derived from:
* **Density:** The raw volume of violations within the cluster.
* **Severity Weighting:** Different violations have different impacts on traffic flow. "Double Parking" or "Parking near a Traffic Light" receives a higher severity multiplier than a standard "No Parking" violation.
* **Temporal Frequency:** How often the hotspot is active during peak transit hours.

Based on the CIS, hotspots are classified into four actionable tiers:
* 🔴 **Critical (CIS > 120):** Requires immediate, daily enforcement presence.
* 🟠 **High (CIS 80 - 120):** Requires frequent, targeted patrols.
* 🟡 **Medium (CIS 40 - 80):** Requires standard monitoring.
* 🟢 **Normal (CIS < 40):** Requires only periodic checks.

### 3. Predictive Shift Optimization
The AI doesn't just identify hotspots; it predicts *when* they will be active. The engine calculates the **Peak Period** for every hotspot and automatically assigns them to specific BTP patrol shifts:
* **Morning Shift (08:00 - 14:00)**
* **Afternoon Shift (14:00 - 22:00)**
* **Night Shift (22:00 - 06:00)**

This ensures that police resources are deployed efficiently, maximizing both traffic decongestion and potential fine revenue recovery.

---

##  Technical Architecture

ParkSense AI features a modern, decoupled architecture designed for blazing-fast performance and seamless visualization of massive datasets.

### Backend Data Pipeline (Python)
The backend acts as a powerful data crunching and precomputation engine.
* **Pandas:** Used for heavy data wrangling, cleaning missing values, and executing precise Timezone (UTC to IST) corrections on raw datetime strings.
* **Scikit-Learn:** Powers the HDBSCAN clustering models.
* **Precomputation Architecture:** Instead of querying a database on the fly (which would crash the browser when rendering 300,000+ points), the backend pre-calculates all ML models, analytics, and geometry, exporting them as highly optimized JSON payloads.

### Frontend Application (React + Vite)
The frontend is a premium, dark-mode dashboard built for police dispatchers and command centers.
* **Deck.GL & Mapbox:** We leverage Uber's Deck.GL framework to render thousands of data points smoothly at 60FPS. Features a custom Carto dark-matter basemap for high-contrast visibility.
* **Time-Lapse Player:** An interactive 3D map feature that allows commanders to hit "Play" and watch congestion patterns breathe and move across the city hour-by-hour.
* **Recharts:** Powers the interactive, animated charts in the Analytics dashboard, providing macro-level insights into city-wide trends or micro-level data for specific police station jurisdictions.
* **State Management:** Uses React Hooks (`useMemo`, `useEffect`) to ensure complex map filtering happens instantaneously without UI lag.

---

##  Dashboard Modules

1. **Live Map:** The interactive geographical visualization of all violations and ML-detected hotspots. Includes temporal filters and a time-lapse player.
2. **Analytics:** Deep dive into traffic statistics. View total violations, peak hours, and violation breakdowns. Filter data by all 54 distinct police station areas.
3. **Hotspots:** A detailed ledger of the most severe bottlenecks identified by the HDBSCAN model, sorted by their Congestion Impact Score.
4. **Predictions & Enforcement:** AI-generated patrol schedules optimizing officer deployments across Morning, Afternoon, and Night shifts to maximize enforcement ROI.

---

##  Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tej-5648/parksense-ai.git
   cd parksense-ai/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The application will typically launch on `http://localhost:5173`.*

---
*Built for the Bengaluru Traffic Police Hackathon.*
