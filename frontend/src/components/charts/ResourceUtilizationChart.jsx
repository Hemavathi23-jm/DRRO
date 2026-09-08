import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#1e4d8c', '#475467', '#667085', '#98a2b3'];

export default function ResourceUtilizationChart({ data }) {
  let chartData = [
    { name: 'Available', value: 0 },
    { name: 'Reserved', value: 0 },
    { name: 'Dispatched', value: 0 },
  ];

  if (Array.isArray(data) && data.length > 0) {
    const avail = data.reduce((s, c) => s + Number(c.totalAvailable || 0), 0);
    const reserved = data.reduce((s, c) => s + Number(c.totalReserved || 0), 0);
    const dispatched = data.reduce((s, c) => s + Number(c.totalDispatched || 0), 0);
    chartData = [
      { name: 'Available', value: avail },
      { name: 'Reserved', value: reserved },
      { name: 'Dispatched', value: dispatched },
    ].filter(d => d.value > 0);
  }

  return (
    <div className="card" style={{ height: 280 }}>
      <p className="card-title">Resource Utilization</p>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={2}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }} />
          <Legend iconType="square" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.786rem' }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
