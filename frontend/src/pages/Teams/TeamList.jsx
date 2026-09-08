import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const columns = [
  { label: '#', accessor: 'teamId', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.teamId}</span> },
  { label: 'Team', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
  { label: 'Skills', accessor: 'skills', render: r => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.skills || '—'}</span> },
  { label: 'Availability', accessor: 'availability', render: r => <StatusBadge status={r.availability} /> },
  { label: 'Contact', accessor: 'contact' },
  {
    label: 'Last Known Location', accessor: 'latitude', render: r => (
      <div>
        {r.latitude != null ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Last known location</div>
      </div>
    ),
  },
];

export default function TeamList() {
  const { hasRole } = useAuth();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: '',
    skills: '',
    contact: '',
    latitude: '',
    longitude: '',
    availability: 'AVAILABLE',
  });

  const { data, loading, error, refetch } = useAsyncData(() => teamApi.list(), []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await teamApi.create({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setForm({ name: '', skills: '', contact: '', latitude: '', longitude: '', availability: 'AVAILABLE' });
      setShow(false);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading teams…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load teams. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const teams = (data || []).map(t => ({ ...t, id: t.teamId }));
  const available = teams.filter(t => t.availability === 'AVAILABLE').length;

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Response Teams</h2>
          <p className="page-sub">{teams.length} teams · <span style={{ color: 'var(--success)' }}>{available} available</span></p>
        </div>
        {hasRole('COORDINATOR', 'ADMIN') && (
          <button className="btn btn-primary" onClick={() => setShow(s => !s)}>Add Team</button>
        )}
      </div>

      {show && (
        <div className="card" style={{ maxWidth: 540, marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Register Response Team</p>
          {submitError && (
            <div style={{ padding: '8px 12px', marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quick Response Unit 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number *</label>
                <input className="form-input" required value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="e.g. +91 98765 12345" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Specialization Skills *</label>
              <input className="form-input" required value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. Medical triage, Water rescue, Evacuation" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Current Latitude</label>
                <input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 13.0827 (optional)" />
              </div>
              <div className="form-group">
                <label className="form-label">Current Longitude</label>
                <input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="e.g. 80.2707 (optional)" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register Team'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShow(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={teams} emptyMessage="No response teams registered." />
      </div>
    </PageWrapper>
  );
}
