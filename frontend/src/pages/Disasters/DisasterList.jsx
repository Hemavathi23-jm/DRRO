import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAsyncData } from '../../hooks/useAsyncData';
import { disasterApi, externalDataApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function DisasterList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('ACTIVE'); // 'ACTIVE' (operational) | 'ARCHIVES' (closed) | 'ALL'
  const [subFilter, setSubFilter] = useState('ALL');
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const { data: scrapeStatus } = useAsyncData(() => externalDataApi.status(), []);
  const { data, loading, error, refetch } = useAsyncData(() => disasterApi.list(), []);

  const handleWebFetch = async () => {
    setFetching(true);
    setFetchMessage('');
    try {
      const result = await externalDataApi.fetch();
      const created = result.recordsCreated ?? 0;
      const updated = result.recordsUpdated ?? 0;
      setFetchMessage(`Synced from web feeds: ${created} new, ${updated} updated.`);
      refetch();
    } catch (e) {
      setFetchMessage(e.response?.data?.message || e.message || 'Web fetch failed.');
    } finally {
      setFetching(false);
    }
  };

  const handleArchive = async (e, d) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Close and archive "${d.title}"?`)) return;
    try {
      await disasterApi.update(d.disasterId, {
        title: d.title,
        type: d.type,
        severity: d.severity,
        startTime: d.startTime,
        endTime: new Date().toISOString(),
        latitude: d.latitude,
        longitude: d.longitude,
        description: d.description,
        status: 'CLOSED',
      });
      refetch();
    } catch {
      alert('Failed to archive disaster.');
    }
  };

  const handleRestore = async (e, d) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await disasterApi.update(d.disasterId, {
        title: d.title,
        type: d.type,
        severity: d.severity,
        startTime: d.startTime,
        endTime: null,
        latitude: d.latitude,
        longitude: d.longitude,
        description: d.description,
        status: 'ACTIVE',
      });
      refetch();
    } catch {
      alert('Failed to restore disaster.');
    }
  };

  const handleDeletePermanent = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this archived record? This action cannot be undone.')) return;
    try {
      await disasterApi.delete(id);
      refetch();
    } catch {
      alert('Failed to delete disaster record.');
    }
  };

  if (loading) return <PageWrapper><LoadingSpinner message="Loading disasters…" /></PageWrapper>;
  if (error) return (
    <PageWrapper>
      <div className="empty-state">
        <p>Unable to load disasters. {error}</p>
        <button className="btn btn-primary mt-2" onClick={refetch}>Try again</button>
      </div>
    </PageWrapper>
  );

  const allDisasters = data || [];
  const activeDisasters = allDisasters.filter(d => d.status !== 'CLOSED');
  const archivedDisasters = allDisasters.filter(d => d.status === 'CLOSED');

  let displayList = tab === 'ARCHIVES' ? archivedDisasters : tab === 'ACTIVE' ? activeDisasters : allDisasters;
  if (subFilter !== 'ALL') {
    displayList = displayList.filter(d => d.status === subFilter);
  }

  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div>
          <h2 className="page-title">Disasters Command</h2>
          <p className="page-sub">
            {activeDisasters.length} active incidents · <span style={{ color: 'var(--text-muted)' }}>{archivedDisasters.length} in archives</span>
          </p>
          {scrapeStatus?.fetchedAt && (
            <p className="text-muted" style={{ fontSize: '0.786rem', marginTop: 4 }}>
              Last web sync: {formatDateTime(scrapeStatus.fetchedAt)}
              {scrapeStatus.status ? ` · ${scrapeStatus.status}` : ''}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasRole('OFFICER', 'ADMIN') && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleWebFetch}
                disabled={fetching}
                type="button"
              >
                {fetching ? 'Fetching…' : '🌐 Fetch from Web'}
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/disasters/create')} type="button">
                + Report Disaster
              </button>
            </>
          )}
        </div>
      </div>

      {fetchMessage && (
        <div className="card" style={{ marginBottom: 12, fontSize: '0.857rem' }}>
          {fetchMessage}
        </div>
      )}

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          className={`btn ${tab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('ACTIVE'); setSubFilter('ALL'); }}
        >
          🚨 Active Incidents ({activeDisasters.length})
        </button>
        <button
          type="button"
          className={`btn ${tab === 'ARCHIVES' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('ARCHIVES'); setSubFilter('ALL'); }}
        >
          📦 Archives ({archivedDisasters.length})
        </button>
        <button
          type="button"
          className={`btn ${tab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setTab('ALL'); setSubFilter('ALL'); }}
        >
          All Records ({allDisasters.length})
        </button>
      </div>

      {tab === 'ACTIVE' && (
        <div className="filter-bar">
          {['ALL', 'ACTIVE', 'CONTAINED', 'RECOVERING'].map(s => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${subFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubFilter(s)}
            >
              {s === 'ALL' ? 'All Active' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="empty-state card">
          <p style={{ fontWeight: 600 }}>
            {tab === 'ARCHIVES' ? 'No archived disasters.' : 'No active disasters found.'}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {tab === 'ARCHIVES'
              ? 'When a disaster is closed, it is automatically preserved here in the archives.'
              : 'All reported incidents are either contained or archived.'}
          </p>
          {hasRole('OFFICER', 'ADMIN') && tab === 'ACTIVE' && (
            <button className="btn btn-secondary mt-2" onClick={handleWebFetch} disabled={fetching} type="button">
              🌐 Fetch Latest from Web Feeds
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayList.map(d => (
            <div key={d.disasterId} className="card" style={{ transition: 'box-shadow var(--transition)' }}>
              <div className="flex-between">
                <Link to={`/disasters/${d.disasterId}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.title}</div>
                    <div className="text-muted" style={{ marginTop: 2, fontSize: '0.8rem' }}>
                      {d.type} · Started {formatDateTime(d.startTime)}
                      {d.externalSource && (
                        <span className="role-badge" style={{ marginLeft: 8 }}>{d.externalSource}</span>
                      )}
                    </div>
                  </div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: d.severity >= 80 ? 'var(--danger)' : d.severity >= 60 ? 'var(--warning)' : 'var(--success)' }}>
                      {d.severity}/100
                    </div>
                  </div>
                  <StatusBadge status={d.status} />

                  {/* Actions */}
                  {hasRole('OFFICER', 'ADMIN') && d.status !== 'CLOSED' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                      title="Close incident and move to archives"
                      onClick={(e) => handleArchive(e, d)}
                    >
                      📦 Close & Archive
                    </button>
                  )}

                  {hasRole('OFFICER', 'ADMIN') && d.status === 'CLOSED' && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                        onClick={(e) => handleRestore(e, d)}
                      >
                        🔄 Restore
                      </button>
                      {hasRole('ADMIN') && (
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          onClick={(e) => handleDeletePermanent(e, d.disasterId)}
                        >
                          🗑️ Purge
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {d.description && <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{d.description}</p>}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
