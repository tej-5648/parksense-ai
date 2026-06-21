import React from 'react';

const About = ({ setView }) => {
  return (
    <div style={{ padding: '40px', height: '100%', overflowY: 'auto', background: 'radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.08) 0%, transparent 70%)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', paddingTop: '20px' }}>
        
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
          width: '80px', height: '80px', borderRadius: '20px', 
          background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🚓</span>
        </div>

        <h1 style={{ 
          fontSize: '4.5rem', marginBottom: '24px', letterSpacing: '-0.02em',
          background: 'linear-gradient(90deg, #ffffff, #06b6d4, #3b82f6)', 
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: '0 10px 30px rgba(6, 182, 212, 0.2)'
        }}>
          ParkSense AI
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '40px', padding: '0 20px' }}>
          An intelligent spatial-analytics platform built to empower the <strong>Bengaluru Traffic Police (BTP)</strong>. 
          By transforming raw citation data into predictive intelligence, ParkSense AI shifts the paradigm from reactive ticketing to proactive city management.
        </p>

        <button 
          onClick={() => setView('map')}
          style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '16px 36px',
            borderRadius: '30px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(6, 182, 212, 0.3)',
            transition: 'all 0.3s ease',
            marginBottom: '60px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(6, 182, 212, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(6, 182, 212, 0.3)';
          }}
        >
          Launch Live Dashboard →
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', textAlign: 'left', marginBottom: '60px' }}>
          <div className="glass-panel" style={{ padding: '30px', borderTop: '3px solid #ef4444' }}>
            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🚨</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '1.2rem' }}>The Challenge</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Bengaluru's rapid growth has led to severe bottlenecks. Illegal parking on main roads degrades traffic flow and causes critical delays, yet manual enforcement cannot scale to cover every street.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '30px', borderTop: '3px solid #06b6d4' }}>
            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🧠</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '1.2rem' }}>Our AI Engine</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              We ingest 298,000+ historical violations and use <strong>HDBSCAN clustering</strong> to map exact high-density zones. We calculate a proprietary <em>Congestion Impact Score (CIS)</em> to rank severity.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '30px', borderTop: '3px solid #10b981' }}>
            <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🚓</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '1.2rem' }}>Smart Enforcement</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
              Instead of random patrols, our optimizer generates precise shift recommendations (Morning, Afternoon, Night) based on predictive models, maximizing officer impact and revenue recovery.
            </p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Why Bengaluru Traffic Police Needs This</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>52</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>Critical Hotspots Monitored</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>24/7</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>AI-Driven Temporal Coverage</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
