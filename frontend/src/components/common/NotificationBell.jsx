import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/formatters';

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn-icon" type="button" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        Alerts{unreadCount > 0 ? ` (${unreadCount})` : ''}
      </button>
      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel">
            <div className="flex-between" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <strong style={{ fontSize: '0.857rem' }}>Notifications</strong>
              {unreadCount > 0 && (
                <button className="btn btn-sm btn-secondary" type="button" onClick={markAllRead}>Mark all read</button>
              )}
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <p style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.857rem' }}>No notifications</p>
              ) : notifications.map(n => (
                <div key={n.notificationId} className={`notif-item${n.read ? '' : ' unread'}`}>
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
                  <div className="text-muted" style={{ marginTop: 4 }}>{formatDateTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
