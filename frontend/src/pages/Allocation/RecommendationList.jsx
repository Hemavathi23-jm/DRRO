import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { allocationApi, disasterApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatQty } from '../../utils/formatters';

const FILTER_DEFAULTS = { status: 'ALL', q: '' };
const STATUS_OPTS = ['ALL', 'RECOMMENDED', 'APPROVED', 'REJECTED', 'DISPATCHED', 'MODIFIED'];
const SPLIT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

function cleanPlaceName(raw) {
  if (!raw) return 'Disaster location';
  let name = String(raw).trim();
  name = name.replace(/\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?/g, '');
  name = name.replace(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/g, '');
  name = name.replace(/\s*[·•|]\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim();
  name = name.replace(/^[\s·•|-]+|[\s·•|-]+$/g, '').trim();
  return name || 'Disaster location';
}

export default function RecommendationList() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { values, setValue, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'ALL'
  const [showRun, setShowRun] = useState(false);
  const [strategy, setStrategy] = useState('GREEDY_PRIORITY');
  const [disasterId, setDisasterId] = useState('');
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectId, setRejectId] = useState(null);

  const { data, loading, error, refetch } = useAsyncData(() => allocationApi.list(), []);
  const { data: disasters } = useAsyncData(() => disasterApi.list(), []);
  const { data: strategies } = useAsyncData(() => allocationApi.strategies(), []);

  const handleRun = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const result = await allocationApi.run(strategy, disasterId ? Number(disasterId) : null);
      const created = result.allocationsCreated || 0;
      setRunMsg(result.message || `${created} allocation(s) calculated successfully.`);
      setShowRun(false);
      await refetch();
      if (created > 0) {
        setActiveTab('PENDING');
      }
    } catch (err) {
      setRunMsg(err.response?.data?.message || err.message || 'Allocation run failed');
    } finally {
      setRunning(false);
    }
  };

  const allocations = Array.isArray(data) ? data : [];

  // Summary counts
  const pendingCount = allocations.filter((a) => a?.status === 'RECOMMENDED').length;
  const approvedCount = allocations.filter((a) => a?.status === 'APPROVED' || a?.status === 'MODIFIED' || a?.status === 'DISPATCHED').length;
  const dispatchedCount = allocations.filter((a) => a?.status === 'DISPATCHED').length;

  const filtered = useMemo(() => {
    let rows = allocations;
    if (activeTab === 'PENDING') {
      rows = rows.filter((a) => a?.status === 'RECOMMENDED');
    } else if (activeTab === 'APPROVED') {
      rows = rows.filter((a) => a?.status === 'APPROVED' || a?.status === 'MODIFIED' || a?.status === 'DISPATCHED');
    }

    if (values.status !== 'ALL') rows = rows.filter((a) => a?.status === values.status);
    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      rows = rows.filter((a) =>
        [a.resourceTypeName, a.centerName, a.status, a.disasterTitle, a.locationName, String(a.allocationId)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [allocations, values, activeTab]);

  const groupedAllocations = useMemo(() => {
    const groups = {};
    filtered.forEach((a) => {
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
      toast.success('Allocation approved & staged for dispatch.');
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkApprove = async (ids, e) => {
    e?.stopPropagation();
    const recommendedIds = ids.filter((id) => {
      const alloc = allocations.find((a) => a.allocationId === id);
      return alloc?.status === 'RECOMMENDED';
    });
    if (recommendedIds.length === 0) return;

    setActionLoadingId(`bulk-${recommendedIds.join('-')}`);
    try {
      await allocationApi.bulkApprove(recommendedIds);
      toast.success(`Approved ${recommendedIds.length} allocation(s).`);
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Group approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = (id, e) => {
    e?.stopPropagation();
    setRejectId(id);
  };

  const confirmReject = async () => {
    const id = rejectId;
    setRejectId(null);
    if (!id) return;
    setActionLoadingId(id);
    try {
      await allocationApi.reject(id);
      toast.success('Allocation rejected.');
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingSpinner message="Loading allocations & recommendations…" />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load allocations"
          description={String(error)}
          action={(
            <button className="btn btn-primary" type="button" onClick={refetch}>
              Try again
            </button>
          )}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Resource Allocation Hub"
        subtitle="Match relief requests with warehouse inventory using optimization engine"
        actions={
          hasRole('OFFICER', 'ADMIN') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" type="button" onClick={() => setShowRun((s) => !s)}>
                ⚡ Run Allocation Engine
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/dispatch')}>
                🚚 View Dispatches ({dispatchedCount})
              </button>
            </div>
          )
        }
      />

      {/* KPI & Workflow Stage Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div
          className="card"
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'PENDING' ? '4px solid var(--warning)' : '1px solid var(--border)',
            background: activeTab === 'PENDING' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('PENDING')}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>1. AWAITING REVIEW</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: 2 }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recommendations pending approval</div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'APPROVED' ? '4px solid var(--success)' : '1px solid var(--border)',
            background: activeTab === 'APPROVED' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('APPROVED')}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>2. READY TO DISPATCH</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: 2 }}>{approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Approved & queued for logistics</div>
        </div>

        <div
          className="card"
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            borderLeft: activeTab === 'ALL' ? '4px solid var(--primary)' : '1px solid var(--border)',
            background: activeTab === 'ALL' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
          }}
          onClick={() => setActiveTab('ALL')}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>3. ALL ALLOCATIONS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{allocations.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total matching history</div>
        </div>
      </div>

      <FilterBar
        values={values}
        onChange={setValue}
        onClear={clearAll}
        resultCount={filtered.length}
        filters={[
          { key: 'status', label: 'Status', type: 'chips', options: STATUS_OPTS },
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search resource, center, disaster…' },
        ]}
      />

      {showRun && (
        <div className="card form-card alloc-run-panel" style={{ marginBottom: 16 }}>
          <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="bolt" size={16} /> Run Allocation Engine
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="alloc-strategy">Optimization Strategy</label>
            <select
              id="alloc-strategy"
              className="form-select"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              {(Array.isArray(strategies) ? strategies : ['GREEDY_PRIORITY']).map((s) => (
                <option key={s} value={s}>{String(s).replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="alloc-disaster">Disaster Scope</label>
            <select
              id="alloc-disaster"
              className="form-select"
              value={disasterId}
              onChange={(e) => setDisasterId(e.target.value)}
            >
              <option value="">All active disasters</option>
              {(Array.isArray(disasters) ? disasters : []).map((d) => (
                <option key={d.disasterId} value={d.disasterId}>{d.title}</option>
              ))}
            </select>
          </div>
          <div className="alloc-run-actions" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" type="button" onClick={handleRun} disabled={running}>
              {running ? 'Calculating optimal matching…' : '⚡ Execute Matching Algorithm'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowRun(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {runMsg && (
        <div className="status-banner status-banner--success" role="status" style={{ marginBottom: 14 }}>
          {runMsg}
        </div>
      )}

      {groupedAllocations.length === 0 ? (
        <EmptyState
          title="No allocations in this category"
          description="Run the allocation engine to calculate optimal resource assignments from available warehouses."
          action={
            hasRole('OFFICER', 'ADMIN') ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowRun(true)}>
                ⚡ Run Optimizer Now
              </button>
            ) : null
          }
        />
      ) : (
        <div className="alloc-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groupedAllocations.map((group) => {
            const first = group[0];
            const isMultiSplit = group.length > 1;
            const totalAllocated = group.reduce((acc, a) => acc + (Number(a.allocatedQty) || 0), 0);
            const totalDemand = Number(first.requiredQty) || totalAllocated;
            const hasPending = group.some((a) => a.status === 'RECOMMENDED');
            const groupKey = first.splitGroupId || `single-${first.allocationId}`;
            const place = cleanPlaceName(first.locationName);
            const disaster = first.disasterTitle ? cleanPlaceName(first.disasterTitle) : null;
            const fulfillmentPct = totalDemand > 0 ? Math.min(100, Math.round((totalAllocated / totalDemand) * 100)) : 100;

            return (
              <div
                key={groupKey}
                className="card"
                style={{
                  padding: 16,
                  border: hasPending ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                {/* Header Row: Demand Info + Fulfillment Meter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-active" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        REQUEST #{first.requestId}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {first.resourceTypeName || 'Resource'}
                      </h3>
                      {isMultiSplit && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          Multi-Hub Split ({group.length} Centers)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      <span>📍 <strong>Destination:</strong> {place}</span>
                      {disaster && <span>🌪️ <strong>Disaster:</strong> {disaster}</span>}
                      <span>📦 <strong>Requested:</strong> {formatQty(totalDemand, first.unit)}</span>
                      <span>✅ <strong>Total Allocated:</strong> {formatQty(totalAllocated, first.unit)} ({fulfillmentPct}%)</span>
                    </div>
                  </div>

                  {isMultiSplit && hasPending && hasRole('OFFICER', 'ADMIN') && (
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={actionLoadingId === `bulk-${group.map((a) => a.allocationId).join('-')}`}
                      onClick={(e) => handleBulkApprove(group.map((a) => a.allocationId), e)}
                    >
                      ✓ Approve All {group.length} Hubs
                    </button>
                  )}
                </div>

                {/* Fulfillment Visual Bar */}
                <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 12, display: 'flex' }}>
                  {group.map((a, idx) => {
                    const pct = totalDemand > 0 ? ((Number(a.allocatedQty) || 0) / totalDemand) * 100 : 100 / group.length;
                    return (
                      <div
                        key={a.allocationId}
                        style={{
                          width: `${pct}%`,
                          background: SPLIT_COLORS[idx % SPLIT_COLORS.length],
                          height: '100%',
                        }}
                        title={`${a.centerName}: ${a.allocatedQty} ${a.unit}`}
                      />
                    );
                  })}
                </div>

                {/* Side-by-Side Matching Legs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.map((a) => {
                    const score = Number(a.finalScore ?? a.priorityScore ?? 0);
                    const busy = actionLoadingId === a.allocationId;
                    return (
                      <div
                        key={a.allocationId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: 'var(--bg-surface)',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        {/* Source Warehouse Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Icon name="package" size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: '0.9rem' }}>{a.centerName || 'Warehouse'}</strong>
                              <StatusBadge status={a.status} />
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              Allocated: <strong style={{ color: 'var(--text-primary)' }}>{formatQty(a.allocatedQty, a.unit)}</strong>
                              {a.distanceKm != null && ` · 🚗 ${Number(a.distanceKm).toFixed(1)} km`}
                              {a.estimatedTravelHrs != null && ` · ⏱️ ~${Number(a.estimatedTravelHrs).toFixed(1)} hrs`}
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ textAlign: 'right', marginRight: 4 }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Match Score</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{score.toFixed(1)}/100</div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            {a.status === 'RECOMMENDED' && hasRole('OFFICER', 'ADMIN') && (
                              <>
                                <button
                                  className="btn btn-primary btn-sm"
                                  type="button"
                                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                  disabled={busy}
                                  onClick={(e) => handleApprove(a.allocationId, e)}
                                >
                                  {busy ? '…' : '✓ Approve'}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  type="button"
                                  style={{ padding: '4px 8px', fontSize: '0.78rem', color: 'var(--danger)' }}
                                  disabled={busy}
                                  onClick={(e) => handleReject(a.allocationId, e)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <Link
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              to={`/allocation/${a.allocationId}`}
                            >
                              Review & Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectId != null && (
        <ConfirmModal
          title="Reject allocation"
          message="Are you sure you want to reject this allocation recommendation? The request will remain pending for recalculation."
          confirmLabel="Reject"
          confirmClass="btn btn-danger"
          onCancel={() => setRejectId(null)}
          onConfirm={confirmReject}
        />
      )}
    </PageWrapper>
  );
}
