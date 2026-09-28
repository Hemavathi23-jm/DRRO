import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dispatchApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import Icon from '../../components/common/Icon';

export default function DeliveryUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: dispatch, loading, error, refetch } = useAsyncData(() => dispatchApi.get(id), [id]);

  const [deliveredQty, setDeliveredQty] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [done, setDone] = useState(false);

  // Digital Signature Canvas Refs & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Auto-populate quantity from allocation when dispatch loads
  useEffect(() => {
    if (dispatch?.allocatedQty != null) {
      setDeliveredQty(String(dispatch.allocatedQty));
    }
  }, [dispatch]);

  // Set up canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [dispatch]);

  // Canvas drawing handlers (supports both touch for phones and mouse for desktops)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Photo attachment handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Start Transit action
  const handleStartTransit = async () => {
    setTransitLoading(true);
    setSubmitError(null);
    try {
      await dispatchApi.inTransit(id);
      refetch();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to start transit');
    } finally {
      setTransitLoading(false);
    }
  };

  // Confirm Delivery action
  const handleSubmitDelivery = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await dispatchApi.deliver(id, Number(deliveredQty));
      setDone(true);
      setTimeout(() => navigate('/dispatch'), 1500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading dispatch order…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <div className="empty-state">
          <p>Unable to load dispatch order #{id}. {error}</p>
          <button className="btn btn-primary mt-2" type="button" onClick={refetch}>Try again</button>
        </div>
      </PageWrapper>
    );
  }
  if (!dispatch) return <PageWrapper><p style={{ color: 'var(--danger)', padding: 24 }}>Dispatch not found.</p></PageWrapper>;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dispatch.locationName || 'Disaster Shelter')}`;

  return (
    <PageWrapper>
      {/* Mobile-Optimized Header */}
      <div className="flex-between page-header" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 className="page-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              <Icon name="truck" size={18} /> Field Delivery Manifest
            </h2>
            <StatusBadge status={dispatch.status} />
          </div>
          <p className="page-sub">
            Order #{dispatch.dispatchId} · Assigned to <strong>{dispatch.teamName || 'Logistics Fleet'}</strong>
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/dispatch')}>
          ← All Dispatches
        </button>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        {/* Navigation & Target Location Card */}
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
          <div className="flex-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Destination Site
              </span>
              <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem' }}>{dispatch.locationName || 'Impact Zone'}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Origin Hub: <strong>{dispatch.centerName || 'Central Warehouse'}</strong>
              </p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', textDecoration: 'none' }}
            >
              📍 Open GPS Maps
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>Payload Item:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dispatch.resourceTypeName}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>Allocated Quantity:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                {dispatch.allocatedQty} {dispatch.unit || 'units'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Start Transit Prompt (if in CREATED status) */}
        {dispatch.status === 'CREATED' && (
          <div className="card" style={{ marginBottom: 16, background: 'rgba(139, 92, 246, 0.06)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div style={{ textAlign: 'center', padding: '12px 6px' }}>
              <div style={{ marginBottom: 8, color: 'var(--accent)' }}>
                <Icon name="truck" size={36} />
              </div>
              <h4 style={{ margin: '0 0 6px 0' }}>Vehicle Ready to Depart?</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Notify command center that the shipment is en route to the site.
              </p>
              <button
                className="btn btn-primary"
                type="button"
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600 }}
                disabled={transitLoading}
                onClick={handleStartTransit}
              >
                {transitLoading ? 'Updating…' : (
                  <>
                    <Icon name="truck" size={14} /> Start Transit (Deploy En Route)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Proof of Delivery Form */}
        {dispatch.status !== 'DELIVERED' ? (
          <div className="card">
            <h4 style={{ margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon name="pen" size={16} /> Handover & Proof of Delivery
              </span>
            </h4>

            <form onSubmit={handleSubmitDelivery}>
              {/* Delivered Qty */}
              <div className="form-group">
                <label className="form-label">Delivered Quantity ({dispatch.unit || 'units'}) *</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  step="any"
                  value={deliveredQty}
                  onChange={(e) => setDeliveredQty(e.target.value)}
                  required
                  placeholder="Enter verified quantity…"
                  style={{ fontSize: '1.05rem', fontWeight: 600 }}
                />
              </div>

              {/* Recipient Contact */}
              <div className="form-group">
                <label className="form-label">Receiver / Shelter Officer Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Commander Sarah / Camp Volunteer"
                />
              </div>

              {/* Touchscreen Digital Signature Pad */}
              <div className="form-group">
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Digital Signature (Sign with finger/stylus)</label>
                  {hasSignature && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                      onClick={clearSignature}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    position: 'relative',
                    touchAction: 'none',
                    overflow: 'hidden',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={140}
                    style={{ width: '100%', height: '140px', display: 'block', cursor: 'crosshair' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                        userSelect: 'none',
                      }}
                    >
                      <Icon name="pen" size={14} /> Sign here upon handover
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Proof of Delivery */}
              <div className="form-group">
                <label className="form-label">Photo Proof of Delivery (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="form-input"
                  onChange={handlePhotoUpload}
                  style={{ fontSize: '0.85rem', padding: '8px' }}
                />
                {photoPreview && (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    <img
                      src={photoPreview}
                      alt="Proof of Delivery Preview"
                      style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ position: 'absolute', top: 6, right: 6, fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(0,0,0,0.7)', color: '#fff' }}
                      onClick={() => setPhotoPreview(null)}
                    >
                      <Icon name="x" size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Notes */}
              <div className="form-group">
                <label className="form-label">Delivery Notes & Field Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any damages, missing items, or road conditions…"
                />
              </div>

              {submitError && (
                <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="warning" size={14} /> {submitError}
                  </span>
                </div>
              )}

              {done && (
                <div className="form-success" style={{ marginBottom: 14, fontWeight: 600, fontSize: '0.95rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="check" size={14} /> Delivery confirmed! Central stock & relief demand updated.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-success"
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
                >
                  {submitting ? 'Verifying & Fulfilling…' : (
                    <>
                      <Icon name="check" size={14} /> Confirm Delivery & Fulfill Demand
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => navigate('/dispatch')}
                  style={{ width: '100%', padding: '10px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Delivered State Card */
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ color: 'var(--success)', marginBottom: 10 }}>
              <Icon name="checkCircle" size={40} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--success)' }}>Delivery Completed & Verified</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Delivered <strong>{dispatch.deliveredQty || dispatch.allocatedQty} {dispatch.unit || 'units'}</strong> of {dispatch.resourceTypeName} to {dispatch.locationName}.
            </p>
            {dispatch.actualArrival && (
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>
                Delivered on: {formatDateTime(dispatch.actualArrival)}
              </p>
            )}
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/dispatch')}>
              Back to Dispatch Board
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
