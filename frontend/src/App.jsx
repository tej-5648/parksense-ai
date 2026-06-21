import React, { useState } from 'react';
import './App.css';
import { useData } from './hooks/useData';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';

import Analytics from './components/Analytics';
import HotspotPanel from './components/HotspotPanel';
import Predictions from './components/Predictions';
import Enforcement from './components/Enforcement';
import About from './components/About';

function App() {
  const data = useData();
  const [activeView, setActiveView] = useState('about');
  const [filters, setFilters] = useState({
    hour: 'all',
    violationType: 'all',
    vehicleType: 'all'
  });

  if (data.loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <h2>Initializing ParkSense AI</h2>
        <p style={{color: 'var(--text-secondary)'}}>Loading Bangalore traffic data...</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="loader-container">
        <h2>Error Loading Data</h2>
        <p style={{color: 'var(--danger)'}}>{data.error}</p>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'about': return <About setView={setActiveView} />;
      case 'map': return <MapView data={data} filters={filters} setFilters={setFilters} />;
      case 'analytics': return <Analytics data={data} filters={filters} setFilters={setFilters} />;
      case 'hotspots': return <HotspotPanel data={data} />;
      case 'predictions': return <Predictions data={data} />;
      case 'enforcement': return <Enforcement data={data} />;
      default: return <About setView={setActiveView} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        <div key={activeView} className="page-transition">
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;
