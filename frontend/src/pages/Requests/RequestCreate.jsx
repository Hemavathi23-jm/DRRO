import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { disasterApi, locationApi, resourceTypeApi, resourceCenterApi, inventoryApi, requestApi } from '../../services/api';

function shortLabel(text, max = 56) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function RequestCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramDisasterId = searchParams.get('disasterId') || '';
  const paramLocationId = searchParams.get('locationId') || '';

  const { data: disasters, loading: dLoading } = useAsyncData(() => disasterApi.list(), []);
  const { data: resourceTypes, loading: rLoading } = useAsyncData(() => resourceTypeApi.list(), []);
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [form, setForm] = useState({
    disasterId: paramDisasterId,
    locationId: paramLocationId,
    urgency: 'HIGH',
    deadline: '',
    notes: '',
  });
  const [items, setItems] = useState([{ resourceTypeId: '', requiredQty: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});

  // Stock inventory map: resourceTypeId -> total available stock
  const [stockMap, setStockMap] = useState({});
  const [showStockWarningModal, setShowStockWarningModal] = useState(false);

  useEffect(() => {
    async function loadStock() {
      try {
        const centers = await resourceCenterApi.list();
        const batches = await Promise.all(centers.map((c) => inventoryApi.listByCenter(c.centerId).catch(() => [])));
        const map = {};
        batches.flat().forEach((inv) => {
          if (!inv) return;
          const tid = inv.resourceTypeId;
          map[tid] = (map[tid] || 0) + Number(inv.availableQty || 0);
        });
        setStockMap(map);
      } catch (err) {
        console.warn('Could not load inventory stock levels', err);
      }
    }
    loadStock();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.disasterId) {
      setLocations([]);
      return;
    }
    setLocLoading(true);
    locationApi.list(form.disasterId)
      .then((locs) => {
        setLocations(locs || []);
        if (paramLocationId && (locs || []).some(l => String(l.locationId) === String(paramLocationId))) {
          setForm(f => ({ ...f, locationId: paramLocationId }));
        }
      })
      .catch(() => setLocations([]))
      .finally(() => setLocLoading(false));
  }, [form.disasterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = () => setItems(i => [...i, { resourceTypeId: '', requiredQty: '' }]);
  const setItem = (idx, k, v) => setItems(i => i.map((it, i2) => i2 === idx ? { ...it, [k]: v } : it));
  const removeItem = idx => setItems(i => i.filter((_, i2) => i2 !== idx));

  // Find all items that exceed available stock
  const shortfallItems = useMemo(() => {
    return items
      .map((it) => {
        if (!it.resourceTypeId || !it.requiredQty) return null;
        const typeInfo = (resourceTypes || []).find((t) => String(t.resourceTypeId) === String(it.resourceTypeId));
        const available = stockMap[it.resourceTypeId] || 0;
        const requested = Number(it.requiredQty) || 0;
        if (requested > available) {
          return {
            name: typeInfo?.name || 'Resource',
            unit: typeInfo?.unit || 'units',
            requested,
            available,
            shortfall: requested - available,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [items, stockMap, resourceTypes]);

  const executeSubmit = async () => {
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
      setShowStockWarningModal(false);
    }
  };

  const handleSubmit = (e) => {
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
    setError(null);

    // If there is a shortfall, pop up the warning modal first
    if (shortfallItems.length > 0) {
      setShowStockWarningModal(true);
    } else {
      executeSubmit();
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
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
              </div>

              {items.map((item, idx) => {
                const avail = stockMap[item.resourceTypeId] != null ? stockMap[item.resourceTypeId] : null;
                const reqQty = Number(item.requiredQty) || 0;
                const isOverStock = item.resourceTypeId && avail !== null && reqQty > avail;

                return (
                  <div key={idx} style={{ marginBottom: 14, padding: '12px', background: 'var(--bg-card)', borderRadius: 6, border: isOverStock ? '1px solid var(--warning)' : '1px solid var(--border)' }}>
                    <div className="form-row-items" style={{ alignItems: 'flex-start' }}>
                      <div className="form-group" style={{ margin: 0, flex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label className="form-label" style={{ margin: 0 }}>Resource Type</label>
                          {item.resourceTypeId && avail !== null && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: avail > 0 ? 'var(--success)' : 'var(--danger)' }}>
                              Accessible Stock: {avail.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <select
                          className="form-select"
                          value={item.resourceTypeId}
                          onChange={e => setItem(idx, 'resourceTypeId', e.target.value)}
                          required
                        >
                          <option value="">Select resource…</option>
                          {types.map(t => {
                            const st = stockMap[t.resourceTypeId] || 0;
                            return (
                              <option key={t.resourceTypeId} value={t.resourceTypeId}>
                                {t.name} ({t.unit}) — {st.toLocaleString()} in stock
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label">Required Quantity</label>
                        <input
                          className="form-input"
                          type="number"
                          min={0.01}
                          step="any"
                          placeholder="e.g. 50"
                          value={item.requiredQty}
                          onChange={e => setItem(idx, 'requiredQty', e.target.value)}
                          required
                        />
                      </div>
                      {items.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ marginTop: 22 }}
                          onClick={() => removeItem(idx)}
                        >
                          ✕
                        </button>
                      ) : (
                        <span style={{ width: 32 }} />
                      )}
                    </div>

                    {isOverStock && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(245, 158, 11, 0.12)', borderLeft: '3px solid var(--warning)', borderRadius: 4, fontSize: '0.78rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⚠️</span>
                        <span>
                          <strong>Low/Insufficient Stock:</strong> You requested <strong>{reqQty}</strong> units, but only <strong>{avail}</strong> units are accessible in stock (Shortfall: {reqQty - avail} units).
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              <hr className="divider" />
              <div className="form-group">
                <label className="form-label" htmlFor="req-notes">Notes / Special Instructions</label>
                <textarea
                  id="req-notes"
                  className="form-textarea"
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  style={{ resize: 'vertical' }}
                  placeholder="Provide any additional emergency context or delivery notes..."
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

      {/* Stock Shortfall Warning Popup Modal */}
      {showStockWarningModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowStockWarningModal(false); }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              margin: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--warning)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--warning)' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Stock Shortfall Warning
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              The requested quantities exceed currently available stock in warehouses. DRRO allocation will fulfill what is accessible and queue the remaining for urgent restocking.
            </p>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
              {shortfallItems.map((sf, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < shortfallItems.length - 1 ? '1px dashed var(--border)' : 'none', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{sf.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Requested {sf.requested}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Available {sf.available} {sf.unit}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Shortfall: {sf.shortfall} {sf.unit}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowStockWarningModal(false)}
                disabled={submitting}
              >
                Adjust Quantities
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000', fontWeight: 700 }}
                onClick={executeSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Proceed with Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
