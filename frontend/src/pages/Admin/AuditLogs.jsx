import { useState, useMemo } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icon from '../../components/common/Icon';
import { useAsyncData } from '../../hooks/useAsyncData';
import { auditLogApi } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const ACTION_CATEGORIES = ['ALL', 'ALLOCATION', 'DISASTER', 'INVENTORY', 'USER'];

export default function AuditLogs() {
  const { data: logs, loading, error, refetch } = useAsyncData(() => auditLogApi.list(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchCategory =
        category === 'ALL' ||
        (log.action && log.action.toUpperCase().includes(category)) ||
        (log.entity && log.entity.toUpperCase().includes(category));

      const matchSearch =
        !searchTerm ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.oldValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.newValue?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [logs, category, searchTerm]);

  const getActionBadgeColor = (action) => {
    if (!action) return 'var(--text-muted)';
    const a = action.toUpperCase();
    if (a.includes('APPROVED') || a.includes('ACTIVATE') || a.includes('DELIVERED')) return 'var(--success)';
    if (a.includes('REJECTED') || a.includes('DELETE') || a.includes('FAILED')) return 'var(--danger)';
    if (a.includes('CREATED') || a.includes('INGEST')) return 'var(--primary)';
    if (a.includes('MODIFIED') || a.includes('UPDATE')) return 'var(--warning)';
    return 'var(--secondary)';
  };

  return (
    <PageWrapper>
      <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>System Audit Trails</h2>
          <p className="text-muted">Immutable chronological logs of operational and officer decisions</p>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={refetch}>
          <Icon name="refresh" size={14} /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACTION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ minWidth: 260, flex: 1, maxWidth: 400 }}>
            <input
              type="search"
              placeholder="Search by action, user, or entity details…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading audit logs…" />
      ) : error ? (
        <div className="empty-state">
          <p>Failed to load audit logs. {error}</p>
          <button className="btn btn-primary mt-2" type="button" onClick={refetch}>Try Again</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details & Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No matching audit records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badgeColor = getActionBadgeColor(log.action);
                    return (
                      <tr key={log.logId}>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{log.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {log.userRole || 'SYSTEM'}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: `${badgeColor}1a`,
                              color: badgeColor,
                              border: `1px solid ${badgeColor}33`,
                            }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.entity}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          #{log.entityId || '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', maxWidth: 320 }}>
                          {log.oldValue && (
                            <div style={{ color: 'var(--danger)', marginBottom: 2 }}>
                              <strong>Prev:</strong> {log.oldValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div style={{ color: 'var(--success)' }}>
                              <strong>New:</strong> {log.newValue}
                            </div>
                          )}
                          {!log.oldValue && !log.newValue && <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
