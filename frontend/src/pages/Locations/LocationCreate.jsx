import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { disasterApi, locationApi } from '../../services/api';

export default function LocationCreate() {
  const navigate = useNavigate();
  const { data: disasters, loading } = useAsyncData(() => disasterApi.list(), []);
  const [form, setForm] = useState({
    disasterId: '',
    name: '',
    latitude: '',
    longitude: '',
    populationAffected: '',
    vulnerabilityScore: 50,
    severityScore: 50,
    accessibility: 'ACCESSIBLE',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await locationApi.create({
        disasterId: Number(form.disasterId),
        name: form.name,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        populationAffected: form.populationAffected ? Number(form.populationAffected) : null,
        vulnerabilityScore: Number(form.vulnerabilityScore),
        severityScore: Number(form.severityScore),
        accessibility: form.accessibility,
        notes: form.notes || null,
      });
      navigate('/locations');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading disasters…" /></PageWrapper>;

  const disasterList = disasters || [];

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Add Affected Location</h2>
          <p className="page-sub">Register a location under an active disaster</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/locations')}>← Back</button>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card">
          {disasterList.length === 0 ? (
            <div className="empty-state">
              <p>No disasters available. Create a disaster first.</p>
              <button className="btn btn-primary mt-2" onClick={() => navigate('/disasters/create')}>Create Disaster</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Disaster *</label>
                <select className="form-select" value={form.disasterId} onChange={e => set('disasterId', e.target.value)} required>
                  <option value="">Select disaster…</option>
                  {disasterList.map(d => (
                    <option key={d.disasterId} value={d.disasterId}>{d.title} ({d.status})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location Name *</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Wayanad North" required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={e => set('latitude', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={e => set('longitude', e.target.value)} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Population Affected</label>
                  <input className="form-input" type="number" min={0} value={form.populationAffected} onChange={e => set('populationAffected', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Accessibility</label>
                  <select className="form-select" value={form.accessibility} onChange={e => set('accessibility', e.target.value)}>
                    {['ACCESSIBLE', 'DIFFICULT', 'BLOCKED'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Vulnerability Score: {form.vulnerabilityScore}</label>
                  <input type="range" min={0} max={100} value={form.vulnerabilityScore} onChange={e => set('vulnerabilityScore', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Severity Score: {form.severityScore}</label>
                  <input type="range" min={0} max={100} value={form.severityScore} onChange={e => set('severityScore', e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
              </div>

              {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.875rem' }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Create Location'}</button>
                <button className="btn btn-secondary" type="button" onClick={() => navigate('/locations')}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
