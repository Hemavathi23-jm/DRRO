import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificationApi } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [criticalAlert, setCriticalAlert] = useState(null);

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

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

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
      notifications, unreadCount, refresh, markAllRead, criticalAlert, dismissCritical,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
