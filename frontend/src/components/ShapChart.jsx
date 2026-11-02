/**
 * SHAP Waterfall / Bar Chart Component
 * Displays feature-level explanations for a prediction.
 */

export default function ShapChart({ explanation }) {
  if (!explanation || !explanation.shap_values) {
    return <div className="empty-state"><p>No explanation data available</p></div>;
  }

  const values = [...explanation.shap_values]
    .filter(item => !item.feature.toLowerCase().includes('region'))
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 10);

  const maxAbsValue = Math.max(...values.map((v) => Math.abs(v.shap_value)), 0.001);

  const formatFeatureName = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.8rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(90deg, var(--accent-danger), #ff7675)', display: 'inline-block' }} />
          Increases Risk
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(90deg, var(--accent-success), #55efc4)', display: 'inline-block' }} />
          Decreases Risk
        </span>
      </div>

      {values.map((item, index) => {
        const widthPercent = (Math.abs(item.shap_value) / maxAbsValue) * 100;
        const isPositive = item.shap_value > 0;

        return (
          <div key={index} className="shap-bar">
            <span className="shap-feature-name">{formatFeatureName(item.feature)}</span>
            <div className="shap-bar-track">
              <div
                className={`shap-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              />
            </div>
            <span className="shap-value">
              {isPositive ? '+' : ''}{item.shap_value.toFixed(3)}
            </span>
          </div>
        );
      })}

      {explanation.top_features && (
        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Top Risk Factors
          </h4>
          {explanation.top_features.filter(f => !f.feature.toLowerCase().includes('region')).map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '0.85rem' }}>
              <span style={{ color: f.shap_value > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                {f.shap_value > 0 ? '▲' : '▼'}
              </span>
              <span>{formatFeatureName(f.feature)}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.8rem' }}>
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
