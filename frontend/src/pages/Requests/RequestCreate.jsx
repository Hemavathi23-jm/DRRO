import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { disasterApi, locationApi, resourceTypeApi, requestApi } from '../../services/api';

function shortLabel(text, max = 56) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function RequestCreate() {
  const navigate = useNavigate();
  const { data: disasters, loading: dLoading } = useAsyncData(() => disasterApi.list(), []);
  const { data: resourceTypes, loading: rLoading } = useAsyncData(() => resourceTypeApi.list(), []);
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [form, setForm] = useState({ disasterId: '', locationId: '', urgency: 'HIGH', deadline: '', notes: '' });
  const [items, setItems] = useState([{ resourceTypeId: '', requiredQty: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.disasterId) {
      setLocations([]);
      setForm(f => ({ ...f, locationId: '' }));
      return;
    }
    setLocLoading(true);
    setForm(f => ({ ...f, locationId: '' }));
    locationApi.list(form.disasterId)
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLocLoading(false));
  }, [form.disasterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = () => setItems(i => [...i, { resourceTypeId: '', requiredQty: '' }]);
  const setItem = (idx, k, v) => setItems(i => i.map((it, i2) => i2 === idx ? { ...it, [k]: v } : it));
  const removeItem = idx => setItems(i => i.filter((_, i2) => i2 !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ locationId: true, disasterId: true });
    if (!form.disasterId || !form.locationId) {
      setError('Please select a disaster and an affected location.');
      return;
    }
    if (items.some(it => !it.resourceTypeId || !it.requiredQty)) {
      setError('Please complete all request items.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestApi.create({
        disasterId: Number(form.disasterId),
        locationId: Number(form.locationId),
        urgency: form.urgency,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        notes: form.notes || null,
        items: items.map(it => ({
          resourceTypeId: Number(it.resourceTypeId),
          requiredQty: Number(it.requiredQty),
        })),
      });
      navigate('/requests');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (dLoading || rLoading) return <PageWrapper><LoadingSpinner message="Loading form data…" /></PageWrapper>;

  const disasterList = disasters || [];
  const types = resourceTypes || [];
  const locationInvalid = touched.locationId && !form.locationId;

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Create Relief Request</h2>
          <p className="page-sub">Submit a new relief request for a disaster location</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/requests')}>← Back</button>
      </div>

      <div className="form-card">
        <div className="card">
          {disasterList.length === 0 ? (
            <div className="empty-state"><p>No disasters available. Create a disaster first.</p></div>
          ) : types.length === 0 ? (
            <div className="empty-state"><p>No resource types configured. Add resource types first.</p></div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="req-disaster">Disaster *</label>
                  <select
                    id="req-disaster"
                    className="form-select"
                    value={form.disasterId}
                    onChange={e => set('disasterId', e.target.value)}
                    required
                    title={disasterList.find(d => String(d.disasterId) === String(form.disasterId))?.title || ''}
                  >
                    <option value="">Select disaster…</option>
                    {disasterList.map(d => (
                      <option key={d.disasterId} value={d.disasterId} title={d.title}>
                        {shortLabel(d.title)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="req-location">Affected Location *</label>
                  <select
                    id="req-location"
                    className={`form-select${locationInvalid ? ' is-invalid' : ''}`}
                    value={form.locationId}
                    onChange={e => { set('locationId', e.target.value); setTouched(t => ({ ...t, locationId: true })); }}
                    onBlur={() => setTouched(t => ({ ...t, locationId: true }))}
                    required
                    disabled={!form.disasterId || locLoading}
                  >
                    <option value="">
                      {!form.disasterId
                        ? 'Select a disaster first…'
                        : locLoading
                          ? 'Loading locations…'
                          : locations.length === 0
                            ? 'No locations for this disaster'
                            : 'Select location…'}
                    </option>
                    {locations.map(l => (
                      <option key={l.locationId} value={l.locationId}>{l.name}</option>
                    ))}
                  </select>
                  {form.disasterId && !locLoading && locations.length === 0 && (
                    <p className="form-hint">
                      No locations yet.{' '}
                      <button
                        type="button"
                        className="text-accent"
                        style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => navigate('/locations/create')}
                      >
                        Add a location
                      </button>
                    </p>
                  )}
                  {locationInvalid && locations.length > 0 && (
                    <p className="form-error">Please select an affected location.</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="req-urgency">Urgency *</label>
                  <select
                    id="req-urgency"
                    className="form-select"
                    value={form.urgency}
                    onChange={e => set('urgency', e.target.value)}
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="req-deadline">Deadline</label>
                  <input
                    id="req-deadline"
                    className="form-input"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => set('deadline', e.target.value)}
                  />
                </div>
              </div>

              <hr className="divider" />
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <p className="section-title">Request Items</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>Add Item</button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="form-row-items">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Resource Type</label>
                    <select
                      className="form-select"
                      value={item.resourceTypeId}
                      onChange={e => setItem(idx, 'resourceTypeId', e.target.value)}
                      required
                    >
                      <option value="">Select…</option>
                      {types.map(t => (
                        <option key={t.resourceTypeId} value={t.resourceTypeId}>
                          {t.name} ({t.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Quantity</label>
                    <input
                      className="form-input"
                      type="number"
                      min={0.01}
                      step="any"
                      value={item.requiredQty}
                      onChange={e => setItem(idx, 'requiredQty', e.target.value)}
                      required
                    />
                  </div>
                  {items.length > 1 ? (
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => removeItem(idx)}>
                      Remove
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}

              <hr className="divider" />
              <div className="form-group">
                <label className="form-label" htmlFor="req-notes">Notes</label>
                <textarea
                  id="req-notes"
                  className="form-textarea"
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {error && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => navigate('/requests')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
