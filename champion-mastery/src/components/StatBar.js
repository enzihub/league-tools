export default function StatBar({ label, value, max = 10 }) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="info-bar">
      <div className="bar-label">
        <span>{label}</span>
        <span className="bar-value">{value}/{max}</span>
      </div>
      <div className="bar-container" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
        <div className="bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
