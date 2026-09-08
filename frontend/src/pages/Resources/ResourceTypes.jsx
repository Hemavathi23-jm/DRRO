// src/pages/Resources/ResourceTypes.jsx
import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { resourceTypeApi } from '../../services/api';

const CAT_COLORS = {
  FOOD: '#f59e0b',
  WATER: '#3b82f6',
  MEDICINE: '#22c55e',
  EQUIPMENT: '#8b5cf6',
  VEHICLE: '#f97316',
  SHELTER: '#06b6d4',
  PERSONNEL: '#ec4899',
  OTHER: '#6b7280',
};

const columns = [
  { label: '#', accessor: 'typeId', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.typeId}</span> },
  { label: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
  { label: 'Category', accessor: 'category', render: r => <span style={{ color: CAT_COLORS[r.category] || '#aaa', fontWeight: 600, fontSize: '0.78rem' }}>{r.category}</span> },
  { label: 'Unit', accessor: 'unit' },
  { label: 'Perishable', accessor: 'perishable', render: r => r.perishable ? <span className="badge badge-critical">YES</span> : <span className="badge badge-low">NO</span> },
];

export default function ResourceTypes() {
  const { hasRole } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(() => resourceTypeApi.list(), []);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'FOOD', unit: '', perishable: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await resourceTypeApi.create(form);
      setForm({ name: '', category: 'FOOD', unit: '', perishable: false });
      setShow(false);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create resource type.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading resource types…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load resource types. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const types = (data || []).map(t => ({ ...t, id: t.typeId }));

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Resource Types</h2>
          <p className="page-sub">{types.length} types in catalog</p>
        </div>
        {hasRole('ADMIN', 'RESOURCE_MANAGER') && (
          <button className="btn btn-primary" onClick={() => setShow(true)}>Add Type</button>
        )}
      </div>

      {show && (
        <div className="card" style={{ maxWidth: 520, marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>New Resource Type</p>
          {submitError && (
            <div style={{ padding: '8px 12px', marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Blankets, Rice bags" />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Unit of Measure *</label>
                <input className="form-input" required value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. kg, liters, units, boxes" />
              </div>
              <div className="form-group" style={{ justifyContent: 'center' }}>
                <label className="form-label">Perishable?</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="perishableCheckbox"
                    checked={form.perishable}
                    onChange={e => setForm(f => ({ ...f, perishable: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="perishableCheckbox" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Item degrades over time</label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShow(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={types} emptyMessage="No resource types registered." />
      </div>
    </PageWrapper>
  );
}
