import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import { BentoGrid, BentoTile } from '../../components/common/Bento';
import EmptyState from '../../components/common/EmptyState';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import OperationalMap, { MAP_COLORS } from '../../components/map/OperationalMap';
import ResourceUtilizationChart from '../../components/charts/ResourceUtilizationChart';
import RequestFulfillmentChart from '../../components/charts/RequestFulfillmentChart';
import AllocationTimeline from '../../components/charts/AllocationTimeline';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dashboardApi, allocationApi, disasterApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/common/Icon';

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();
  const [showInsights, setShowInsights] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(() => dashboardApi.get(), []);
  const { data: mapData, refetch: refetchMap } = useAsyncData(() => dashboardApi.map(), []);
  const { data: disasters, refetch: refetchDisasters } = useAsyncData(() => disasterApi.list(), []);
  const { data: allocations, refetch: refetchAllocations } = useAsyncData(() => allocationApi.list(), []);

  useEffect(() => {
    const handleLiveEvent = () => {
      refetch();
      refetchMap();
      refetchDisasters();
      refetchAllocations();
    };
    window.addEventListener('drro-live-event', handleLiveEvent);
    return () => window.removeEventListener('drro-live-event', handleLiveEvent);
  }, [refetch, refetchMap, refetchDisasters, refetchAllocations]);

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader title="Command Center" subtitle="Loading operational picture…" />
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load dashboard"
          description={String(error)}
          action={
            <button className="btn btn-primary" type="button" onClick={refetch}>
              Try again
            </button>
          }
        />
      </PageWrapper>
    );
  }

  const m = data || {};
  const pending = m.pendingApprovals ?? 0;
  const openReqs = m.openRequests ?? 0;
  const lowStock = m.lowStockAlerts ?? 0;
  const activeDisasters = m.activeDisasters ?? 0;
  const fulfillment = m.fulfillmentRatePct ?? m.fulfillmentRate ?? 0;
  const needsAction = pending > 0 || openReqs > 0 || lowStock > 0;

  const allMarkers = mapData
    ? [
        ...(mapData.disasters || []),
        ...(mapData.locations || []),
        ...(mapData.resourceCenters || []),
        ...(mapData.teams || []),
        ...(mapData.dispatches || []),
      ]
    : [];

  const recentDisasters = (disasters || []).slice(0, 6);
  const recentAlloc = (allocations || []).slice(0, 5);

  const handleExportPdf = async () => {
    try {
      const res = await dashboardApi.exportPdf();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drro-operational-summary.pdf';
      a.click();
      toast.success('Executive PDF downloaded.');
    } catch {
      toast.error('PDF export requires officer/admin role and a running backend.');
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Command Center"
        subtitle="Prioritize critical demand, approvals, and field posture"
        actions={
          <>
            {hasRole('OFFICER', 'ADMIN') && (
              <button className="btn btn-secondary btn-sm" type="button" onClick={handleExportPdf}>
                Export PDF
              </button>
            )}
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/disasters/create')}>
              Report disaster
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/allocation')}>
              Run optimizer
            </button>
          </>
        }
      />

      {needsAction && (
        <div className="critical-banner flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>Action required.</strong>{' '}
            {pending > 0 && `${pending} approval(s) pending. `}
            {openReqs > 0 && `${openReqs} open request(s). `}
            {lowStock > 0 && `${lowStock} low-stock alert(s).`}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pending > 0 && (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/allocation')}>
                Review approvals
              </button>
            )}
            {openReqs > 0 && pending === 0 && (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/allocation')}>
                Optimize & allocate
              </button>
            )}
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/requests')}>
              View requests
            </button>
          </div>
        </div>
      )}

      <BentoGrid>
        <BentoTile title="Operational map" span="map">
          <OperationalMap markers={allMarkers} routes={mapData?.routes || []} height={380} zoom={4} />
          <div className="map-legend">
            {Object.entries(MAP_COLORS).map(([k, c]) => (
              <span key={k}>
                <span className="legend-dot" style={{ background: c }} /> {k.replace('_', ' ')}
              </span>
            ))}
          </div>
        </BentoTile>

        <BentoTile title="Action queue" span="queue">
          <div className="action-queue">
            <button
              type="button"
              className={`action-queue-item${pending > 0 ? ' action-queue-item--critical' : ''}`}
              onClick={() => navigate('/allocation')}
            >
              <div className="action-queue-meta">
                <span className="action-queue-label">Pending approvals</span>
                <span className="action-queue-sub">Recommendations awaiting decision</span>
              </div>
              <span className={`action-queue-count${pending > 0 ? ' action-queue-count--danger' : ''}`}>{pending}</span>
            </button>
            <button type="button" className="action-queue-item" onClick={() => navigate('/requests?urgency=CRITICAL')}>
              <div className="action-queue-meta">
                <span className="action-queue-label">Open relief requests</span>
                <span className="action-queue-sub">Including critical urgency</span>
              </div>
              <span className="action-queue-count">{openReqs}</span>
            </button>
            <button type="button" className="action-queue-item" onClick={() => navigate('/resources/inventory')}>
              <div className="action-queue-meta">
                <span className="action-queue-label">Low stock alerts</span>
                <span className="action-queue-sub">Centers below threshold</span>
              </div>
              <span className={`action-queue-count${lowStock > 0 ? ' action-queue-count--danger' : ''}`}>{lowStock}</span>
            </button>
            <button type="button" className="action-queue-item" onClick={() => navigate('/dispatch')}>
              <div className="action-queue-meta">
                <span className="action-queue-label">Active dispatches</span>
                <span className="action-queue-sub">In transit or assigned</span>
              </div>
              <span className="action-queue-count">{m.activeDispatches ?? 0}</span>
            </button>

            <div className="action-queue-actions">
              <button className="btn btn-primary" type="button" onClick={() => navigate('/allocation')}>
                Open allocation console
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/requests/create')}>
                New relief request
              </button>
            </div>
          </div>
        </BentoTile>

        <BentoTile span="stat">
          <p className="kpi-label">Active disasters</p>
          <p className="kpi-value">{activeDisasters}</p>
        </BentoTile>
        <BentoTile span="stat">
          <p className="kpi-label">Pending approvals</p>
          <p className="kpi-value">{pending}</p>
        </BentoTile>
        <BentoTile span="stat">
          <p className="kpi-label">Low stock</p>
          <p className="kpi-value">{lowStock}</p>
        </BentoTile>
        <BentoTile span="stat">
          <p className="kpi-label">Fulfillment</p>
          <p className="kpi-value">{fulfillment}%</p>
        </BentoTile>

        <BentoTile
          title="Live incidents"
          span="incidents"
          action={
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/disasters')}>
              View all
            </button>
          }
        >
          {recentDisasters.length === 0 ? (
            <p className="text-muted">No active disasters reported.</p>
          ) : (
            <div className="incident-feed">
              {recentDisasters.map((d) => {
                const sev = d.severity ?? 50;
                const sevColor = sev >= 75 ? 'var(--danger)' : sev >= 55 ? 'var(--warning)' : 'var(--success)';
                const sevBg =
                  sev >= 75
                    ? 'rgba(239, 68, 68, 0.15)'
                    : sev >= 55
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(34, 197, 94, 0.15)';
                return (
                  <button
                    key={d.disasterId || d.id}
                    type="button"
                    className="incident-feed-item"
                    onClick={() => navigate(`/disasters/${d.disasterId || d.id}`)}
                  >
                    <div className="incident-feed-left">
                      <span className="incident-sev-badge" style={{ color: sevColor, background: sevBg }}>
                        {d.disasterType || d.type || 'EVENT'} {sev}
                      </span>
                      <span className="incident-title-text" title={d.title || d.name}>
                        {d.title || d.name || 'Disaster Incident'}
                      </span>
                    </div>
                    <span className="incident-time-text">
                      {formatDateTime(d.reportedAt || d.createdAt || d.startTime)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </BentoTile>

        <BentoTile
          title="Recent allocations"
          span="alloc"
          action={
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigate('/allocation')}>
              View all
            </button>
          }
        >
          {recentAlloc.length === 0 ? (
            <p className="text-muted">No recommendations generated yet.</p>
          ) : (
            <div className="stack-list">
              {recentAlloc.map((r) => (
                <button
                  key={r.allocationId}
                  type="button"
                  className="stack-card"
                  onClick={() => navigate(`/allocation/${r.allocationId}`)}
                >
                  <div className="stack-card-main">
                    <div className="stack-card-title">{r.resourceTypeName}</div>
                    <div className="stack-card-sub">{r.centerName}</div>
                  </div>
                  <div className="stack-card-meta">
                    <span className="metric-highlight">
                      {r.priorityScore?.toFixed?.(1) ?? r.priorityScore}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </BentoTile>

        <BentoTile title="Critical unmet demand" span="unmet">
          {!m.unmetDemand || m.unmetDemand.length === 0 ? (
            <p className="text-muted">All verified demands are currently fulfilled or in transit.</p>
          ) : (
            <div className="stack-list">
              {m.unmetDemand.slice(0, 8).map((u, i) => (
                <div className="stack-card stack-card--static" key={i}>
                  <div className="stack-card-main">
                    <div className="stack-card-title" title={u.locationName}>
                      {u.locationName}
                    </div>
                    <div className="stack-card-sub">
                      {u.resourceTypeName || u.resourceName || 'Supplies'}
                      {u.unit ? ` · ${u.unit}` : ''}
                    </div>
                  </div>
                  <div className="stack-card-meta">
                    <div className="stack-card-qty">
                      <span className="stack-card-qty-label">Unmet</span>
                      <span className="stack-card-qty-value">{u.unmetQty}</span>
                    </div>
                    <span className={`badge badge-${String(u.urgency || 'normal').toLowerCase()}`}>
                      {u.urgency || 'NORMAL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoTile>
      </BentoGrid>

      <button
        type="button"
        className="btn btn-secondary insights-toggle"
        onClick={() => setShowInsights((v) => !v)}
        aria-expanded={showInsights}
      >
        <span>{showInsights ? 'Hide analytics' : 'Show analytics & insights'}</span>
        <Icon name={showInsights ? 'x' : 'chart'} size={14} />
      </button>

      <div className="insights-panel" hidden={!showInsights}>
        <div className="grid-2 section-block">
          <ResourceUtilizationChart data={m.utilization} />
          <RequestFulfillmentChart metrics={m} />
        </div>
        <div className="section-block">
          <AllocationTimeline data={m.baselineComparison} />
        </div>
      </div>
    </PageWrapper>
  );
}
