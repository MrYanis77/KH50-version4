import { useState, useEffect } from 'react';
import { directusAuth } from '@/integration/directus';
import { readItems, updateItem, deleteItem } from '@directus/sdk';
import type { NotificationRow } from '@/integration/directus-types';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const result = await directusAuth.request(
        readItems('mmrl_notifications' as any, {
          filter: { destinataire_user_id: { _eq: user.id } },
          sort: ['-date_creation'],
          limit: 50
        })
      );
      const notifs = result as NotificationRow[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.lu).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling toutes les 30 secondes
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await directusAuth.request(updateItem('mmrl_notifications' as any, id, { lu: true }));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.lu).map(n => n.id);
      for (const id of unreadIds) {
        await directusAuth.request(updateItem('mmrl_notifications' as any, id, { lu: true }));
      }
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await directusAuth.request(deleteItem('mmrl_notifications' as any, id));
      setNotifications(prev => {
        const next = prev.filter(n => n.id !== id);
        setUnreadCount(next.filter(n => !n.lu).length);
        return next;
      });
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    try {
      for (const id of notifications.map(n => n.id)) {
        await directusAuth.request(deleteItem('mmrl_notifications' as any, id));
      }
      setNotifications([]);
      setUnreadCount(0);
      await fetchNotifications();
    } catch (err) {
      console.error('Error deleting all notifications', err);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh: fetchNotifications,
  };
}
