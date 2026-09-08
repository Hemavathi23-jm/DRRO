import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dispatchApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export default function DispatchList() {
  const { data, loading, error, refetch } = useAsyncData(() => dispatchApi.list(), []);

  const handleStartTransit = async (id) => {
    try {
      await dispatchApi.inTransit(id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start transit');
    }
  };

  const handleQuickDeliver = async (d) => {
    const qty = prompt(`Enter delivered quantity (${d.unit || 'units'}):`, d.allocatedQty || '12');
    if (!qty) return;
    try {
      await dispatchApi.deliver(d.dispatchId, Number(qty));
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delivery confirmation failed');
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading dispatches…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load dispatches. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const dispatches = (data || []).map(d => ({ ...d, id: d.dispatchId }));
  const inTransitCount = dispatches.filter(d => d.status === 'IN_TRANSIT').length;
  const createdCount = dispatches.filter(d => d.status === 'CREATED').length;
  const deliveredCount = dispatches.filter(d => d.status === 'DELIVERED').length;

  const columns = [
    { label: '#', accessor: 'dispatchId', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.dispatchId}</span> },
    {
      label: 'Allocation Destination', accessor: 'locationName', render: r => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.locationName || 'Impact Zone'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <strong>{r.allocatedQty} {r.unit}</strong> of {r.resourceTypeName} from {r.centerName}
          </div>
        </div>
      ),
    },
    { label: 'Vehicle', accessor: 'vehicleInfo', render: r => <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent)' }}>{r.vehicleInfo || 'Relief Transport'}</span> },
    { label: 'Dispatched', accessor: 'dispatchedAt', render: r => formatDateTime(r.dispatchedAt) },
    { label: 'ETA', accessor: 'estimatedArrival', render: r => formatDateTime(r.estimatedArrival) },
    { label: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    {
      label: 'Actions', accessor: 'dispatchId', render: r => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {r.status === 'CREATED' && (
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              onClick={() => handleStartTransit(r.dispatchId)}
            >
              🚚 Start Transit
            </button>
          )}
          {(r.status === 'IN_TRANSIT' || r.status === 'CREATED') && (
            <Link
              to={`/dispatch/${r.dispatchId}/deliver`}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.78rem', padding: '4px 8px', textDecoration: 'none' }}
            >
              📱 Mobile POD
            </Link>
          )}
          {(r.status === 'IN_TRANSIT' || r.status === 'CREATED') && (
            <button
              className="btn btn-success btn-sm"
              type="button"
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              onClick={() => handleQuickDeliver(r)}
            >
              ✓ Quick Deliver
            </button>
          )}
          {r.status === 'DELIVERED' && (
            <Link
              to={`/dispatch/${r.dispatchId}/deliver`}
              style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}
            >
              ✓ Handed Over ({r.deliveredQty} {r.unit}) · View
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper>
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Dispatch & Field Delivery Operations</h2>
          <p className="page-sub">
            {createdCount} prepared · <span style={{ color: 'var(--info)' }}>{inTransitCount} in transit</span> · <span style={{ color: 'var(--success)' }}>{deliveredCount} delivered</span>
          </p>
        </div>
      </div>

      {/* Operational Hint */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', borderLeft: '4px solid var(--accent)', background: 'var(--bg-surface)' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Field Operations Workflow:</strong> Click <strong>🚚 Start Transit</strong> when response trucks depart the warehouse. Upon arrival at the disaster location, click <strong>✓ Confirm Delivery</strong> to fulfill the relief request and deduct inventory.
        </p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={dispatches} emptyMessage="No dispatches recorded yet." />
      </div>
    </PageWrapper>
  );
}
