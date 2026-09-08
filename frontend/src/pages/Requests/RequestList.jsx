import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { requestApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const URGENCY_COLOR = { CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', MEDIUM: 'var(--info)', LOW: 'var(--text-muted)' };

const columns = [
  { label: 'ID', accessor: 'requestId', render: r => <span style={{ color: 'var(--text-muted)' }}># {r.requestId}</span> },
  { label: 'Disaster', accessor: 'disasterTitle' },
  { label: 'Location', accessor: 'locationName', render: r => <span style={{ fontWeight: 600 }}>{r.locationName}</span> },
  { label: 'Urgency', accessor: 'urgency', render: r => <span style={{ color: URGENCY_COLOR[r.urgency], fontWeight: 700, fontSize: '0.82rem' }}>{r.urgency}</span> },
  { label: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
  { label: 'Deadline', accessor: 'deadline', render: r => formatDateTime(r.deadline) },
  {
    label: 'Actions', accessor: 'requestId', render: r => (
      <Link to={`/requests/${r.requestId}`}><button className="btn btn-secondary btn-sm">View</button></Link>
    ),
  },
];

export default function RequestList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const { data, loading, error, refetch } = useAsyncData(() => requestApi.list(), []);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading requests…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load requests. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const requests = (data || []).map(r => ({ ...r, id: r.requestId }));
  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div><h2 className="page-title">Relief Requests</h2><p className="page-sub">{requests.length} total requests</p></div>
        {hasRole('OFFICER', 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => navigate('/requests/create')}>New Request</button>
        )}
      </div>

      <div className="filter-bar">
        {['ALL', 'PENDING', 'VERIFIED', 'ALLOCATED', 'PARTIALLY_FULFILLED', 'FULFILLED'].map(s => (
          <button
            key={s}
            type="button"
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No requests found." />
      </div>
    </PageWrapper>
  );
}
