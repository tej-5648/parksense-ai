import React, { useMemo, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

const INITIAL_VIEW_STATE = {
  longitude: 77.5946,
  latitude: 12.9716,
  zoom: 11,
  pitch: 0,
  bearing: 0,
};

const HOUR_LABELS = [
  'All', '12AM', '1AM', '2AM', '3AM', '4AM', '5AM',
  '6AM', '7AM', '8AM', '9AM', '10AM', '11AM',
  '12PM', '1PM', '2PM', '3PM', '4PM', '5PM',
  '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'
];

const MapView = ({ data, filters, setFilters }) => {
  const { violations, analytics, hotspots } = data;
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setFilters(prev => {
          let nextHour = prev.hour === 'all' ? 0 : prev.hour + 1;
          if (nextHour > 23) {
            setIsPlaying(false);
            return { ...prev, hour: 0 }; // Pause at 12 AM
          }
          return { ...prev, hour: nextHour };
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setFilters]);
  
  const mapData = useMemo(() => {
    if (!violations || !violations.points) return [];
    return violations.points
      .map(p => ({
        longitude: p[0],
        latitude: p[1],
        hour: p[2],
        violationType: violations.violationTypes[p[3]],
        vehicleType: violations.vehicleTypes[p[4]],
        isWeekend: p[5] === 1,
        severity: p[6]
      }))
      .filter(p => {
        if (filters?.hour !== 'all' && p.hour !== filters.hour) return false;
        if (filters?.violationType !== 'all' && p.violationType !== filters.violationType) return false;
        if (filters?.vehicleType !== 'all' && p.vehicleType !== filters.vehicleType) return false;
        return true;
      });
  }, [violations, filters]);

  const layers = [
    new HeatmapLayer({
      id: 'violations-heatmap',
      data: mapData,
      getPosition: d => [d.longitude, d.latitude],
      getWeight: d => d.severity,
      radiusPixels: 30,
      intensity: 1,
      threshold: 0.05
    }),
    new ScatterplotLayer({
      id: 'hotspots-scatter',
      data: hotspots?.hotspots || [],
      getPosition: d => [d.centroid[1], d.centroid[0]],
      getRadius: d => Math.max(d.radius_m, 100),
      getFillColor: d => d.severity === 'high' ? [239, 68, 68, 100] : [245, 158, 11, 100],
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: 2,
      pickable: true,
      stroked: true,
      filled: true
    })
  ];

  const getTooltip = ({object}) => {
    if (!object) return null;
    if (object.violationCount) {
      return {
        html: `
          <div class="custom-tooltip">
            <div class="tooltip-header" style="color: ${object.severity === 'high' ? 'var(--danger)' : 'var(--warning)'}; border-bottom-color: ${object.severity === 'high' ? 'var(--danger)' : 'var(--warning)'}">
              ${object.severity.toUpperCase()} SEVERITY HOTSPOT
            </div>
            <div class="tooltip-stat"><span>CIS Score:</span> <strong>${object.cisScore.toFixed(1)}</strong></div>
            <div class="tooltip-stat"><span>Total Violations:</span> <strong>${object.violationCount}</strong></div>
            <div class="tooltip-stat"><span>Top Violation:</span> <strong>${object.topViolationType}</strong></div>
            <div class="tooltip-stat"><span>Peak Hour:</span> <strong>${object.peakHourIST}</strong></div>
            <div class="tooltip-stat"><span>Radius:</span> <strong>${Math.round(object.radius_m)}m</strong></div>
          </div>
        `,
        style: {
          backgroundColor: 'transparent',
          padding: 0,
          boxShadow: 'none'
        }
      };
    }
    return null;
  };

  const currentHourVal = filters?.hour === 'all' ? -1 : filters?.hour;

  return (
    <div className="map-container">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
      </DeckGL>

      {/* Stats overlay - top right */}
      <div className="glass-panel map-overlay-stats">
        <div className="stat-row">
          <div className="stat-label">Visible Points</div>
          <div className="stat-value accent">
            {mapData.length.toLocaleString()}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Active Hotspots</div>
          <div className="stat-value">
            {hotspots?.hotspots?.length.toLocaleString() || '0'}
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-label">Filters</div>
          <div className="stat-value" style={{fontSize: '0.9rem'}}>
            {(filters?.hour !== 'all' || filters?.violationType !== 'all') ? 'Active' : 'None'}
          </div>
        </div>
      </div>

      {/* Time-lapse slider - bottom */}
      <div className="glass-panel map-time-slider">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <label style={{color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem'}}>Time-Lapse</label>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isPlaying ? 'var(--danger)' : 'var(--success)',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <select
              value={currentHourVal}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFilters(prev => ({ ...prev, hour: val === -1 ? 'all' : val }));
              }}
              className="time-select"
            >
              <option value={-1}>All Day</option>
              {Array.from({length: 24}, (_, i) => (
                <option key={i} value={i}>{HOUR_LABELS[i + 1]}</option>
              ))}
            </select>
            <span style={{color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.1rem', minWidth: '60px', textAlign: 'right'}}>
              {filters?.hour === 'all' ? 'All Day' : HOUR_LABELS[filters.hour + 1]}
            </span>
          </div>
        </div>
        <input 
          type="range" 
          min="-1" 
          max="23" 
          step="1"
          value={currentHourVal}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setFilters(prev => ({ ...prev, hour: val === -1 ? 'all' : val }));
          }}
          className="time-range-input"
        />
        <div className="slider-tick-labels">
          {HOUR_LABELS.map((label, i) => (
            <span key={i} className={i === 0 ? 'tick-all' : (i % 3 === 1 ? '' : 'tick-minor')}>{i % 3 === 1 || i === 0 ? label : ''}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;
