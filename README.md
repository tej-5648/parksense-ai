# ParkSense AI 🚦

**ParkSense AI** is an intelligent spatial-analytics and predictive enforcement platform built to empower the **Bengaluru Traffic Police (BTP)**. By transforming raw historical citation data into predictive intelligence, ParkSense AI shifts the paradigm from reactive ticketing to proactive city management.

## 🌟 The Challenge
Bengaluru's rapid growth has led to severe bottlenecks. Illegal parking on main roads degrades traffic flow and causes critical delays. Manual enforcement cannot scale to cover every street simultaneously. We needed a data-driven way to know *where* and *when* violations are most likely to occur before they happen.

## 🚀 Our Solution
ParkSense AI ingests hundreds of thousands of historical traffic violations, applies advanced spatial clustering, and generates predictive shift recommendations to maximize the impact of traffic police patrols.

### Core Features

*   **Live Temporal Map**: A highly interactive map built with Deck.GL. Watch congestion "breathe" over the city throughout the day using the Time-Lapse Player.
*   **Predictive Analytics**: Understand macro-level traffic patterns across the entire city or drill down into specific police station jurisdictions.
*   **Hotspot Intelligence**: We use **HDBSCAN** (Hierarchical Density-Based Spatial Clustering of Applications with Noise) to identify precise, high-density violation zones without relying on arbitrary grids. 
*   **Smart Enforcement**: Optimized patrol schedules broken down by Morning, Afternoon, and Night shifts. Ensures officers are deployed to areas with the highest predicted **Congestion Impact Score (CIS)**.

### 🧠 Glossary of Terms

*   **HDBSCAN Clustering**: An advanced machine learning algorithm we use to group geographically close violations into "Hotspots". It filters out random, one-off parking tickets (noise) to find true systemic bottlenecks.
*   **Congestion Impact Score (CIS)**: A proprietary weighted metric (0-100+) calculated for every hotspot. It factors in the density of violations, the severity of the violation type (e.g., "Double Parking" is weighted heavier than "No Parking"), and the temporal frequency. Higher CIS means a worse bottleneck.
*   **Peak Period**: The specific hour block during the day when a hotspot sees the highest frequency of violations.
*   **Severity Levels**: 
    *   *Critical*: CIS > 120 (Requires immediate/daily enforcement)
    *   *High*: CIS 80 - 120 (Requires frequent patrols)
    *   *Medium*: CIS 40 - 80 (Requires standard monitoring)
    *   *Normal*: CIS < 40 (Periodic checks)

## 🛠️ Tech Stack
*   **Frontend**: React (Vite), Deck.GL (MapBox/Carto basemaps), Recharts
*   **Backend / Data Engine**: Python, Pandas, Scikit-Learn (HDBSCAN)
*   **Architecture**: Static JSON generation via precomputation pipeline for blazing fast dashboard rendering.

## 💻 Running Locally

1.  Clone the repository:
    ```bash
    git clone https://github.com/tej-5648/parksense-ai.git
    cd parksense-ai/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---
*Built for the Bengaluru Traffic Police Hackathon.*
