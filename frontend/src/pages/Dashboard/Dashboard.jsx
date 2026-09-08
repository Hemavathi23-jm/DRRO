import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import OperationalMap, { MAP_COLORS } from '../../components/map/OperationalMap';
import ResourceUtilizationChart from '../../components/charts/ResourceUtilizationChart';
import RequestFulfillmentChart from '../../components/charts/RequestFulfillmentChart';
import AllocationTimeline from '../../components/charts/AllocationTimeline';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dashboardApi, allocationApi, disasterApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const QUICK_ACTIONS = [
  {
    label: 'Report Disaster',
    sub: 'Register new incident',
    path: '/disasters/create',
    icon: '🚨',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  {
    label: 'New Relief Request',
    sub: 'Submit demand for supplies',
    path: '/requests/create',
    icon: '🆘',
    bg: 'rgba(249, 115, 22, 0.12)',
  },
  {
    label: 'Dispatch Teams',
    sub: 'Deploy response units',
    path: '/teams',
    icon: '🚑',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    label: 'Add Inventory',
    sub: 'Stock distribution centers',
    path: '/resources/inventory/add',
    icon: '📦',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(() => dashboardApi.get(), []);
  const { data: mapData } = useAsyncData(() => dashboardApi.map(), []);
  const { data: disasters } = useAsyncData(() => disasterApi.list(), []);
  const { data: allocations } = useAsyncData(() => allocationApi.list(), []);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading operational dashboard…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load dashboard. {error}</p>
        <button className="btn btn-primary mt-2" type="button" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const m = data || {};
  const kpis = [
    { label: 'Active Disasters', value: m.activeDisasters ?? 0 },
    { label: 'Open Requests', value: m.openRequests ?? 0 },
    { label: 'Pending Approvals', value: m.pendingApprovals ?? 0 },
    { label: 'Low Stock Alerts', value: m.lowStockAlerts ?? 0 },
    { label: 'Active Dispatches', value: m.activeDispatches ?? 0 },
    { label: 'Fulfillment Rate', value: `${m.fulfillmentRatePct ?? m.fulfillmentRate ?? 0}%` },
  ];

  const allMarkers = mapData ? [
    ...(mapData.disasters || []),
    ...(mapData.locations || []),
    ...(mapData.resourceCenters || []),
    ...(mapData.teams || []),
    ...(mapData.dispatches || []),
  ] : [];

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
    } catch {
      alert('PDF export requires officer/admin role and a running backend.');
    }
  };

  return (
    <PageWrapper>
      {/* Critical Attention Banner */}
      {(m.pendingApprovals > 0 || m.openRequests > 0) && (
        <div className="critical-banner flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Action Required:</strong>{' '}
              {m.pendingApprovals > 0 && `${m.pendingApprovals} allocation recommendation(s) awaiting approval. `}
              {m.openRequests > 0 && `${m.openRequests} open relief request(s) ready for resource optimization.`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {m.openRequests > 0 && (
              <button
                className="btn btn-primary btn-sm"
                type="button"
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                onClick={() => navigate('/allocation')}
              >
                ⚡ Run Optimizer & Allocate
              </button>
            )}
            {m.pendingApprovals > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                onClick={() => navigate('/allocation')}
              >
                ✓ Review Approvals
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              style={{ fontSize: '0.8rem', padding: '5px 12px' }}
              onClick={() => navigate('/requests')}
            >
              View Requests
            </button>
          </div>
        </div>
      )}

      {/* Quick Operational Actions Bar */}
      <section className="dash-section">
        <div className="dash-section-head flex-between">
          <div>
            <h3>Emergency Command Operations</h3>
            <p>Direct shortcuts for operational personnel</p>
          </div>
          {hasRole('OFFICER', 'ADMIN') && (
            <button className="btn btn-secondary btn-sm" type="button" onClick={handleExportPdf}>
              📄 Export Executive PDF
            </button>
          )}
        </div>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className="quick-action-card"
              onClick={() => navigate(action.path)}
            >
              <div className="quick-action-icon" style={{ backgroundColor: action.bg }}>
                {action.icon}
              </div>
              <div>
                <div className="quick-action-title">{action.label}</div>
                <div className="quick-action-sub">{action.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* KPI Metrics Summary */}
      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
        {/* Left Column: Live Incident Feed & Recent Allocations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Incident Feed */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <p className="card-title" style={{ margin: 0 }}>🚨 Live Incident Feed</p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                onClick={() => navigate('/disasters')}
              >
                View All ({disasters?.length || 0})
              </button>
            </div>
            {recentDisasters.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px 0' }}>No active disasters reported.</p>
            ) : (
              <div className="incident-feed">
                {recentDisasters.map((d) => {
                  const sev = d.severity ?? 50;
                  const sevColor = sev >= 75 ? 'var(--danger)' : sev >= 55 ? 'var(--warning)' : 'var(--success)';
                  const sevBg = sev >= 75 ? 'rgba(239, 68, 68, 0.15)' : sev >= 55 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)';
                  return (
                    <div
                      key={d.disasterId || d.id}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Allocation Recommendations */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <p className="card-title" style={{ margin: 0 }}>⚡ Allocation Recommendations</p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.76rem', padding: '3px 8px' }}
                onClick={() => navigate('/allocation')}
              >
                View All
              </button>
            </div>
            {recentAlloc.length === 0 ? (
              <p className="text-muted" style={{ padding: '12px 0' }}>No recommendations generated yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Center</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAlloc.map((r) => (
                      <tr
                        key={r.allocationId}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/allocation/${r.allocationId}`)}
                      >
                        <td style={{ fontWeight: 600 }}>{r.resourceTypeName}</td>
                        <td style={{ fontSize: '0.82rem' }}>{r.centerName}</td>
                        <td><span className="metric-highlight">{r.priorityScore?.toFixed?.(1) ?? r.priorityScore}</span></td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Operational Map & Unmet Demand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Operational Map */}
          <div className="card">
            <p className="card-title" style={{ marginBottom: 10 }}>🗺️ Operational Geographic Map</p>
            <OperationalMap markers={allMarkers} routes={mapData?.routes || []} height={280} zoom={4} />
            <div className="map-legend">
              {Object.entries(MAP_COLORS).map(([k, c]) => (
                <span key={k}><span className="legend-dot" style={{ background: c }} /> {k.replace('_', ' ')}</span>
              ))}
            </div>
          </div>

          {/* Unmet Demand by Location & Resource */}
          <div className="card">
            <p className="card-title" style={{ marginBottom: 12 }}>📋 Critical Unmet Demand</p>
            {(!m.unmetDemand || m.unmetDemand.length === 0) ? (
              <p className="text-muted" style={{ padding: '8px 0' }}>All verified demands are currently fulfilled or in transit.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Required Resource</th>
                      <th>Unmet Qty</th>
                      <th>Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.unmetDemand.slice(0, 6).map((u, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.locationName}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.resourceTypeName || u.resourceName || 'Supplies'}
                          </span>
                          {u.unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> ({u.unit})</span>}
                        </td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{u.unmetQty}</td>
                        <td>
                          <span className={`badge badge-${String(u.urgency || 'normal').toLowerCase()}`}>
                            {u.urgency || 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics & Algorithm Charts */}
      <div className="grid-2 section-block">
        <ResourceUtilizationChart data={m.utilization} />
        <RequestFulfillmentChart metrics={m} />
      </div>
      <div className="section-block">
        <AllocationTimeline data={m.baselineComparison} />
      </div>
    </PageWrapper>
  );
}
