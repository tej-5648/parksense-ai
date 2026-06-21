import React, { useState, useMemo } from 'react';

const TIME_PERIODS = [
  { key: 'morning', label: 'Morning', color: '#f59e0b' },
  { key: 'afternoon', label: 'Afternoon', color: '#ef4444' },
  { key: 'evening', label: 'Evening', color: '#7c3aed' },
  { key: 'night', label: 'Night', color: '#3b82f6' },
];

const Predictions = ({ data }) => {
  const { predictions } = data;
  // Track which zone card has an expanded time period, keyed by zone index
  const [expandedPeriod, setExpandedPeriod] = useState({});

  const totals = useMemo(() => {
    if (!predictions?.zoneForecasts) return null;
    const result = { morning: 0, afternoon: 0, evening: 0, night: 0, total: 0, zones: predictions.zoneForecasts.length };
    predictions.zoneForecasts.forEach(z => {
      result.morning += z.predictedViolations.morning;
      result.afternoon += z.predictedViolations.afternoon;
      result.evening += z.predictedViolations.evening;
      result.night += z.predictedViolations.night;
    });
    result.total = result.morning + result.afternoon + result.evening + result.night;
    return result;
  }, [predictions]);

  if (!predictions) return <div style={{ padding: '40px' }}>Loading...</div>;

  const getPeakPeriod = (pv) => {
    let max = -1, peak = '';
    TIME_PERIODS.forEach(tp => {
      if (pv[tp.key] > max) { max = pv[tp.key]; peak = tp.key; }
    });
    return peak;
  };

  const handlePeriodClick = (zoneIdx, periodKey) => {
    setExpandedPeriod(prev => {
      if (prev[zoneIdx] === periodKey) return { ...prev, [zoneIdx]: null };
      return { ...prev, [zoneIdx]: periodKey };
    });
  };

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Zone Predictions (Next 24h)</h2>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        marginBottom: '28px',
        lineHeight: '1.5',
      }}>
        AI-powered predictions for the next 24 hours based on historical patterns across{' '}
        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{totals.zones} zones</span>.
      </p>

      {/* Totals summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{
          padding: '18px', textAlign: 'center',
          borderTop: '3px solid var(--accent-primary)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Predicted</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totals.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>violations</div>
        </div>
        {TIME_PERIODS.map(tp => (
          <div key={tp.key} className="glass-panel" style={{
            padding: '18px', textAlign: 'center',
            borderTop: `3px solid ${tp.color}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>
              {tp.label}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: tp.color }}>{totals[tp.key]}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {totals.total > 0 ? ((totals[tp.key] / totals.total) * 100).toFixed(0) : 0}%
            </div>
          </div>
        ))}
      </div>

      {/* Zone cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
        {predictions.zoneForecasts.map((zone, i) => {
          const pv = zone.predictedViolations;
          const zoneTotal = pv.morning + pv.afternoon + pv.evening + pv.night;
          const peak = getPeakPeriod(pv);
          const selectedPeriod = expandedPeriod[i] || null;
          const selectedTP = selectedPeriod ? TIME_PERIODS.find(t => t.key === selectedPeriod) : null;

          return (
            <div key={i} className="glass-panel" style={{ padding: '20px' }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: '5px', fontSize: '1.2rem' }}>{zone.zone}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Confidence:{' '}
                    <span style={{ color: zone.confidence > 0.8 ? 'var(--success)' : 'var(--warning)' }}>
                      {(zone.confidence * 100).toFixed(0)}%
                    </span>
                    <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
                    Total: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{zoneTotal}</span>
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  backgroundColor: zone.riskLevel === 'critical' ? 'rgba(239, 68, 68, 0.2)' :
                    zone.riskLevel === 'high' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: zone.riskLevel === 'critical' ? 'var(--danger)' :
                    zone.riskLevel === 'high' ? 'var(--warning)' : 'var(--success)',
                }}>
                  {zone.riskLevel.toUpperCase()} RISK
                </div>
              </div>

              {/* Time period blocks — clickable */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '16px' }}>
                {TIME_PERIODS.map(tp => {
                  const isPeak = tp.key === peak;
                  const isSelected = selectedPeriod === tp.key;
                  return (
                    <div
                      key={tp.key}
                      onClick={() => handlePeriodClick(i, tp.key)}
                      style={{
                        background: isSelected ? `${tp.color}33` : isPeak ? `${tp.color}22` : 'var(--surface-elevated)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${tp.color}` : isPeak ? `1.5px solid ${tp.color}` : '1.5px solid transparent',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        {tp.emoji} {tp.label}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (isSelected || isPeak) ? tp.color : 'var(--text-primary)' }}>
                        {pv[tp.key]}
                      </div>
                      {isPeak && !isSelected && (
                        <div style={{
                          fontSize: '0.6rem', fontWeight: '700', color: tp.color,
                          textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px',
                        }}>Peak</div>
                      )}
                      {isSelected && (
                        <div style={{
                          fontSize: '0.6rem', fontWeight: '700', color: tp.color,
                          textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px',
                        }}>Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed metrics for selected period OR total */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '16px',
                background: selectedPeriod ? `${selectedTP.color}11` : 'rgba(255,255,255,0.02)',
                border: selectedPeriod ? `1px solid ${selectedTP.color}33` : '1px solid transparent',
                transition: 'all 0.25s ease',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center',
                }}>
                  {selectedPeriod ? (
                    <>
                      <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: selectedTP.color }}>
                          {pv[selectedPeriod]}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>
                          {selectedTP.label.toUpperCase()} VIOLATIONS
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {zoneTotal > 0 ? ((pv[selectedPeriod] / zoneTotal) * 100).toFixed(1) : 0}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>
                          OF ZONE TOTAL
                        </div>
                      </div>
                      <div>
                        {(() => {
                          const peakCount = pv[peak];
                          const thisCount = pv[selectedPeriod];
                          const ratio = peakCount > 0 ? thisCount / peakCount : 0;
                          if (selectedPeriod === peak) {
                            return (
                              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                ⚠ Peak
                              </div>
                            );
                          } else if (ratio >= 0.5) {
                            return (
                              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                                ▲ Elevated
                              </div>
                            );
                          } else {
                            return (
                              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                ✓ Normal
                              </div>
                            );
                          }
                        })()}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>
                          STATUS
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                          {zoneTotal}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>TOTAL PREDICTED</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                          {TIME_PERIODS.find(t => t.key === peak)?.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>PEAK PERIOD</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: zone.confidence > 0.8 ? 'var(--success)' : 'var(--warning)' }}>
                          {(zone.confidence * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '2px' }}>CONFIDENCE</div>
                      </div>
                    </>
                  )}
                </div>
                {selectedPeriod && (
                  <div
                    onClick={() => handlePeriodClick(i, selectedPeriod)}
                    style={{
                      textAlign: 'center', marginTop: '10px', fontSize: '0.75rem',
                      color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.8,
                    }}
                  >
                    Click selected period again or <span style={{ color: 'var(--danger)' }}>✕ reset</span> to show totals
                  </div>
                )}
              </div>

              {/* Horizontal stacked bar chart */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Distribution</div>
                <div style={{
                  display: 'flex', width: '100%', height: '14px',
                  borderRadius: '7px', overflow: 'hidden', background: 'var(--surface-elevated)',
                }}>
                  {TIME_PERIODS.map(tp => {
                    const pct = zoneTotal > 0 ? (pv[tp.key] / zoneTotal) * 100 : 0;
                    return (
                      <div
                        key={tp.key}
                        title={`${tp.label}: ${pv[tp.key]} (${pct.toFixed(0)}%)`}
                        style={{
                          width: `${pct}%`, height: '100%', background: tp.color,
                          transition: 'width 0.4s ease', minWidth: pct > 0 ? '4px' : '0',
                          opacity: selectedPeriod && selectedPeriod !== tp.key ? 0.3 : 1,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {TIME_PERIODS.map(tp => {
                    const pct = zoneTotal > 0 ? (pv[tp.key] / zoneTotal) * 100 : 0;
                    return (
                      <div key={tp.key} style={{
                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem',
                        color: selectedPeriod === tp.key ? tp.color : 'var(--text-secondary)',
                        fontWeight: selectedPeriod === tp.key ? '600' : '400',
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tp.color, display: 'inline-block' }} />
                        {tp.label} {pct.toFixed(0)}%
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Expected Main Issue:</strong> {zone.topPredictedType}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Predictions;
