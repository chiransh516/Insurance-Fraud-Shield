import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RiskGauge from '../components/RiskGauge';
import ShapChart from '../components/ShapChart';
import { StatusBadge } from '../components/Navbar';
import { getClaim } from '../services/api';

export default function PredictionResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [prediction, setPrediction] = useState(location.state?.prediction || null);
  const [loading, setLoading] = useState(!location.state?.prediction && id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && !prediction) {
      setLoading(true);
      getClaim(id)
        .then(res => {
          setPrediction(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load claim details.');
          setLoading(false);
        });
    }
  }, [id, prediction]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-ghost" onClick={() => navigate('/claims-history')} style={{ marginTop: '16px' }}>
          Back to Claims
        </button>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="empty-state">
        <div className="icon">🔍</div>
        <h2>No Prediction Data</h2>
        <p>Submit a claim first to see prediction results.</p>
        <button className="btn btn-primary" onClick={() => navigate('/claim-entry')} style={{ marginTop: '16px' }}>
          Submit a Claim
        </button>
      </div>
    );
  }

  const fraudPercent = (prediction.fraud_probability * 100).toFixed(1);

  return (
    <div>
      <div className="page-header">
        <h1>Prediction Results</h1>
        <p>Claim #{prediction.claim_id || prediction.id} — Analysis Complete</p>
      </div>

      {/* Top Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className={`kpi-card ${prediction.is_fraud ? 'danger' : 'success'}`}>
          <div className="kpi-label">Fraud Detection</div>
          <div className={`kpi-value ${prediction.is_fraud ? 'danger' : 'success'}`}>
            {prediction.is_fraud ? 'FRAUD' : 'GENUINE'}
          </div>
          <div className="kpi-subtitle">{fraudPercent}% probability</div>
        </div>

        <div className="kpi-card primary">
          <div className="kpi-label">Risk Score</div>
          <div className="kpi-value primary">{prediction.risk_score}/100</div>
          <div className="kpi-subtitle">{prediction.risk_level} risk</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-label">Estimated Amount</div>
          <div className="kpi-value warning">
            {prediction.estimated_amount
              ? `₹${prediction.estimated_amount.toLocaleString()}`
              : 'N/A'}
          </div>
          <div className="kpi-subtitle">{prediction.is_fraud ? 'Flagged — no estimate' : 'Settlement estimate'}</div>
        </div>

        <div className="kpi-card primary">
          <div className="kpi-label">Status</div>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge status={prediction.status} />
          </div>
          <div className="kpi-subtitle" style={{ marginTop: '8px' }}>Claim #{prediction.claim_id || prediction.id}</div>
        </div>
      </div>

      {/* Claim Full Details */}
      <div className="result-section" style={{ marginTop: '24px', marginBottom: '24px', background: 'var(--bg-glass)', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '16px' }}>Claim Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Info</div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Name: {prediction.customer_name || prediction.submitted_by || 'Unknown'}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Age {prediction.customer_age} • {prediction.customer_gender}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Past Claims: {prediction.num_past_claims}</div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Vehicle Details</div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{prediction.vehicle_make} {prediction.vehicle_model} ({prediction.vehicle_manufacture_year})</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>IDV: ₹{prediction.insured_declared_value?.toLocaleString()}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Vehicle Age: {prediction.vehicle_age} yrs</div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Incident Details</div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{prediction.damage_type}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Severity: {prediction.damage_severity}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Requested: ₹{prediction.claim_amount_requested?.toLocaleString()}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Policy Info</div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Type: {prediction.policy_type}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Coverage: ₹{prediction.coverage_amount?.toLocaleString()}</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Duration: {prediction.policy_duration_days} days</div>
          </div>
        </div>
      </div>

      {/* Risk Gauge + Risk Components */}
      <div className="result-grid">
        <div className="result-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ alignSelf: 'flex-start' }}>Risk Score Gauge</h3>
          <RiskGauge score={prediction.risk_score} size={180} />

          {prediction.risk_components && (
            <div style={{ width: '100%', marginTop: '24px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Score Breakdown</h4>
              {Object.entries(prediction.risk_components).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(' Score', '')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {value}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SHAP Explanation */}
        <div className="result-section">
          <h3>Feature Explanation (SHAP)</h3>
          <ShapChart explanation={prediction.shap_explanation} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/claim-entry')}>
          📝 Submit Another Claim
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/claims-history')}>
          📋 View All Claims
        </button>
      </div>
    </div>
  );
}
