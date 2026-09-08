import { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { inventoryApi, resourceCenterApi, resourceTypeApi } from '../../services/api';

const CATEGORIES = ['ALL', 'FOOD', 'WATER', 'MEDICINE', 'SHELTER', 'OTHER'];
const OTHER_CATS = new Set(['EQUIPMENT', 'VEHICLE', 'PERSONNEL', 'OTHER']);

async function fetchInventoryData() {
  const [centers, types] = await Promise.all([resourceCenterApi.list(), resourceTypeApi.list()]);
  const typeMap = Object.fromEntries(types.map(t => [t.resourceTypeId, t]));
  const batches = await Promise.all(centers.map(c => inventoryApi.listByCenter(c.centerId)));
  return batches.flat().map(i => ({
    ...i,
    id: i.inventoryId,
    category: typeMap[i.resourceTypeId]?.category || 'OTHER',
  }));
}

const columns = [
  { label: 'Center', accessor: 'centerName', render: r => <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.centerName}</span> },
  { label: 'Resource', accessor: 'resourceTypeName' },
  { label: 'Available', accessor: 'availableQty', render: r => <span style={{ color: r.belowMinStock ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{Number(r.availableQty).toLocaleString()}</span> },
  { label: 'Reserved', accessor: 'reservedQty', render: r => <span style={{ color: 'var(--warning)' }}>{Number(r.reservedQty)}</span> },
  { label: 'Dispatched', accessor: 'dispatchedQty', render: r => Number(r.dispatchedQty) },
  { label: 'Min Stock', accessor: 'minStockLevel', render: r => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{Number(r.minStockLevel)}</span> },
  { label: 'Expiry', accessor: 'expiryDate', render: r => r.expiryDate ? <span style={{ fontSize: '0.78rem' }}>{r.expiryDate}</span> : <span className="text-muted">—</span> },
  {
    label: 'Status', accessor: 'inventoryId', render: r => r.belowMinStock
      ? <span className="badge badge-critical">LOW STOCK</span>
      : <span className="badge badge-active">OK</span>,
  },
];

export default function Inventory() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('ALL');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(fetchInventoryData, []);
  const { data: centers } = useAsyncData(() => resourceCenterApi.list(), []);

  const filtered = useMemo(() => {
    let rows = data || [];
    if (category !== 'ALL') {
      rows = rows.filter(r => category === 'OTHER'
        ? OTHER_CATS.has(r.category)
        : r.category === category);
    }
    if (centerFilter !== 'ALL') rows = rows.filter(r => String(r.centerId) === centerFilter);
    if (lowStockOnly) rows = rows.filter(r => r.belowMinStock);
    return rows;
  }, [data, category, centerFilter, lowStockOnly]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading inventory…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load inventory. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const allRows = data || [];
  const lowStock = allRows.filter(i => i.belowMinStock).length;

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-sub">{allRows.length} items{lowStock > 0 && <> · <span className="text-danger">{lowStock} low stock alert{lowStock > 1 ? 's' : ''}</span></>}</p>
        </div>
        {hasRole('RESOURCE_MANAGER', 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => navigate('/resources/inventory/add')}>Add Stock</button>
        )}
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            type="button"
            className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCategory(c)}
          >
            {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" style={{ width: 220 }} value={centerFilter} onChange={e => setCenterFilter(e.target.value)}>
          <option value="ALL">All centers</option>
          {(centers || []).map(c => <option key={c.centerId} value={c.centerId}>{c.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No inventory records match your filters." />
      </div>
    </PageWrapper>
  );
}
