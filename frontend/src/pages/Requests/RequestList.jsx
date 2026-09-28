import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { requestApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const URGENCY_COLOR = {
  CRITICAL: 'var(--danger)',
  HIGH: 'var(--warning)',
  MEDIUM: 'var(--info)',
  LOW: 'var(--text-muted)',
};

const FILTER_DEFAULTS = { status: 'ALL', urgency: 'ALL', q: '' };

const STATUS_OPTS = ['ALL', 'PENDING', 'VERIFIED', 'ALLOCATED', 'PARTIALLY_FULFILLED', 'FULFILLED'];
const URGENCY_OPTS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const columns = [
  { label: 'ID', accessor: 'requestId', render: (r) => <span style={{ color: 'var(--text-muted)' }}># {r.requestId}</span> },
  { label: 'Disaster', accessor: 'disasterTitle' },
  { label: 'Location', accessor: 'locationName', render: (r) => <span style={{ fontWeight: 600 }}>{r.locationName}</span> },
  {
    label: 'Urgency',
    accessor: 'urgency',
    render: (r) => (
      <span style={{ color: URGENCY_COLOR[r.urgency], fontWeight: 700, fontSize: '0.82rem' }}>{r.urgency}</span>
    ),
  },
  { label: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status} /> },
  { label: 'Deadline', accessor: 'deadline', render: (r) => formatDateTime(r.deadline) },
  {
    label: 'Actions',
    accessor: 'requestId',
    render: (r) => (
      <Link to={`/requests/${r.requestId}`}>
        <button className="btn btn-secondary btn-sm" type="button">View</button>
      </Link>
    ),
  },
];

export default function RequestList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const { data, loading, error, refetch } = useAsyncData(() => requestApi.list(), []);

  const requests = useMemo(() => (data || []).map((r) => ({ ...r, id: r.requestId })), [data]);

  const filtered = useMemo(() => {
    let rows = requests;
    if (values.status !== 'ALL') rows = rows.filter((r) => r.status === values.status);
    if (values.urgency !== 'ALL') rows = rows.filter((r) => r.urgency === values.urgency);
    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.disasterTitle, r.locationName, r.urgency, r.status, String(r.requestId)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [requests, values]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading requests…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load requests"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Relief requests"
        subtitle={`${requests.length} total · ${filtered.length} shown`}
        actions={
          hasRole('OFFICER', 'ADMIN') && (
            <button className="btn btn-primary" type="button" onClick={() => navigate('/requests/create')}>
              New request
            </button>
          )
        }
      />

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filtered.length}
        filters={[
          { key: 'urgency', label: 'Urgency', type: 'chips', options: URGENCY_OPTS },
          { key: 'status', label: 'Status', type: 'chips', options: STATUS_OPTS },
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search disaster, location, ID…' },
        ]}
      />

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No requests match these filters." />
      </div>
    </PageWrapper>
  );
}
