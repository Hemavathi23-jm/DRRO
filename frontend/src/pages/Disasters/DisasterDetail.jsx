import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { disasterApi, locationApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['ACTIVE', 'CONTAINED', 'RECOVERING', 'CLOSED'];

const locationColumns = [
  { label: 'Location', accessor: 'name', render: r => <span style={{ fontWeight: 600 }}>{r.name}</span> },
  { label: 'Population', accessor: 'populationAffected', render: r => (r.populationAffected ?? 0).toLocaleString() },
  { label: 'Severity', accessor: 'severityScore', render: r => <span style={{ color: r.severityScore >= 80 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>{r.severityScore ?? '—'}</span> },
  { label: 'Accessibility', accessor: 'accessibility', render: r => r.accessibility ? <StatusBadge status={r.accessibility} /> : '—' },
  { label: 'Open Requests', accessor: 'openRequestCount', render: r => r.openRequestCount ?? 0 },
];

export default function DisasterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [updating, setUpdating] = useState(false);

  const { data: d, loading, error, refetch } = useAsyncData(() => disasterApi.get(id), [id]);
  const { data: locations, loading: locLoading } = useAsyncData(() => locationApi.list(id), [id]);

  if (loading) return <PageWrapper><LoadingSpinner message="Loading disaster…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load disaster. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );
  if (!d) return <PageWrapper><p style={{ color: 'var(--danger)', padding: 24 }}>Disaster not found.</p></PageWrapper>;

  const handleStatusUpdate = async (status) => {
    if (!hasRole('OFFICER', 'ADMIN') || status === d.status) return;
    setUpdating(true);
    try {
      await disasterApi.update(id, {
        title: d.title,
        type: d.type,
        severity: d.severity,
        startTime: d.startTime,
        endTime: d.endTime,
        latitude: d.latitude,
        longitude: d.longitude,
        description: d.description,
        status,
      });
      refetch();
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">{d.title}</h2>
          <p className="page-sub">{d.type} · Started {formatDateTime(d.startTime)}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/disasters')}>← Back</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="card-title">Incident Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              ['Status', <StatusBadge status={d.status} />],
              ['Type', d.type],
              ['Severity', <span style={{ color: d.severity >= 80 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>{d.severity}/100</span>],
              ['Coordinates', d.latitude != null ? `${d.latitude}, ${d.longitude}` : '—'],
              ['Started', formatDateTime(d.startTime)],
              ['Created by', d.createdByName || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {d.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.description}</p>}
          </div>
        </div>

        {hasRole('OFFICER', 'ADMIN') && (
          <div className="card">
            <p className="card-title">Update Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {STATUSES.map(s => (
                <button key={s} type="button" disabled={updating}
                  className={`btn ${s === d.status ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => handleStatusUpdate(s)}>
                  {s === d.status ? '● ' : '○ '}{s}{s === 'CLOSED' ? ' 📦 (Archive)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="card-title" style={{ marginBottom: 12 }}>Affected Locations</p>
        {locLoading ? <LoadingSpinner message="Loading locations…" /> : (
          <DataTable
            columns={locationColumns}
            data={(locations || []).map(l => ({ ...l, id: l.locationId }))}
            emptyMessage="No locations registered for this disaster."
          />
        )}
      </div>

      <div className="card">
        <p className="card-title" style={{ marginBottom: 12 }}>Linked Records</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/locations')}>View Locations</button>
          <button className="btn btn-secondary" onClick={() => navigate('/requests')}>View Requests</button>
          <button className="btn btn-secondary" onClick={() => navigate('/allocation')}>View Allocations</button>
        </div>
      </div>
    </PageWrapper>
  );
}
