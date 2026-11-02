/**
 * Risk Gauge Component
 * Circular gauge displaying risk score 0–100 with color coding.
 */

export default function RiskGauge({ score = 0, size = 160 }) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (normalizedScore / 100) * circumference;

  // Color based on risk level
  let color, glowColor, label;
  if (normalizedScore <= 30) {
    color = '#00b894';
    glowColor = 'rgba(0, 184, 148, 0.3)';
    label = 'Low Risk';
  } else if (normalizedScore <= 60) {
    color = '#fdcb6e';
    glowColor = 'rgba(253, 203, 110, 0.3)';
    label = 'Medium Risk';
  } else {
    color = '#e17055';
    glowColor = 'rgba(225, 112, 85, 0.3)';
    label = 'High Risk';
  }

  return (
    <div className="risk-gauge">
      <div className="gauge-circle" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <span className="gauge-value" style={{ color }}>
          {normalizedScore}
        </span>
      </div>
      <span className="gauge-label" style={{ color }}>{label}</span>
    </div>
  );
}
