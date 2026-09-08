import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { requestApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const { data: r, loading, error, refetch } = useAsyncData(() => requestApi.get(id), [id]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading request…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load request. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );
  if (!r) return <PageWrapper><p style={{ color: 'var(--danger)', padding: 24 }}>Request not found.</p></PageWrapper>;

  const items = r.items || [];
  const URGENCY_COLOR = { CRITICAL: 'var(--danger)', HIGH: 'var(--warning)', MEDIUM: 'var(--info)', LOW: 'var(--text-muted)' };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await requestApi.verify(id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify request');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Request #{r.requestId}</h2>
          <p className="page-sub">{r.disasterTitle} · {r.locationName}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/requests')}>← Back</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Request Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              ['Status', <StatusBadge status={r.status} />],
              ['Urgency', <span style={{ color: URGENCY_COLOR[r.urgency], fontWeight: 700 }}>{r.urgency}</span>],
              ['Disaster', r.disasterTitle],
              ['Location', r.locationName],
              ['Deadline', formatDateTime(r.deadline)],
              ['Created by', r.createdByName || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {r.notes && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>{r.notes}</p>}
          </div>
        </div>

        <div className="card">
          <p className="card-title" style={{ marginBottom: 12 }}>Request Items</p>
          {items.length === 0 ? (
            <p className="text-muted">No items on this request.</p>
          ) : items.map(item => {
            const required = Number(item.requiredQty) || 0;
            const fulfilled = Number(item.fulfilledQty) || 0;
            const pct = required > 0 ? Math.round(fulfilled / required * 100) : 0;
            return (
              <div key={item.requestItemId} style={{ marginBottom: 14 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.resourceTypeName}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fulfilled}/{required} {item.unit}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${pct >= 100 ? 'progress-bar-fill--success' : 'progress-bar-fill--accent'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}% fulfilled</span>
              </div>
            );
          })}
        </div>
      </div>

      {hasRole('OFFICER', 'ADMIN') && r.status === 'PENDING' && (
        <div className="card">
          <p className="card-title" style={{ marginBottom: 12 }}>Actions</p>
          <button className="btn btn-success" onClick={handleVerify} disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify Request'}
          </button>
        </div>
      )}
    </PageWrapper>
  );
}
