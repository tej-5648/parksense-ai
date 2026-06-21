import React, { useMemo, useState } from 'react';

const Enforcement = ({ data }) => {
  const { enforcement } = data;
  const [hoveredRow, setHoveredRow] = useState(null);

  const totalOfficers = useMemo(() => {
    if (!enforcement?.patrolZones) return 0;
    return enforcement.patrolZones.reduce((sum, z) => sum + z.recommendedPatrols, 0);
  }, [enforcement]);

  const totalPredictedViolations = useMemo(() => {
    if (!enforcement?.patrolZones) return 0;
    return enforcement.patrolZones.reduce((sum, z) => sum + z.predictedViolations, 0);
  }, [enforcement]);

  if (!enforcement) return <div style={{ padding: '40px' }}>Loading...</div>;

  const getPatrolColor = (count) => {
    if (count > 3) return 'var(--danger)';
    if (count >= 2) return 'var(--warning)';
    return 'var(--success)';
  };

  const getPatrolBg = (count) => {
    if (count > 3) return 'rgba(239, 68, 68, 0.15)';
    if (count >= 2) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(16, 185, 129, 0.15)';
  };

  const shiftConfig = [
    { key: 'morning', label: 'Morning Shift', color: 'var(--success)', timeRange: '08:00 - 14:00' },
    { key: 'afternoon', label: 'Afternoon Shift', color: 'var(--warning)', timeRange: '14:00 - 22:00' },
    { key: 'night', label: 'Night Shift', color: 'var(--danger)', timeRange: '22:00 - 06:00' }
  ];

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '8px' }}>Patrol Optimization Commander</h2>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        marginBottom: '28px',
        lineHeight: '1.5',
      }}>
        Smart deployment recommendations to maximize violation coverage with minimum officers.
      </p>

      {/* Summary stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{
          padding: '20px', textAlign: 'center',
          borderTop: '3px solid var(--accent-primary)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Total Officers Required</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totalOfficers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>across all zones</div>
        </div>
        <div className="glass-panel" style={{
          padding: '20px', textAlign: 'center',
          borderTop: '3px solid var(--warning)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Priority Zones Tracked</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{enforcement.patrolZones.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>ranked by priority</div>
        </div>
        <div className="glass-panel" style={{
          padding: '20px', textAlign: 'center',
          borderTop: '3px solid var(--danger)',
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Predicted Violations/Day</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{totalPredictedViolations}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>total across zones</div>
        </div>
      </div>

      {/* Shift recommendation cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        {shiftConfig.map(shift => (
          <div key={shift.key} className="glass-panel" style={{
            padding: '20px', flex: 1,
            borderTop: `3px solid ${shift.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ marginTop: 0, marginBottom: 0, color: shift.color }}>{shift.label}</h3>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{shift.timeRange}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {enforcement.shiftRecommendations[shift.key].map((zone, i) => (
                <li key={i} style={{
                  padding: '10px 12px',
                  borderBottom: i < enforcement.shiftRecommendations[shift.key].length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: `${shift.color}22`,
                    color: shift.color,
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    border: `1.5px solid ${shift.color}`,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.9rem' }}>{zone}</span>
                  {i < 2 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: i === 0 ? 'var(--danger)' : 'var(--warning)',
                      background: i === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {i === 0 ? 'Top' : 'High'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Priority zones table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Priority-wise Zones</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px' }}>Rank</th>
                <th style={{ padding: '12px 16px' }}>Zone</th>
                <th style={{ padding: '12px 16px', minWidth: '220px' }}>Priority Score</th>
                <th style={{ padding: '12px 16px' }}>Predicted Violations/Day</th>
                <th style={{ padding: '12px 16px' }}>Recommended Patrols</th>
              </tr>
            </thead>
            <tbody>
              {enforcement.patrolZones.map((zone, i) => {
                const isHovered = hoveredRow === i;
                const patrolColor = getPatrolColor(zone.recommendedPatrols);
                const patrolBg = getPatrolBg(zone.recommendedPatrols);

                return (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isHovered
                        ? 'rgba(0, 212, 255, 0.06)'
                        : i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.15s ease',
                      cursor: 'default',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: zone.rank <= 3 ? 'rgba(239,68,68,0.15)' : 'var(--surface-elevated)',
                        color: zone.rank <= 3 ? 'var(--danger)' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                      }}>
                        #{zone.rank}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{zone.zone}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '160px', height: '10px',
                          background: 'var(--surface-elevated)',
                          borderRadius: '5px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}>
                          <div style={{
                            width: `${zone.priorityScore}%`,
                            height: '100%',
                            background: zone.priorityScore > 75
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : zone.priorityScore > 50
                                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                : 'linear-gradient(90deg, #10b981, #f59e0b)',
                            borderRadius: '5px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <span style={{
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: zone.priorityScore > 75 ? 'var(--danger)' : 'var(--warning)',
                          minWidth: '36px',
                        }}>
                          {zone.priorityScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{zone.predictedViolations}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: patrolBg,
                        color: patrolColor,
                        fontWeight: '600',
                        fontSize: '0.85rem',
                      }}>
                        {zone.recommendedPatrols} Officers
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Enforcement;
