// src/pages/Reports/AlgorithmComparison.jsx
import PageWrapper from '../../components/layout/PageWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COMPARISON_DATA = [
  { metric: 'Avg Response Time (hrs)', GreedyDRRO: 2.1, FCFS: 4.8, SeverityOnly: 3.6, NearestSource: 2.9 },
  { metric: 'Fulfillment Rate (%)', GreedyDRRO: 92.4, FCFS: 68.2, SeverityOnly: 74.5, NearestSource: 81.0 },
  { metric: 'Fairness Score (0-100)', GreedyDRRO: 88.5, FCFS: 52.0, SeverityOnly: 64.0, NearestSource: 71.2 },
  { metric: 'Avg Distance (km)', GreedyDRRO: 34.2, FCFS: 62.4, SeverityOnly: 48.7, NearestSource: 28.5 },
];

const METRICS_TABLE = [
  { algorithm: 'DRRO (Multi-Factor Greedy)', fulfillment: '92.4%', responseTime: '2.1 hrs', distance: '34.2 km', fairness: '88.5/100', status: 'RECOMMENDED' },
  { algorithm: 'FCFS (First-Come First-Served)', fulfillment: '68.2%', responseTime: '4.8 hrs', distance: '62.4 km', fairness: '52.0/100', status: 'BASELINE' },
  { algorithm: 'Severity-Only Allocator', fulfillment: '74.5%', responseTime: '3.6 hrs', distance: '48.7 km', fairness: '64.0/100', status: 'BASELINE' },
  { algorithm: 'Nearest-Source Allocator', fulfillment: '81.0%', responseTime: '2.9 hrs', distance: '28.5 km', fairness: '71.2/100', status: 'BASELINE' },
];

export default function AlgorithmComparison() {
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Algorithm Performance Comparison</h2>
          <p className="page-sub">Benchmarking DRRO multi-factor optimization against standard baseline algorithms</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>← Back to Reports</button>
      </div>

      {/* Comparison Chart */}
      <div className="card" style={{ height: 360, marginBottom: 20 }}>
        <p className="card-title">Fulfillment & Performance Benchmark</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={COMPARISON_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
            <Legend iconType="circle" formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
            <Bar dataKey="GreedyDRRO" fill="#f59e0b" name="DRRO Multi-Factor" radius={[4, 4, 0, 0]} />
            <Bar dataKey="NearestSource" fill="#3b82f6" name="Nearest Source" radius={[4, 4, 0, 0]} />
            <Bar dataKey="SeverityOnly" fill="#8b5cf6" name="Severity Only" radius={[4, 4, 0, 0]} />
            <Bar dataKey="FCFS" fill="#64748b" name="FCFS" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Evaluation Metrics Breakdown</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Fulfillment Rate</th>
                <th>Avg Response Time</th>
                <th>Avg Travel Distance</th>
                <th>Fairness Index</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {METRICS_TABLE.map(row => (
                <tr key={row.algorithm} style={row.status === 'RECOMMENDED' ? { background: 'var(--accent-glow)' } : {}}>
                  <td style={{ fontWeight: 600, color: row.status === 'RECOMMENDED' ? 'var(--accent)' : 'inherit' }}>
                    {row.algorithm}
                  </td>
                  <td><span style={{ fontWeight: 700, color: 'var(--success)' }}>{row.fulfillment}</span></td>
                  <td>{row.responseTime}</td>
                  <td>{row.distance}</td>
                  <td>{row.fairness}</td>
                  <td>
                    <span className={`badge ${row.status === 'RECOMMENDED' ? 'badge-recommended' : 'badge-low'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
