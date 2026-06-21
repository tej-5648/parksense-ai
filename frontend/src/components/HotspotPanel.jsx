import React, { useState, useMemo } from 'react';

const HotspotPanel = ({ data }) => {
  const { hotspots } = data;
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showCISInfo, setShowCISInfo] = useState(false);
  // Track which hotspot card has an expanded vehicle, keyed by hotspot id
  const [expandedVehicle, setExpandedVehicle] = useState({});

  const sortedHotspots = useMemo(() => {
    if (!hotspots?.hotspots) return [];
    return [...hotspots.hotspots].sort((a, b) => b.cisScore - a.cisScore);
  }, [hotspots]);

  const filteredHotspots = useMemo(() => {
    if (severityFilter === 'all') return sortedHotspots;
    return sortedHotspots.filter(h => h.severity === severityFilter);
  }, [sortedHotspots, severityFilter]);

  if (!hotspots) return <div style={{ padding: '40px' }}>Loading...</div>;

  const criticalCount = hotspots.stats.criticalCount;
  const highCount = hotspots.stats.highCount;
  const mediumCount = sortedHotspots.filter(h => h.severity === 'medium').length;
  const totalCount = sortedHotspots.length;

  const getSeverityColor = (sev) => {
    if (sev === 'critical') return 'var(--danger)';
    if (sev === 'high') return 'var(--warning)';
    if (sev === 'medium') return '#3b82f6';
    return 'var(--success)';
  };

  const getCISGradient = (score) => {
    if (score >= 65) return 'linear-gradient(90deg, #ef4444, #dc2626)';
    if (score >= 45) return 'linear-gradient(90deg, #f59e0b, #ef4444)';
    if (score >= 25) return 'linear-gradient(90deg, #3b82f6, #f59e0b)';
    return 'linear-gradient(90deg, #10b981, #3b82f6)';
  };

  const filterBtnStyle = (active) => ({
    padding: '6px 16px',
    borderRadius: '20px',
    border: active ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border)',
    background: active ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: active ? '600' : '400',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  });

  const handleVehicleClick = (hotspotId, vtype) => {
    setExpandedVehicle(prev => {
      if (prev[hotspotId] === vtype) return { ...prev, [hotspotId]: null }; // collapse
      return { ...prev, [hotspotId]: vtype };
    });
  };

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Hotspot Intelligence</h2>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        marginBottom: '28px',
        lineHeight: '1.5',
      }}>
        Detected <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{totalCount} hotspots</span> across Bangalore, with{' '}
        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{criticalCount} classified as Critical</span> severity.
      </p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Critical</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
            {criticalCount}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>High Risk</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
            {highCount}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Medium</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {mediumCount}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'visible', zIndex: 10 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Average CIS Score
            <span
              onMouseEnter={() => setShowCISInfo(true)}
              onMouseLeave={() => setShowCISInfo(false)}
              style={{ cursor: 'help', fontSize: '1rem', opacity: 0.7, position: 'relative', display: 'inline-block' }}
            >
              ⓘ
              {showCISInfo && (
                <>
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.85)', zIndex: 999,
                }} />
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '360px',
                  padding: '24px',
                  background: '#000000',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 24px 80px rgba(0,0,0,1)',
                  zIndex: 1000,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.7',
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.85rem' }}>
                    Congestion Impact Score (CIS)
                  </div>
                  <div>A composite 0–100 metric measuring how severely a hotspot impacts traffic flow:</div>
                  <ul style={{ margin: '8px 0', paddingLeft: '18px' }}>
                    <li><strong>35%</strong> — Violation density (vs. city 95th percentile)</li>
                    <li><strong>25%</strong> — Violation severity (main road / double parking)</li>
                    <li><strong>15%</strong> — Vehicle blockage (buses/HGVs = high)</li>
                    <li><strong>15%</strong> — Peak-hour timing (rush hour = high)</li>
                    <li><strong>10%</strong> — Road type (junction vs. non-junction)</li>
                  </ul>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--danger)' }}>■ Critical ≥65</span>{' · '}
                    <span style={{ color: 'var(--warning)' }}>■ High ≥45</span>{' · '}
                    <span style={{ color: '#3b82f6' }}>■ Medium ≥25</span>{' · '}
                    <span style={{ color: 'var(--success)' }}>■ Low &lt;25</span>
                  </div>
                </div>
                </>
              )}
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            {hotspots.stats.avgCIS}
          </div>
        </div>
      </div>

      {/* Severity filter toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '4px' }}>Filter:</span>
        {[
          { key: 'all', label: 'All' },
          { key: 'critical', label: '🔴 Critical' },
          { key: 'high', label: '🟠 High' },
          { key: 'medium', label: '🔵 Medium' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setSeverityFilter(f.key)}
            style={filterBtnStyle(severityFilter === f.key)}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{
                marginLeft: '6px',
                background: severityFilter === f.key ? 'rgba(0,212,255,0.2)' : 'var(--surface-elevated)',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.75rem',
              }}>
                {sortedHotspots.filter(h => h.severity === f.key).length}
              </span>
            )}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Showing {filteredHotspots.length} of {totalCount}
        </span>
      </div>

      {/* Hotspot cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
        {filteredHotspots.map((h, i) => {
          const globalIndex = sortedHotspots.indexOf(h) + 1;
          const barWidth = Math.min(h.cisScore, 100);
          const topViolations = h.topViolations || [];
          const vehicleDetails = h.vehicleDetails || h.topVehicles || [];
          const maxViolCount = topViolations.length > 0 ? topViolations[0].count : 1;
          const selectedVehicle = expandedVehicle[h.id] || null;
          const selectedVehicleData = selectedVehicle
            ? vehicleDetails.find(v => v.type === selectedVehicle)
            : null;

          return (
            <div key={h.id} className="glass-panel" style={{
              padding: '24px',
              cursor: 'default',
              position: 'relative',
              borderTop: `3px solid ${getSeverityColor(h.severity)}`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: globalIndex <= 3 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 212, 255, 0.15)',
                    color: globalIndex <= 3 ? 'var(--danger)' : 'var(--accent-primary)',
                    fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0,
                  }}>
                    #{globalIndex}
                  </span>
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '2px', fontSize: '1.1rem' }}>{h.policeStation}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {h.microClusters || 1} micro-cluster{(h.microClusters || 1) > 1 ? 's' : ''} detected
                    </span>
                  </div>
                </div>
                <div style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: h.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                    h.severity === 'high' ? 'rgba(245, 158, 11, 0.2)' :
                    h.severity === 'medium' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: getSeverityColor(h.severity),
                }}>
                  CIS {h.cisScore}
                </div>
              </div>

              {/* Key stats row — show vehicle-specific if selected, else total */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                marginBottom: '16px', padding: '12px', borderRadius: '10px',
                background: selectedVehicle ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255,255,255,0.02)',
                border: selectedVehicle ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid transparent',
                transition: 'all 0.25s ease',
              }}>
                {selectedVehicleData ? (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                        {selectedVehicleData.count.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>
                        {selectedVehicle} COUNT
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                        {selectedVehicleData.peakHourIST}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>PEAK HOUR</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {h.violationCount > 0 ? ((selectedVehicleData.count / h.violationCount) * 100).toFixed(1) : 0}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>OF TOTAL</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {h.violationCount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>VIOLATIONS</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                        {h.peakHourIST}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>PEAK HOUR</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {Math.round(h.radius_m)}m
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>SPREAD</div>
                    </div>
                  </>
                )}
              </div>

              {/* Violation breakdown — shows vehicle-specific if selected */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.08em', fontWeight: '600' }}>
                  {selectedVehicle ? `${selectedVehicle} — VIOLATIONS` : 'VIOLATION BREAKDOWN'}
                </div>
                {(() => {
                  const viols = selectedVehicleData
                    ? (selectedVehicleData.topViolations || [])
                    : topViolations.slice(0, 3);
                  const maxC = viols.length > 0 ? viols[0].count : 1;
                  return viols.map((v, vi) => (
                    <div key={vi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div
                        title={v.type}
                        style={{
                          flex: '0 0 160px', fontSize: '0.8rem', color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          cursor: 'default',
                        }}
                      >
                        {v.type.replace('PARKING OTHER THAN BUS STOP', 'PARKING (NOT BUS STOP)')
                              .replace('PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS', 'NEAR SIGNAL/ZEBRA')}
                      </div>
                      <div style={{ flex: 1, height: '6px', background: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${(v.count / maxC) * 100}%`,
                          background: selectedVehicle
                            ? (vi === 0 ? 'var(--accent-secondary)' : vi === 1 ? '#a855f7' : '#64748b')
                            : (vi === 0 ? 'var(--accent-primary)' : vi === 1 ? 'var(--accent-secondary)' : '#64748b'),
                          borderRadius: '3px', transition: 'width 0.5s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
                        {v.count >= 1000 ? `${(v.count/1000).toFixed(1)}k` : v.count}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Vehicle-Wise Analysis — clickable pills */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.08em', fontWeight: '600' }}>
                  VEHICLE-WISE ANALYSIS <span style={{ fontWeight: '400', opacity: 0.7 }}>(click to drill down)</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedVehicle && (
                    <span
                      onClick={() => handleVehicleClick(h.id, selectedVehicle)}
                      style={{
                        padding: '4px 10px', borderRadius: '14px', fontSize: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                        border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      ✕ Show All
                    </span>
                  )}
                  {vehicleDetails.slice(0, 5).map((v, vi) => {
                    const isActive = selectedVehicle === v.type;
                    return (
                      <span
                        key={vi}
                        onClick={() => handleVehicleClick(h.id, v.type)}
                        style={{
                          padding: '4px 10px', borderRadius: '14px', fontSize: '0.75rem',
                          background: isActive ? 'rgba(139, 92, 246, 0.2)' : (vi === 0 && !selectedVehicle ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255,255,255,0.04)'),
                          color: isActive ? 'var(--accent-secondary)' : (vi === 0 && !selectedVehicle ? 'var(--accent-primary)' : 'var(--text-secondary)'),
                          border: `1px solid ${isActive ? 'rgba(139, 92, 246, 0.4)' : (vi === 0 && !selectedVehicle ? 'rgba(0, 212, 255, 0.2)' : 'var(--border)')}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontWeight: isActive ? '600' : '400',
                        }}
                      >
                        {v.type} ({v.count >= 1000 ? `${(v.count/1000).toFixed(1)}k` : v.count})
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* CIS progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Congestion Impact</span>
                  <span style={{ fontWeight: '600', color: getSeverityColor(h.severity) }}>
                    {h.severity.charAt(0).toUpperCase() + h.severity.slice(1)} — {barWidth}%
                  </span>
                </div>
                <div style={{ height: '8px', width: '100%', background: 'var(--surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${barWidth}%`,
                    background: getCISGradient(h.cisScore),
                    borderRadius: '4px', transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Coordinates */}
              {h.lat != null && h.lng != null && (
                <div style={{
                  marginTop: '14px', paddingTop: '10px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.75rem', color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7,
                }}>
                  📍 {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                  {h.junctionName && h.junctionName !== 'No Junction' && (
                    <span style={{ marginLeft: '8px' }}>🚦 {h.junctionName}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotspotPanel;
