import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(null);
  const [liveToast, setLiveToast] = useState(null);
  const eventSourceRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await notificationApi.list();
      setNotifications(list);
      const unreadCritical = list.find(
        n => !n.read && n.severity === 'CRITICAL' && n.type === 'CRITICAL_REQUEST'
      );
      if (unreadCritical) setCriticalAlert(unreadCritical);
    } catch {
      /* backend may be offline during dev */
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Setup Live SSE Stream
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const sseUrl = '/api/notifications/stream';
    let es;
    try {
      es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.addEventListener('CONNECTED', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Live stream established:', data.message);
        } catch {
          // ignore
        }
      });

      es.addEventListener('NOTIFICATION', (e) => {
        try {
          const notif = JSON.parse(e.data);
          setNotifications(prev => [notif, ...prev.filter(n => n.notificationId !== notif.notificationId)]);
          
          // Show live toast for high-priority or urgent events
          setLiveToast(notif);
          setTimeout(() => {
            setLiveToast(t => (t?.notificationId === notif.notificationId ? null : t));
          }, 6000);

          if (notif.severity === 'CRITICAL') {
            setCriticalAlert(notif);
          }
          window.dispatchEvent(new CustomEvent('drro-live-event', { detail: { type: 'NOTIFICATION', data: notif } }));
        } catch (err) {
          console.error('[SSE] Error parsing notification:', err);
        }
      });

      const handleLiveEvent = (eventName) => (e) => {
        try {
          const data = e.data ? JSON.parse(e.data) : {};
          console.log(`[SSE] Live event received: ${eventName}`, data);
          refresh();
          window.dispatchEvent(new CustomEvent('drro-live-event', { detail: { type: eventName, data } }));
        } catch (err) {
          console.error(`[SSE] Error processing ${eventName}:`, err);
        }
      };

      es.addEventListener('ALLOCATION_UPDATED', handleLiveEvent('ALLOCATION_UPDATED'));
      es.addEventListener('ALLOCATION_DECIDED', handleLiveEvent('ALLOCATION_DECIDED'));
      es.addEventListener('DISPATCH_UPDATED', handleLiveEvent('DISPATCH_UPDATED'));
      es.addEventListener('DELIVERY_COMPLETED', handleLiveEvent('DELIVERY_COMPLETED'));

      es.onerror = () => {
        // EventSource automatically retries connection
        console.debug('[SSE] Stream reconnecting...');
      };
    } catch (err) {
      console.warn('[SSE] Could not initialize EventSource:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [user, refresh]);

  const dismissCritical = async (n) => {
    if (n?.notificationId) await notificationApi.markRead(n.notificationId);
    setCriticalAlert(null);
    refresh();
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    refresh();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, refresh, markAllRead, criticalAlert, dismissCritical, liveToast, setLiveToast
    }}>
      {children}
      {/* Live Push Notification Toast */}
      {liveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: liveToast.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--bg-card)',
            color: liveToast.severity === 'CRITICAL' ? '#ffffff' : 'var(--text-primary)',
            padding: '14px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            border: liveToast.severity === 'CRITICAL' ? 'none' : '1px solid var(--border-subtle)',
            maxWidth: '380px',
            animation: 'fadeInUp 0.3s ease-out',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '1.4rem' }}>
            {liveToast.severity === 'CRITICAL' ? '🚨' : '🔔'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{liveToast.title}</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>{liveToast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1rem',
              opacity: 0.7,
              padding: 0,
              marginLeft: '6px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

