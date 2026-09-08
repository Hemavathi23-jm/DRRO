import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { allocationApi, disasterApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RecommendationList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [showRun, setShowRun] = useState(false);
  const [strategy, setStrategy] = useState('GREEDY_PRIORITY');
  const [disasterId, setDisasterId] = useState('');
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { data, loading, error, refetch } = useAsyncData(() => allocationApi.list(), []);
  const { data: disasters } = useAsyncData(() => disasterApi.list(), []);
  const { data: strategies } = useAsyncData(() => allocationApi.strategies(), []);

  const handleRun = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const result = await allocationApi.run(strategy, disasterId ? Number(disasterId) : null);
      setRunMsg(result.message || `${result.allocationsCreated} allocation(s) created.`);
      setShowRun(false);
      refetch();
    } catch (err) {
      setRunMsg(err.response?.data?.message || err.message || 'Allocation run failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading recommendations…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load allocations. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const allocations = Array.isArray(data) ? data : [];
  const filtered = filter === 'ALL' ? allocations : allocations.filter(a => a?.status === filter);
  const pending = allocations.filter(a => a?.status === 'RECOMMENDED').length;

  const handleApprove = async (id, e) => {
    e?.stopPropagation();
    setActionLoadingId(id);
    try {
      await allocationApi.approve(id);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to reject this allocation?')) return;
    setActionLoadingId(id);
    try {
      await allocationApi.reject(id);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Allocation Recommendations</h2>
          <p className="page-sub">
            {pending > 0 ? `${pending} allocation(s) awaiting operational approval` : 'All recommendations reviewed'}
          </p>
        </div>
        {hasRole('OFFICER', 'ADMIN') && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => setShowRun(s => !s)}>
              ⚡ Run Allocation Engine
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/dispatch')}>
              🚚 View Dispatches
            </button>
          </div>
        )}
      </div>

      {/* Workflow Explainer */}
      <div className="card" style={{ marginBottom: 18, borderLeft: '4px solid var(--accent)', padding: '14px 18px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong style={{ fontSize: '0.92rem' }}>Decision Engine & Response Pipeline</strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              The optimizer scores open demand against warehouse inventories using distance, urgency, and disaster severity. Approving an allocation automatically issues a dispatch order.
            </p>
          </div>
        </div>
      </div>

      {showRun && (
        <div className="card" style={{ marginBottom: 16, maxWidth: 540 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>⚡ Run Intelligent Allocation Engine</p>
          <div className="form-group">
            <label className="form-label">Strategy</label>
            <select className="form-select" value={strategy} onChange={e => setStrategy(e.target.value)}>
              {(Array.isArray(strategies) ? strategies : ['GREEDY_PRIORITY']).map(s => <option key={s} value={s}>{String(s).replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Disaster Scope (optional)</label>
            <select className="form-select" value={disasterId} onChange={e => setDisasterId(e.target.value)}>
              <option value="">All active disasters (Global Optimization)</option>
              {(Array.isArray(disasters) ? disasters : []).map(d => <option key={d.disasterId} value={d.disasterId}>{d.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? 'Calculating…' : 'Execute Optimization'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowRun(false)}>Cancel</button>
          </div>
        </div>
      )}

      {runMsg && (
        <div className="card" style={{ marginBottom: 14, padding: '10px 16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--success)' }}>
          {runMsg}
        </div>
      )}

      <div className="filter-bar">
        {['ALL', 'RECOMMENDED', 'APPROVED', 'REJECTED', 'DELIVERED'].map(s => (
          <button
            key={s}
            type="button"
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <p style={{ fontWeight: 600, marginBottom: 6 }}>No allocation recommendations found in this view.</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 16px' }}>
            Click <strong>Run Allocation Engine</strong> to evaluate all open relief requests against current warehouse stocks and compute optimal delivery paths.
          </p>
          {hasRole('OFFICER', 'ADMIN') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowRun(true)}>
              ⚡ Open Optimizer
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => (
            <div key={a?.allocationId || Math.random()} className="card">
              <div className="flex-between">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Request #{a?.requestId || a?.allocationId}</span>
                    <StatusBadge status={a?.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>{a?.allocatedQty ?? 0} {a?.unit || ''}</strong> of {a?.resourceTypeName || 'Supplies'} from <strong>{a?.centerName || 'Warehouse'}</strong>
                  </div>
                  {(a?.distanceKm != null || a?.estimatedTravelHrs != null) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {a?.distanceKm != null && `${Number(a.distanceKm || 0).toFixed(1)} km`}
                      {a?.estimatedTravelHrs != null && ` · ${Number(a.estimatedTravelHrs || 0).toFixed(1)} hrs est.`}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority Score</div>
                    <div className="metric-highlight">
                      {Number(a?.finalScore ?? a?.priorityScore ?? 0).toFixed(1)}
                    </div>
                  </div>
                  {a?.status === 'RECOMMENDED' && hasRole('OFFICER', 'ADMIN') && (
                    <>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        disabled={actionLoadingId === a?.allocationId}
                        onClick={(e) => handleApprove(a?.allocationId, e)}
                      >
                        {actionLoadingId === a?.allocationId ? 'Approving…' : '✓ Approve & Dispatch'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        type="button"
                        disabled={actionLoadingId === a?.allocationId}
                        onClick={(e) => handleReject(a?.allocationId, e)}
                      >
                        {actionLoadingId === a?.allocationId ? 'Rejecting…' : '✕ Reject'}
                      </button>
                    </>
                  )}
                  <Link to={`/allocation/${a?.allocationId}`}>
                    <button className="btn btn-secondary btn-sm" type="button">Details</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
