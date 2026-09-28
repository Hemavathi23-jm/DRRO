import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import FilterBar from '../../components/common/FilterBar';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { disasterApi, externalDataApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/common/Icon';

const FILTER_DEFAULTS = { tab: 'ACTIVE', status: 'ALL', q: '' };

export default function DisasterList() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { values, setValue, setMany, clearAll } = useUrlFilters(FILTER_DEFAULTS);
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [confirm, setConfirm] = useState(null);
  const { data: scrapeStatus, refetch: refetchStatus } = useAsyncData(
    () => externalDataApi.status(),
    [],
    { pollIntervalMs: 30000 },
  );
  const { data, loading, error, refetch } = useAsyncData(
    () => disasterApi.list(),
    [],
    { pollIntervalMs: 30000 },
  );

  const intervalMinutes = scrapeStatus?.fetchIntervalMs
    ? Math.max(1, Math.round(scrapeStatus.fetchIntervalMs / 60000))
    : 5;

  const handleWebFetch = async () => {
    setFetching(true);
    setFetchMessage('');
    try {
      const result = await externalDataApi.fetch();
      const created = result.recordsCreated ?? 0;
      const updated = result.recordsUpdated ?? 0;
      const sources = Array.isArray(result.sources) ? result.sources : [];
      const sourceSummary = sources
        .map((s) => `${s.source}: ${s.status === 'SUCCESS' ? `${s.recordsFound ?? 0} found` : 'failed'}`)
        .join(' · ');
      const msg = `Synced from live web feeds: ${created} new, ${updated} updated${sourceSummary ? ` (${sourceSummary})` : ''}.`;
      setFetchMessage(msg);
      toast.success(`Live sync complete · ${created} new · ${updated} updated`);
      refetch();
      refetchStatus();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Web fetch failed.';
      setFetchMessage(msg);
      toast.error(msg);
    } finally {
      setFetching(false);
    }
  };

  const runArchive = async (d) => {
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
      toast.success(`Archived “${d.title}”.`);
      refetch();
    } catch {
      toast.error('Failed to archive disaster.');
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
      toast.success(`Restored “${d.title}”.`);
      refetch();
    } catch {
      toast.error('Failed to restore disaster.');
    }
  };

  const runDelete = async (id) => {
    try {
      await disasterApi.delete(id);
      toast.success('Disaster record permanently deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete disaster record.');
    }
  };

  const allDisasters = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const activeDisasters = useMemo(
    () => allDisasters.filter((d) => d.status !== 'CLOSED'),
    [allDisasters],
  );
  const archivedDisasters = useMemo(
    () => allDisasters.filter((d) => d.status === 'CLOSED'),
    [allDisasters],
  );

  const displayList = useMemo(() => {
    const currentTab = values.tab || 'ACTIVE';
    let list = currentTab === 'ARCHIVES'
      ? archivedDisasters
      : currentTab === 'ACTIVE'
        ? activeDisasters
        : allDisasters;
    if (values.status !== 'ALL') list = list.filter((d) => d.status === values.status);
    const q = (values.q || '').trim().toLowerCase();
    if (q) {
      list = list.filter((d) =>
        [d.title, d.type, d.status, d.description, d.externalSource]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [allDisasters, activeDisasters, archivedDisasters, values]);

  const tab = values.tab || 'ACTIVE';

  if (loading) return <PageWrapper><LoadingSpinner message="Loading disasters…" /></PageWrapper>;
  if (error) {
    return (
      <PageWrapper>
        <EmptyState
          title="Unable to load disasters"
          description={String(error)}
          action={<button className="btn btn-primary" type="button" onClick={refetch}>Try again</button>}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Disasters"
        subtitle={`${activeDisasters.length} active · ${archivedDisasters.length} archived · live web feeds`}
        actions={
          hasRole('OFFICER', 'ADMIN') && (
            <>
              <button className="btn btn-secondary" onClick={handleWebFetch} disabled={fetching} type="button">
                {fetching ? 'Fetching live data…' : 'Fetch from web'}
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/disasters/create')} type="button">
                Report disaster
              </button>
            </>
          )
        }
      >
        {scrapeStatus?.fetchedAt && (
          <p className="text-muted" style={{ fontSize: '0.786rem', marginTop: 4 }}>
            Last web sync: {formatDateTime(scrapeStatus.fetchedAt)}
            {scrapeStatus.status ? ` · ${scrapeStatus.status}` : ''}
            {scrapeStatus.autoFetchEnabled !== false
              ? ` · auto every ${intervalMinutes} min`
              : ' · auto-fetch off'}
            {scrapeStatus.running ? ' · syncing…' : ''}
          </p>
        )}
      </PageHeader>

      <aside className="info-callout" role="note">
        <div className="info-callout-icon" aria-hidden>
          <Icon name="globe" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="info-callout-title">Live disaster feeds</p>
          <p className="info-callout-body">
            DRRO continuously pulls open verified data from GDACS, USGS earthquakes, NASA EONET,
            and OpenStreetMap (India &amp; Nepal focus) every {intervalMinutes} minutes.
            Use <strong>Sync now</strong> for an immediate refresh — the list also auto-updates.
          </p>
          {Array.isArray(scrapeStatus?.sources) && scrapeStatus.sources.length > 0 && (
            <div className="feed-source-row">
              {scrapeStatus.sources
                .filter((s) => s.source !== 'RELIEFWEB')
                .map((s) => (
                  <span
                    key={s.source}
                    className={`feed-source-chip${s.status === 'SUCCESS' ? ' is-ok' : s.status === 'FAILED' ? ' is-bad' : ''}`}
                  >
                    {String(s.source).replace(/_/g, ' ')}
                    {s.status === 'SUCCESS' ? ` · ${s.recordsFound ?? 0}` : s.status === 'FAILED' ? ' · error' : ''}
                  </span>
                ))}
            </div>
          )}
        </div>
        {hasRole('OFFICER', 'ADMIN') && (
          <button className="btn btn-primary btn-sm" type="button" onClick={handleWebFetch} disabled={fetching}>
            {fetching ? 'Syncing…' : 'Sync now'}
          </button>
        )}
      </aside>

      {fetchMessage && (
        <div className="status-banner status-banner--success" role="status">
          {fetchMessage}
        </div>
      )}

      <FilterBar
        values={values}
        onChange={(key, value) => {
          if (key === 'tab') setMany({ tab: value, status: 'ALL' });
          else setValue(key, value);
        }}
        onClear={clearAll}
        resultCount={displayList.length}
        filters={[
          {
            key: 'tab',
            label: 'View',
            type: 'chips',
            options: [
              { value: 'ACTIVE', label: `Active (${activeDisasters.length})` },
              { value: 'ARCHIVES', label: `Archives (${archivedDisasters.length})` },
              { value: 'ALL', label: `All (${allDisasters.length})` },
            ],
          },
          ...(tab === 'ACTIVE'
            ? [{ key: 'status', label: 'Status', type: 'chips', options: ['ALL', 'ACTIVE', 'CONTAINED', 'RECOVERING'] }]
            : []),
          { key: 'q', label: 'Search', type: 'search', placeholder: 'Search title, type, source…' },
        ]}
      />

      {displayList.length === 0 ? (
        <EmptyState
          title={tab === 'ARCHIVES' ? 'No archived disasters' : 'No active disasters'}
          description={
            tab === 'ARCHIVES'
              ? 'Closed incidents are preserved here automatically.'
              : 'Report a new incident or sync from web feeds.'
          }
          action={
            hasRole('OFFICER', 'ADMIN') && tab === 'ACTIVE' ? (
              <button className="btn btn-secondary" onClick={handleWebFetch} disabled={fetching} type="button">
                Fetch latest from web feeds
              </button>
            ) : null
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayList.map((d) => (
            <div key={d.disasterId} className="card">
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: d.severity >= 80 ? 'var(--danger)' : d.severity >= 60 ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      {d.severity}/100
                    </div>
                  </div>
                  <StatusBadge status={d.status} />

                  {hasRole('OFFICER', 'ADMIN') && d.status !== 'CLOSED' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirm({
                          type: 'archive',
                          title: 'Close & archive',
                          message: `Close and archive “${d.title}”? It will move to archives.`,
                          confirmLabel: 'Archive',
                          confirmClass: 'btn btn-primary',
                          onConfirm: () => runArchive(d),
                        });
                      }}
                    >
                      Close & archive
                    </button>
                  )}

                  {hasRole('OFFICER', 'ADMIN') && d.status === 'CLOSED' && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={(e) => handleRestore(e, d)}
                      >
                        Restore
                      </button>
                      {hasRole('ADMIN') && (
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirm({
                              type: 'delete',
                              title: 'Permanently delete',
                              message: 'This archived record will be permanently deleted. This cannot be undone.',
                              confirmLabel: 'Delete forever',
                              confirmClass: 'btn btn-danger',
                              onConfirm: () => runDelete(d.disasterId),
                            });
                          }}
                        >
                          Purge
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {d.description && (
                <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{d.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmClass={confirm.confirmClass}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const action = confirm.onConfirm;
            setConfirm(null);
            await action();
          }}
        />
      )}
    </PageWrapper>
  );
}
