import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityCard from '../../components/common/PriorityCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { allocationApi, dispatchApi, teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function buildFactors(a) {
  return {
    severityScore: a.severityScore,
    populationScore: a.populationScore,
    urgencyScore: a.urgencyScore,
    shortageScore: a.shortageScore,
    travelTimeScore: a.travelTimeScore,
    vulnerabilityScore: a.vulnerabilityScore,
    explanationText: a.explanationText,
  };
}

export default function RecommendationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { data: a, loading, error, refetch } = useAsyncData(() => allocationApi.get(id), [id]);
  const { data: teams } = useAsyncData(() => teamApi.available(), []);

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    teamId: '',
    vehicleInfo: '',
    etaHours: '2',
    notes: '',
  });
  const [submittingDispatch, setSubmittingDispatch] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  if (loading) return <PageWrapper><LoadingSpinner message="Loading allocation…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load allocation. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );
  if (!a) return <PageWrapper><p style={{ color: 'var(--danger)', padding: 24 }}>Allocation not found.</p></PageWrapper>;

  const score = a.finalScore ?? a.priorityScore ?? 0;

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    setDispatchError('');
    setSubmittingDispatch(true);
    try {
      const eta = new Date(Date.now() + (parseFloat(dispatchForm.etaHours) || 2) * 3600 * 1000).toISOString();
      await dispatchApi.create({
        allocationId: a.allocationId,
        teamId: dispatchForm.teamId ? parseInt(dispatchForm.teamId) : null,
        vehicleInfo: dispatchForm.vehicleInfo,
        estimatedArrival: eta,
        notes: dispatchForm.notes || null,
      });
      setShowDispatchModal(false);
      navigate('/dispatch');
    } catch (err) {
      setDispatchError(err.response?.data?.message || err.message || 'Failed to create dispatch.');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Allocation #{a.allocationId}</h2>
          <p className="page-sub">Request #{a.requestId} · {a.resourceTypeName}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/allocation')}>← Back</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Allocation Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              ['Status', <StatusBadge status={a.status} />],
              ['Request', `#${a.requestId}`],
              ['Resource', `${a.resourceTypeName} (${a.unit || 'units'})`],
              ['Source Center', a.centerName],
              ['Allocated Qty', a.allocatedQty],
              ['Distance', a.distanceKm != null ? `${Number(a.distanceKm).toFixed(1)} km` : '—'],
              ['Est. Travel', a.estimatedTravelHrs != null ? `${Number(a.estimatedTravelHrs).toFixed(1)} hours` : '—'],
              ['Priority Score', <span className="metric-highlight">{Number(score).toFixed(1)}</span>],
            ].map(([k, v]) => (
              <div key={k} className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <PriorityCard score={score} factors={buildFactors(a)} />
      </div>

      {hasRole('OFFICER', 'ADMIN') && a.status === 'RECOMMENDED' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Review Actions</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-success" onClick={() => navigate(`/allocation/${a.allocationId}/review`)}>Approve</button>
            <button className="btn btn-danger" onClick={() => navigate(`/allocation/${a.allocationId}/review`)}>Reject</button>
            <button className="btn btn-secondary" onClick={() => navigate(`/allocation/${a.allocationId}/review`)}>Modify</button>
          </div>
        </div>
      )}

      {hasRole('OFFICER', 'COORDINATOR', 'ADMIN') && a.status === 'APPROVED' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="card-title" style={{ marginBottom: 8 }}>Dispatch Operations</p>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
            This allocation is approved and reserved in inventory. Assign a response team and vehicle to create a dispatch.
          </p>
          <button className="btn btn-primary" onClick={() => setShowDispatchModal(true)}>
            🚚 Create Dispatch
          </button>
        </div>
      )}

      {showDispatchModal && (
        <div className="card" style={{ maxWidth: 540, marginBottom: 16, border: '1px solid var(--primary)' }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Create Dispatch Assignment</p>
          {dispatchError && (
            <div style={{ padding: '8px 12px', marginBottom: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: '0.85rem' }}>
              {dispatchError}
            </div>
          )}
          <form onSubmit={handleCreateDispatch}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Assign Response Team</label>
                <select
                  className="form-select"
                  value={dispatchForm.teamId}
                  onChange={e => setDispatchForm(f => ({ ...f, teamId: e.target.value }))}
                >
                  <option value="">No team assigned</option>
                  {(teams || []).map(t => (
                    <option key={t.teamId} value={t.teamId}>{t.name} ({t.skills || 'General'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Info *</label>
                <input
                  className="form-input"
                  required
                  value={dispatchForm.vehicleInfo}
                  onChange={e => setDispatchForm(f => ({ ...f, vehicleInfo: e.target.value }))}
                  placeholder="e.g. Relief Truck KA-01-E-4567"
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Estimated Transit (Hours)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={dispatchForm.etaHours}
                  onChange={e => setDispatchForm(f => ({ ...f, etaHours: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dispatch Notes</label>
                <input
                  className="form-input"
                  value={dispatchForm.notes}
                  onChange={e => setDispatchForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Route instructions, driver contact..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-success" type="submit" disabled={submittingDispatch}>
                {submittingDispatch ? 'Creating Dispatch…' : 'Confirm & Dispatch'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowDispatchModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </PageWrapper>
  );
}
