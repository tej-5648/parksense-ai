import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Analytics = ({ data, filters, setFilters }) => {
  const { analytics } = data;
  const [selectedZone, setSelectedZone] = useState('Whole City (Bangalore)');
  const [zoneSearch, setZoneSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!analytics) return <div style={{padding: '40px'}}>Loading...</div>;

  // Get zone list from police station data + Whole City
  const zones = useMemo(() => {
    const st = (analytics.byPoliceStation || []).map(s => s.station);
    return ['Whole City (Bangalore)', ...st];
  }, [analytics]);

  const filteredZones = useMemo(() => {
    if (!zoneSearch) return zones;
    return zones.filter(z => z.toLowerCase().includes(zoneSearch.toLowerCase()));
  }, [zones, zoneSearch]);
  
  // Dynamically select data scope based on selectedZone
  const currentData = useMemo(() => {
    if (!selectedZone || selectedZone === 'Whole City (Bangalore)' || !analytics.byStationData || !analytics.byStationData[selectedZone]) {
      return analytics; // Global fallback
    }
    return analytics.byStationData[selectedZone];
  }, [analytics, selectedZone]);

  // Use log scale for bar chart to handle WRONG PARKING / NO PARKING dominating
  const violationData = useMemo(() => {
    return (currentData.byViolationType || []).map(item => ({
      ...item,
      // Shorten some long labels for display
      displayType: item.type
        .replace('PARKING OTHER THAN BUS STOP', 'PARKING (NOT BUS STOP)')
        .replace('PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS', 'NEAR SIGNAL/ZEBRA'),
    }));
  }, [currentData]);

  return (
    <div style={{padding: '30px', height: '100%', overflowY: 'auto'}}>
      <h2 style={{marginBottom: '30px'}}>Traffic Analytics {selectedZone !== 'Whole City (Bangalore)' ? `- ${selectedZone}` : ''}</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px'}}>
        <div className="glass-panel" style={{padding: '20px'}}>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px'}}>Total Violations</div>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)'}}>
            {currentData.summary.totalViolations.toLocaleString()}
          </div>
        </div>
        <div className="glass-panel" style={{padding: '20px'}}>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px'}}>Avg Daily</div>
          <div style={{fontSize: '2rem', fontWeight: 'bold'}}>
            {currentData.summary.avgDailyViolations.toLocaleString()}
          </div>
        </div>
        <div className="glass-panel" style={{padding: '20px'}}>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px'}}>Peak Hour</div>
          <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)'}}>
            {currentData.summary.peakHour}
          </div>
        </div>

        {/* Searchable Zone Selector */}
        <div className="glass-panel" style={{padding: '20px', position: 'relative', overflow: 'visible', zIndex: 10}} ref={dropdownRef}>
          <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px'}}>Select Area</div>
          <div 
            className="zone-select-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{selectedZone || 'Choose area...'}</span>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>▼</span>
          </div>
          {dropdownOpen && (
            <div className="zone-dropdown">
              <input
                type="text"
                placeholder="Search areas..."
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                className="zone-search-input"
                autoFocus
              />
              <div className="zone-dropdown-list">
                {filteredZones.map(zone => (
                  <div
                    key={zone}
                    className={`zone-dropdown-item ${zone === selectedZone ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedZone(zone);
                      setDropdownOpen(false);
                      setZoneSearch('');
                    }}
                  >
                    {zone}
                  </div>
                ))}
                {filteredZones.length === 0 && (
                  <div style={{padding: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem'}}>No areas found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts stacked vertically */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px'}}>
        
        {/* Violations by Hour - full width */}
        <div className="glass-panel" style={{padding: '20px', height: '350px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: 0}}>Violations by Hour</h3>
            {filters.hour !== 'all' && (
              <button 
                onClick={() => setFilters({...filters, hour: 'all'})}
                style={{background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'}}
              >
                Reset ×
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={currentData.byHour} onClick={(e) => { if(e?.activeLabel) setFilters({...filters, hour: parseInt(e.activeLabel)}) }} style={{cursor: 'pointer'}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hourIST" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <RechartsTooltip 
                contentStyle={{backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '8px'}}
              />
              <Area type="monotone" dataKey="count" stroke="var(--accent-primary)" fill="rgba(0, 212, 255, 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Types - full width, below */}
        <div className="glass-panel" style={{padding: '20px', height: '450px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: 0}}>Top Violation Types</h3>
            {filters.violationType !== 'all' && (
              <button 
                onClick={() => setFilters({...filters, violationType: 'all'})}
                style={{background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'}}
              >
                Reset ×
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={violationData} layout="vertical" margin={{left: 160, right: 30}} onClick={(e) => { if(e?.activeLabel) setFilters({...filters, violationType: e.activeLabel}) }} style={{cursor: 'pointer'}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                stroke="var(--text-secondary)" 
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                domain={[0, 'dataMax']}
              />
              <YAxis 
                dataKey="displayType" 
                type="category" 
                stroke="var(--text-secondary)" 
                width={155} 
                tick={{fontSize: 11}} 
                interval={0}
              />
              <RechartsTooltip 
                contentStyle={{backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: '8px'}}
                formatter={(value) => [value.toLocaleString(), 'Violations']}
                labelFormatter={(label) => label}
                cursor={false}
              />
              <Bar 
                dataKey="count" 
                fill="var(--accent-secondary)" 
                radius={[0, 4, 4, 0]} 
                background={false}
                activeBar={{ fill: '#a855f7', fillOpacity: 1, stroke: 'var(--accent-primary)', strokeWidth: 2 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
