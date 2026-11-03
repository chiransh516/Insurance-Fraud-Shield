import { ShieldAlert, Activity, Eye, Database, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>About the Project</h1>
        <p>Insurance Claim Fraud & Amount Prediction System</p>
      </div>

      <div className="card" style={{ maxWidth: '850px' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="var(--accent-primary)" />
            System Architecture
          </div>
        </div>

        <div style={{ padding: '8px 0', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.05rem' }}>
            This project helps insurance companies process vehicle claims quickly and safely.
            We use Machine Learning to automatically check if a new claim is genuine or fake (Fraud Detection),
            and to estimate the correct repair amount based on past data.
          </p>

          <div style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px' }}><strong>Core Capabilities:</strong></p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ShieldAlert size={20} color="var(--accent-danger)" style={{ marginTop: '4px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Fraud Detection:</strong> Uses an XGBoost Classifier combined with SMOTE (to handle imbalanced datasets) to flag highly suspicious claims for manual review.
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Activity size={20} color="var(--accent-success)" style={{ marginTop: '4px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Amount Prediction:</strong> Uses an XGBoost Regressor to estimate the fair settlement amount for genuine claims, speeding up the approval process.
                </div>
              </li>


              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle2 size={20} color="var(--accent-warning)" style={{ marginTop: '4px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Risk Scoring Engine:</strong> Computes a composite risk score based on predictive fraud probability, past claims history, and coverage ratios.
                </div>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px' }}><strong>Technology Stack:</strong></p>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <p style={{ margin: '0 0 8px 0' }}>• <strong>Backend:</strong> Python, Flask, SQLAlchemy, MySQL</p>
              <p style={{ margin: '0 0 8px 0' }}>• <strong>Machine Learning:</strong> Scikit-Learn, XGBoost, SMOTE (Data Balancing), Pandas</p>
              <p style={{ margin: '0' }}>• <strong>Frontend:</strong> React.js, Vite, Recharts, HTML/CSS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
