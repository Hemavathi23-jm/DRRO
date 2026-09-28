import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import ResourceUtilizationChart from '../../components/charts/ResourceUtilizationChart';
import RequestFulfillmentChart from '../../components/charts/RequestFulfillmentChart';
import AllocationTimeline from '../../components/charts/AllocationTimeline';
import { useNavigate } from 'react-router-dom';
import { useAsyncData } from '../../hooks/useAsyncData';
import { dashboardApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function Reports() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const { data, loading, error, refetch } = useAsyncData(() => dashboardApi.get(), []);

  const handleExportPdf = async () => {
    try {
      const res = await dashboardApi.exportPdf();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drro-operational-summary.pdf';
      a.click();
      toast.success('Report PDF downloaded.');
    } catch {
      toast.error('PDF export requires officer/admin role and a running backend.');
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading reports…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load reports"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  const m = data || {};
  const metrics = [
    { label: 'Active disasters', value: m.activeDisasters ?? 0 },
    { label: 'Open requests', value: m.openRequests ?? 0 },
    { label: 'Pending approvals', value: m.pendingApprovals ?? 0 },
    { label: 'Low stock alerts', value: m.lowStockAlerts ?? 0 },
    { label: 'Active dispatches', value: m.activeDispatches ?? 0 },
    { label: 'Fulfillment rate', value: `${m.fulfillmentRatePct ?? m.fulfillmentRate ?? 0}%` },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Reports & analytics"
        subtitle="Live operational summary from the command dashboard"
        actions={
          <>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/reports/comparison')}>
              Algorithm comparison
            </button>
            {hasRole('OFFICER', 'ADMIN') && (
              <button className="btn btn-primary" type="button" onClick={handleExportPdf}>
                Export PDF
              </button>
            )}
          </>
        }
      />

      <div className="grid-kpi">
        {metrics.map((item) => (
          <div className="kpi-card" key={item.label}>
            <span className="kpi-label">{item.label}</span>
            <span className="kpi-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid-2 section-block">
        <ResourceUtilizationChart data={m.utilization} />
        <RequestFulfillmentChart metrics={m} />
      </div>
      <div className="section-block">
        <AllocationTimeline data={m.baselineComparison} />
      </div>

      <div className="card section-block">
        <p className="card-title">Critical unmet demand</p>
        {!m.unmetDemand?.length ? (
          <p className="text-muted">No unmet demand currently reported.</p>
        ) : (
          <div className="stack-list">
            {m.unmetDemand.slice(0, 12).map((u, i) => (
              <div className="stack-card stack-card--static" key={i}>
                <div className="stack-card-main">
                  <div className="stack-card-title" title={u.locationName}>{u.locationName}</div>
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
      </div>
    </PageWrapper>
  );
}
