import { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { resourceCenterApi } from '../../services/api';

const columns = [
  { label: '#', accessor: 'centerId', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.centerId}</span> },
  { label: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
  { label: 'Address', accessor: 'address' },
  { label: 'Contact', accessor: 'contact' },
  { label: 'Lat / Lon', accessor: 'latitude', render: r => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.latitude}, {r.longitude}</span> },
  { label: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
];

export default function ResourceCenters() {
  const { hasRole } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    contact: '',
    latitude: '',
    longitude: '',
    status: 'ACTIVE',
  });

  const { data, loading, error, refetch } = useAsyncData(() => resourceCenterApi.list(), []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await resourceCenterApi.create({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setForm({ name: '', address: '', contact: '', latitude: '', longitude: '', status: 'ACTIVE' });
      setShowModal(false);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create resource center.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    let rows = (data || []).map(c => ({ ...c, id: c.centerId }));
    if (statusFilter !== 'ALL') rows = rows.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(c =>
        [c.name, c.address, c.contact, c.status].some(v => String(v ?? '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [data, statusFilter, search]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading resource centers…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load resource centers. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const centers = data || [];
  const activeCount = centers.filter(c => c.status === 'ACTIVE').length;

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Resource Centers</h2>
          <p className="page-sub">{activeCount} active centers · Storage & distribution hubs</p>
        </div>
        {hasRole('ADMIN', 'RESOURCE_MANAGER') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Center</button>
        )}
      </div>

      {showModal && (
        <div className="card" style={{ maxWidth: 540, marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Create Resource Center</p>
          {submitError && (
            <div style={{ padding: '8px 12px', marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Center Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Central Relief Warehouse" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Details *</label>
                <input className="form-input" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="e.g. +91 98765 43210" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Address *</label>
              <input className="form-input" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Plot 45, Sector 12, Industrial Area" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Latitude *</label>
                <input className="form-input" type="number" step="any" required value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 13.0827" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude *</label>
                <input className="form-input" type="number" step="any" required value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. 80.2707" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Center'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search centers…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={filtered} emptyMessage="No resource centers found." />
      </div>
    </PageWrapper>
  );
}
