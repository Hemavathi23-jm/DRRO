import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RequestFulfillmentChart({ metrics }) {
  const m = metrics || {};
  const chartData = [
    { name: 'Open', value: m.openRequests ?? 0 },
    { name: 'Pending Approval', value: m.pendingApprovals ?? 0 },
    { name: 'Approved', value: m.approvedAllocations ?? 0 },
    { name: 'Delivered', value: m.deliveredAllocations ?? 0 },
  ];

  return (
    <div className="card" style={{ height: 280 }}>
      <p className="card-title">Response Pipeline</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
          <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }} />
          <Bar dataKey="value" fill="var(--accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
