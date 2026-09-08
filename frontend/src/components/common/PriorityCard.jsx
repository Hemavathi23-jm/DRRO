export default function PriorityCard({ score, factors }) {
  const bars = [
    { label: 'Severity', value: factors?.severityScore ?? 0 },
    { label: 'Population', value: factors?.populationScore ?? 0 },
    { label: 'Urgency', value: factors?.urgencyScore ?? 0 },
    { label: 'Shortage', value: factors?.shortageScore ?? 0 },
    { label: 'Travel Time', value: factors?.travelTimeScore ?? 0 },
    { label: 'Vulnerability', value: factors?.vulnerabilityScore ?? 0 },
  ];

  return (
    <div className="card">
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <span className="card-title">Priority Score Breakdown</span>
        <span className="metric-highlight">{Number(score ?? 0).toFixed(1)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: '0.786rem', color: 'var(--text-secondary)' }}>{b.label}</span>
              <span style={{ fontSize: '0.786rem', fontWeight: 600 }}>{Number(b.value).toFixed(1)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill--accent" style={{ width: `${Math.min(b.value, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {factors?.explanationText && (
        <p style={{
          marginTop: 14,
          fontSize: '0.857rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12,
        }}>
          {factors.explanationText}
        </p>
      )}
    </div>
  );
}
