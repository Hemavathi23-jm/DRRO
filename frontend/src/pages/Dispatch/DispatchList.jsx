import { useMemo, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import { Link } from 'react-router-dom';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { dispatchApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const FILTER_DEFAULTS = { status: 'ALL', q: '' };
const STATUS_OPTS = ['ALL', 'CREATED', 'IN_TRANSIT', 'DELIVERED', 'ARCHIVED', 'FAILED'];

function getArchiveStatus(dispatch) {
  if (dispatch.status !== 'DELIVERED') return { isArchived: false, daysLeft: null, elapsedDays: 0 };
  const deliveryTime = new Date(dispatch.actualArrival || dispatch.dispatchedAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedDays = Math.floor((now - deliveryTime) / (1000 * 60 * 60 * 24));
  const isArchived = elapsedDays >= 30; // 1 month threshold
  const daysLeft = Math.max(0, 30 - elapsedDays);
  return { isArchived, daysLeft, elapsedDays };
}

export default function DispatchList() {
  const toast = useToast();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const { data, loading, error, refetch } = useAsyncData(() => dispatchApi.list(), []);
  const [viewTab, setViewTab] = useState('ACTIVE'); // 'ACTIVE' | 'ARCHIVE' | 'ALL'
  const [deliverTarget, setDeliverTarget] = useState(null);
  const [deliverQty, setDeliverQty] = useState('');

  const handleStartTransit = async (id) => {
    try {
      await dispatchApi.inTransit(id);
      toast.success('Dispatch marked in transit.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start transit');
    }
  };

  const openQuickDeliver = (d) => {
    setDeliverTarget(d);
    setDeliverQty(String(d.allocatedQty || ''));
  };

  const confirmQuickDeliver = async () => {
    if (!deliverTarget) return;
    const qty = Number(deliverQty);
    if (!qty || qty <= 0) {
      toast.error('Enter a valid delivered quantity.');
      return;
    }
    try {
      await dispatchApi.deliver(deliverTarget.dispatchId, qty);
      toast.success('Delivery confirmed! Item will remain active for 30 days before moving to archive.');
      setDeliverTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Delivery confirmation failed');
    }
  };

  const dispatches = useMemo(() => {
    return (data || []).map((d) => {
      const { isArchived, daysLeft, elapsedDays } = getArchiveStatus(d);
      return {
        ...d,
        id: d.dispatchId,
        isArchived,
        daysLeft,
        elapsedDays,
      };
    });
  }, [data]);

  const activeDispatches = useMemo(() => dispatches.filter((d) => !d.isArchived), [dispatches]);
  const archivedDispatches = useMemo(() => dispatches.filter((d) => d.isArchived), [dispatches]);

  const filtered = useMemo(() => {
    let rows = dispatches;
    if (viewTab === 'ACTIVE') {
      rows = activeDispatches;
    } else if (viewTab === 'ARCHIVE') {
      rows = archivedDispatches;
    }

    if (values.status === 'ARCHIVED') {
      rows = rows.filter((d) => d.isArchived);
    } else if (values.status !== 'ALL') {
      rows = rows.filter((d) => d.status === values.status && !d.isArchived);
    }

    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter((d) =>
        [d.locationName, d.resourceTypeName, d.centerName, d.vehicleInfo, d.status, String(d.dispatchId)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [dispatches, activeDispatches, archivedDispatches, viewTab, values]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading dispatches…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load dispatches"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  const inTransitCount = dispatches.filter((d) => d.status === 'IN_TRANSIT').length;
  const createdCount = dispatches.filter((d) => d.status === 'CREATED').length;
  const activeDeliveredCount = dispatches.filter((d) => d.status === 'DELIVERED' && !d.isArchived).length;
  const archivedCount = archivedDispatches.length;

  const columns = [
    { label: '#', accessor: 'dispatchId', render: (r) => <span className="text-muted">#{r.dispatchId}</span> },
    {
      label: 'Destination',
      accessor: 'locationName',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.locationName || 'Impact Zone'}</div>
          <div className="text-secondary" style={{ fontSize: '0.78rem' }}>
            <strong>{r.allocatedQty} {r.unit}</strong> of {r.resourceTypeName} from {r.centerName}
          </div>
        </div>
      ),
    },
    {
      label: 'Vehicle / Team',
      accessor: 'vehicleInfo',
      render: (r) => (
        <span className="text-accent" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          {r.vehicleInfo || 'Relief Transport'}
        </span>
      ),
    },
    { label: 'Dispatched', accessor: 'dispatchedAt', render: (r) => formatDateTime(r.dispatchedAt) },
    { label: 'Arrival / Delivery', accessor: 'actualArrival', render: (r) => (r.actualArrival ? formatDateTime(r.actualArrival) : r.estimatedArrival ? formatDateTime(r.estimatedArrival) : '—') },
    {
      label: 'Status & Retention',
      accessor: 'status',
      render: (r) => {
        if (r.isArchived) {
          return (
            <div>
              <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-muted)' }}>
                📁 ARCHIVED
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Delivered &gt; 30d ago
              </div>
            </div>
          );
        }
        if (r.status === 'DELIVERED') {
          return (
            <div>
              <StatusBadge status="DELIVERED" />
              <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 2, fontWeight: 600 }}>
                Active ({r.daysLeft}d left in 1mo window)
              </div>
            </div>
          );
        }
        return <StatusBadge status={r.status} />;
      },
    },
    {
      label: 'Actions',
      accessor: 'dispatchId',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {r.status === 'CREATED' && (
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleStartTransit(r.dispatchId)}>
              Start transit
            </button>
          )}
          {(r.status === 'IN_TRANSIT' || r.status === 'CREATED') && (
            <Link
              to={`/dispatch/${r.dispatchId}/deliver`}
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              Field POD
            </Link>
          )}
          {(r.status === 'IN_TRANSIT' || r.status === 'CREATED') && (
            <button className="btn btn-success btn-sm" type="button" onClick={() => openQuickDeliver(r)}>
              Quick deliver
            </button>
          )}
          {r.status === 'DELIVERED' && (
            <Link
              to={`/dispatch/${r.dispatchId}/deliver`}
              className="text-success"
              style={{ fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>POD Receipt ({r.deliveredQty} {r.unit})</span>
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Dispatch & Delivery Logistics"
        subtitle={`${createdCount} prepared · ${inTransitCount} in transit · ${activeDeliveredCount} active delivered (30d) · ${archivedCount} archived`}
        actions={
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, padding: '6px 12px' }}
              onClick={() => setViewTab('ACTIVE')}
            >
              🚚 Active Operations ({activeDispatches.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewTab === 'ARCHIVE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, padding: '6px 12px' }}
              onClick={() => setViewTab('ARCHIVE')}
            >
              📁 Archive (&gt; 1 Month) ({archivedCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, padding: '6px 12px' }}
              onClick={() => setViewTab('ALL')}
            >
              All Records
            </button>
          </div>
        }
      />

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filtered.length}
        filters={[
          { key: 'status', label: 'Status', type: 'chips', options: STATUS_OPTS },
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search destination, resource, vehicle…' },
        ]}
      />

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px', borderLeft: '4px solid var(--accent)' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Retention Policy:</strong> Delivered resources remain active in operational views for <strong>1 month (30 days)</strong> from delivery. After 30 days, they automatically move to the historical archive.
        </p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage={viewTab === 'ARCHIVE' ? 'No records in the 1-month archive yet.' : 'No dispatches match these filters.'} />
      </div>

      {deliverTarget && (
        <div className="modal-overlay" onClick={() => setDeliverTarget(null)} role="presentation">
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="deliver-title">
            <p className="modal-title" id="deliver-title">Confirm Delivery</p>
            <p className="modal-body">
              Enter quantity delivered for <strong>{deliverTarget.resourceTypeName}</strong> at{' '}
              <strong>{deliverTarget.locationName}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="deliver-qty">
                Delivered qty ({deliverTarget.unit || 'units'})
              </label>
              <input
                id="deliver-qty"
                className="form-input"
                type="number"
                min="1"
                step="any"
                value={deliverQty}
                onChange={(e) => setDeliverQty(e.target.value)}
                autoFocus
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
              ℹ️ Once confirmed, this delivery will remain active for 1 month and then transition to the archive.
            </p>
            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setDeliverTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-success" type="button" onClick={confirmQuickDeliver}>
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
