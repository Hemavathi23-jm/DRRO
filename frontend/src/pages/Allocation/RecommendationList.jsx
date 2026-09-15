import { useState, useMemo } from 'react';
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

  const allocations = Array.isArray(data) ? data : [];
  const filtered = filter === 'ALL' ? allocations : allocations.filter(a => a?.status === filter);
  const pending = allocations.filter(a => a?.status === 'RECOMMENDED').length;

  const groupedAllocations = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      const key = a.splitGroupId || `single-${a.allocationId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.values(groups);
  }, [filtered]);

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

  const handleBulkApprove = async (ids, e) => {
    e?.stopPropagation();
    const recommendedIds = ids.filter(id => {
      const alloc = allocations.find(a => a.allocationId === id);
      return alloc?.status === 'RECOMMENDED';
    });
    if (recommendedIds.length === 0) return;

    setActionLoadingId('bulk-' + recommendedIds.join('-'));
    try {
      await allocationApi.bulkApprove(recommendedIds);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Group approval failed');
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

  if (loading) return <PageWrapper><LoadingSpinner message="Loading recommendations…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load allocations. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Allocation Recommendations</h2>
          <p className="page-sub">
            {pending > 0 ? `${pending} recommendation leg(s) awaiting operational approval` : 'All recommendations reviewed'}
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

      {/* Multi-Warehouse Capability Banner */}
      <div className="card" style={{ marginBottom: 18, borderLeft: '4px solid var(--accent)', padding: '14px 18px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong style={{ fontSize: '0.92rem' }}>📦 Multi-Warehouse Optimization Enabled</strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              When relief demand exceeds the stock of the nearest resource center, the engine automatically pools capacity from the closest secondary warehouses.
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
        {['ALL', 'RECOMMENDED', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'REJECTED'].map(s => (
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

      {groupedAllocations.length === 0 ? (
        <div className="empty-state card">
          <p style={{ fontWeight: 600, marginBottom: 6 }}>No allocation recommendations found in this view.</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 16px' }}>
            Click <strong>Run Allocation Engine</strong> to evaluate all open relief requests against current warehouse stocks.
          </p>
          {hasRole('OFFICER', 'ADMIN') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowRun(true)}>
              ⚡ Open Optimizer
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groupedAllocations.map((group) => {
            const first = group[0];
            const isMultiSplit = group.length > 1;
            const totalAllocated = group.reduce((acc, a) => acc + (Number(a.allocatedQty) || 0), 0);
            const totalDemand = Number(first.requiredQty) || totalAllocated;
            const hasPending = group.some(a => a.status === 'RECOMMENDED');
            const groupKey = first.splitGroupId || `single-${first.allocationId}`;

            return (
              <div
                key={groupKey}
                className="card"
                style={{
                  border: isMultiSplit ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-subtle)',
                  background: isMultiSplit ? 'rgba(139, 92, 246, 0.03)' : 'var(--bg-card)',
                  padding: '16px 20px',
                }}
              >
                {/* Header for the request item */}
                <div className="flex-between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Request #{first.requestId} · {first.resourceTypeName}
                      </span>
                      {isMultiSplit && (
                        <span
                          style={{
                            background: 'rgba(139, 92, 246, 0.18)',
                            color: '#8b5cf6',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(139, 92, 246, 0.35)',
                          }}
                        >
                          ⚡ Multi-Warehouse Split Order ({group.length} Centers)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                      Destination: <strong>{first.locationName || 'Disaster Shelter'}</strong> · Total Demand: <strong>{totalDemand} {first.unit}</strong> (Fulfills {totalAllocated} {first.unit})
                    </div>
                  </div>

                  {isMultiSplit && hasPending && hasRole('OFFICER', 'ADMIN') && (
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={actionLoadingId === 'bulk-' + group.map(a => a.allocationId).join('-')}
                      onClick={(e) => handleBulkApprove(group.map(a => a.allocationId), e)}
                      style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                    >
                      ⚡ Approve All {group.length} Split Legs
                    </button>
                  )}
                </div>

                {/* Split Distribution Progress Bar */}
                {isMultiSplit && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-surface)' }}>
                      {group.map((a, idx) => {
                        const pct = a.splitContributionPct || 50;
                        const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];
                        const col = colors[idx % colors.length];
                        return (
                          <div
                            key={a.allocationId}
                            style={{ width: `${pct}%`, background: col }}
                            title={`${a.centerName}: ${a.allocatedQty} ${a.unit} (${pct}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-cards for each warehouse leg */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.map((a) => (
                    <div
                      key={a.allocationId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: '1.2rem' }}>📦</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: '0.88rem' }}>{a.centerName}</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              ({a.allocatedQty} {a.unit} · {a.splitContributionPct || 100}%)
                            </span>
                            <StatusBadge status={a.status} />
                          </div>
                          {(a.distanceKm != null || a.estimatedTravelHrs != null) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              {a.distanceKm != null && `${Number(a.distanceKm).toFixed(1)} km`}
                              {a.estimatedTravelHrs != null && ` · ${Number(a.estimatedTravelHrs).toFixed(1)} hrs est. travel`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Score</div>
                          <div className="metric-highlight" style={{ fontSize: '0.9rem' }}>
                            {Number(a.finalScore ?? a.priorityScore ?? 0).toFixed(1)}
                          </div>
                        </div>

                        {a.status === 'RECOMMENDED' && hasRole('OFFICER', 'ADMIN') && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              type="button"
                              style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                              disabled={actionLoadingId === a.allocationId}
                              onClick={(e) => handleApprove(a.allocationId, e)}
                            >
                              {actionLoadingId === a.allocationId ? '…' : '✓ Approve'}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              type="button"
                              style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                              disabled={actionLoadingId === a.allocationId}
                              onClick={(e) => handleReject(a.allocationId, e)}
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <Link to={`/allocation/${a.allocationId}`}>
                          <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.76rem', padding: '3px 8px' }} type="button">
                            Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
