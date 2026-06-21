import React from 'react';
import { Map, BarChart3, Target, TrendingUp, Shield, CarFront } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'map', icon: <Map size={22} />, label: 'Live Map' },
    { id: 'analytics', icon: <BarChart3 size={22} />, label: 'Analytics' },
    { id: 'hotspots', icon: <Target size={22} />, label: 'Hotspots' },
    { id: 'predictions', icon: <TrendingUp size={22} />, label: 'Predictions' },
    { id: 'enforcement', icon: <Shield size={22} />, label: 'Enforcement' },
  ];

  return (
    <div className="sidebar">
      <div 
        className="sidebar-logo" 
        onClick={() => setActiveView('about')}
        style={{ cursor: 'pointer' }}
      >
        <div className="sidebar-logo-icon">
          <CarFront size={28} />
        </div>
        <span>ParkSense AI</span>
      </div>
      
      <div style={{width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px'}}>
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            style={{ borderRadius: '8px' }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '24px',
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.05em',
        transition: 'opacity 0.3s'
      }} className="sidebar-version">
        <span style={{ color: 'var(--accent-primary)' }}>v1.0</span> BETA
      </div>
    </div>
  );
};

export default Sidebar;
