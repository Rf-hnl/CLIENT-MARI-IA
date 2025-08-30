'use client';

import { useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'success', title, message });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'error', title, message, duration: 7000 });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAll
  };
}