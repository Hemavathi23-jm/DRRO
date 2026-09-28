import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AllocationTimeline({ data }) {
  let chartData = [{ strategy: 'GREEDY', count: 0, avgScore: 0 }];

  if (Array.isArray(data) && data.length > 0) {
    chartData = data.map(d => ({
      strategy: (d.strategy || '').replace('_BASELINE', '').replace(/_/g, ' '),
      count: d.allocationCount ?? 0,
      avgScore: Math.round((d.avgPriorityScore ?? 0) * 10) / 10,
    }));
  }

  return (
    <div className="card" style={{ height: 280 }}>
      <p className="card-title">Algorithm Comparison</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="strategy" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }} />
          <Legend iconType="square" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.786rem' }}>{v}</span>} />
          <Bar yAxisId="left" dataKey="count" name="Allocations" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="right" dataKey="avgScore" name="Avg Score" fill="var(--accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
