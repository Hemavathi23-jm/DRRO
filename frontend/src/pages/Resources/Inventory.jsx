import { useMemo, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { inventoryApi, resourceCenterApi, resourceTypeApi } from '../../services/api';

const FILTER_DEFAULTS = { category: 'ALL', centerId: 'ALL', lowStock: false, q: '' };
const OTHER_CATS = new Set(['EQUIPMENT', 'VEHICLE', 'PERSONNEL', 'OTHER']);
const CATEGORY_OPTS = ['ALL', 'FOOD', 'WATER', 'MEDICINE', 'SHELTER', 'OTHER'];

async function fetchInventoryData() {
  const [centers, types] = await Promise.all([resourceCenterApi.list(), resourceTypeApi.list()]);
  const typeMap = Object.fromEntries(types.map((t) => [t.resourceTypeId, t]));
  const batches = await Promise.all(centers.map((c) => inventoryApi.listByCenter(c.centerId)));
  return batches.flat().map((i) => ({
    ...i,
    id: i.inventoryId,
    category: typeMap[i.resourceTypeId]?.category || 'OTHER',
  }));
}

export default function Inventory() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const { data, loading, error, refetch } = useAsyncData(fetchInventoryData, []);
  const { data: centers } = useAsyncData(() => resourceCenterApi.list(), []);

  // Restock modal state
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [submittingRestock, setSubmittingRestock] = useState(false);

  const handleOpenRestock = (item) => {
    setRestockItem(item);
    setRestockQty('50');
    setRestockNote('');
  };

  const handleCloseRestock = () => {
    setRestockItem(null);
    setRestockQty('');
    setRestockNote('');
  };

  const handleSubmitRestock = async (e) => {
    e.preventDefault();
    if (!restockItem || !restockQty || Number(restockQty) <= 0) {
      toast.error('Please enter a valid restock quantity');
      return;
    }
    setSubmittingRestock(true);
    try {
      await inventoryApi.adjust(restockItem.inventoryId, Number(restockQty));
      toast.success(`Successfully restocked +${Number(restockQty).toLocaleString()} ${restockItem.unit || 'units'} of ${restockItem.resourceTypeName}`);
      handleCloseRestock();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to restock inventory');
    } finally {
      setSubmittingRestock(false);
    }
  };

  const columns = [
    { label: 'Center', accessor: 'centerName', render: (r) => <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.centerName}</span> },
    { label: 'Resource', accessor: 'resourceTypeName' },
    {
      label: 'Available',
      accessor: 'availableQty',
      render: (r) => (
        <span style={{ color: r.belowMinStock ? 'var(--danger)' : 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {Number(r.availableQty).toLocaleString()} {r.unit || ''}
        </span>
      ),
    },
    { label: 'Reserved', accessor: 'reservedQty', render: (r) => <span style={{ color: 'var(--warning)' }}>{Number(r.reservedQty)}</span> },
    { label: 'Dispatched', accessor: 'dispatchedQty', render: (r) => Number(r.dispatchedQty) },
    { label: 'Min Stock', accessor: 'minStockLevel', render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{Number(r.minStockLevel)}</span> },
    { label: 'Expiry', accessor: 'expiryDate', render: (r) => (r.expiryDate ? <span style={{ fontSize: '0.78rem' }}>{r.expiryDate}</span> : <span className="text-muted">—</span>) },
    {
      label: 'Status',
      accessor: 'inventoryId',
      render: (r) => (r.belowMinStock
        ? <span className="badge badge-critical">LOW STOCK</span>
        : <span className="badge badge-active">OK</span>),
    },
    {
      label: 'Action',
      accessor: 'actions',
      render: (r) => (
        hasRole('RESOURCE_MANAGER', 'ADMIN') ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => handleOpenRestock(r)}
          >
            <span>+ Restock</span>
          </button>
        ) : null
      ),
    },
  ];

  const filtered = useMemo(() => {
    let rows = data || [];
    if (values.category !== 'ALL') {
      rows = rows.filter((r) => (values.category === 'OTHER'
        ? OTHER_CATS.has(r.category)
        : r.category === values.category));
    }
    if (values.centerId !== 'ALL') rows = rows.filter((r) => String(r.centerId) === values.centerId);
    if (values.lowStock) rows = rows.filter((r) => r.belowMinStock);
    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.centerName, r.resourceTypeName, r.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [data, values]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading inventory…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load inventory"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  const allRows = data || [];
  const lowStock = allRows.filter((i) => i.belowMinStock).length;
  const centerOptions = [
    { value: 'ALL', label: 'All centers' },
    ...(centers || []).map((c) => ({ value: String(c.centerId), label: c.name })),
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Inventory Management"
        subtitle={`${allRows.length} items${lowStock > 0 ? ` · ${lowStock} low stock` : ''}`}
        actions={
          hasRole('RESOURCE_MANAGER', 'ADMIN') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="button" onClick={() => navigate('/resources/inventory/add')}>
                Add new item
              </button>
            </div>
          )
        }
      />

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filtered.length}
        filters={[
          { key: 'category', label: 'Category', type: 'chips', options: CATEGORY_OPTS },
          { key: 'centerId', label: 'Center', type: 'select', options: centerOptions },
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search resource or center…' },
          { key: 'lowStock', label: 'Low stock only', type: 'toggle' },
        ]}
      />

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No inventory records match your filters." />
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseRestock(); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              margin: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Restock Resource
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCloseRestock}
                style={{ padding: '2px 8px', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 6, marginBottom: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resource & Hub</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {restockItem.resourceTypeName}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                📍 {restockItem.centerName}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current Available:</span>
                <span style={{ fontWeight: 700, color: restockItem.belowMinStock ? 'var(--danger)' : 'var(--success)' }}>
                  {Number(restockItem.availableQty).toLocaleString()} {restockItem.unit}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitRestock}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Quantity to Add *</label>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      onClick={() => setRestockQty(String(amt))}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  step="any"
                  required
                  placeholder="Enter restock amount"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
              </div>

              {Number(restockQty) > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                  New Stock After Restock: <strong style={{ color: 'var(--success)' }}>
                    {(Number(restockItem.availableQty || 0) + Number(restockQty)).toLocaleString()} {restockItem.unit}
                  </strong>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Batch Note / Source (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Red Cross donation, Supplier Batch #892"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseRestock} disabled={submittingRestock}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingRestock || !restockQty || Number(restockQty) <= 0}>
                  {submittingRestock ? 'Restocking…' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
