import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import { disasterApi } from '../../services/api';

export default function DisasterCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', type: 'FLOOD', severity: 50, description: '', latitude: '', longitude: '', startTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        severity: Number(form.severity),
        description: form.description || null,
        startTime: new Date(form.startTime).toISOString(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      const created = await disasterApi.create(payload);
      navigate(`/disasters/${created.disasterId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create disaster');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex-between">
        <div>
          <h2 className="page-title">Create Disaster</h2>
          <p className="page-sub">Register a new disaster incident</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/disasters')}>← Back</button>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Kerala Floods 2026" required />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {['FLOOD', 'EARTHQUAKE', 'CYCLONE', 'LANDSLIDE', 'WILDFIRE', 'OTHER'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Severity (1–100): <strong style={{ color: 'var(--accent)' }}>{form.severity}</strong></label>
              <input type="range" min={1} max={100} value={form.severity} onChange={e => set('severity', e.target.value)}
                style={{ accentColor: 'var(--accent)', width: '100%' }} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="10.8505" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="76.2711" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input className="form-input" type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the disaster situation…" style={{ resize: 'vertical' }} />
            </div>

            {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '0.875rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Disaster'}</button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/disasters')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
