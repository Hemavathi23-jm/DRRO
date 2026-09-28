import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLOR_MAP = {
  'Available': '#10b981',   // Emerald Green
  'Dispatched': '#3b82f6',  // Bright Electric Blue
  'Reserved': '#f59e0b',    // Amber / Warm Gold
  'Delivered': '#8b5cf6',   // Purple
};

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function ResourceUtilizationChart({ data }) {
  let chartData = [
    { name: 'Available', value: 0 },
    { name: 'Dispatched', value: 0 },
    { name: 'Reserved', value: 0 },
  ];

  if (Array.isArray(data) && data.length > 0) {
    const avail = data.reduce((s, c) => s + Number(c.totalAvailable || 0), 0);
    const reserved = data.reduce((s, c) => s + Number(c.totalReserved || 0), 0);
    const dispatched = data.reduce((s, c) => s + Number(c.totalDispatched || 0), 0);
    chartData = [
      { name: 'Available', value: avail },
      { name: 'Dispatched', value: dispatched },
      { name: 'Reserved', value: reserved },
    ].filter(d => d.value > 0);
  }

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <p className="card-title" style={{ margin: 0, fontWeight: 700 }}>Resource Utilization</p>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Total Units: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{total.toLocaleString()}</strong>
        </span>
      </div>

      <div style={{ height: 210, width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={4}
              minAngle={24} /* Guarantees small slices like 362 and 80 are prominently visible on the ring */
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={STATUS_COLOR_MAP[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  stroke="var(--bg-surface)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} units (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Visual Status Indicator Badges (Always clear regardless of proportion) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginTop: 4 }}>
        {chartData.map((item) => {
          const color = STATUS_COLOR_MAP[item.name] || '#64748b';
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={item.name}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: 'var(--bg-card)',
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {Number(item.value).toLocaleString()}
                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
