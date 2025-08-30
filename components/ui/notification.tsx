'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { Notification, NotificationType } from '@/hooks/useNotification';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border shadow-lg max-w-md transition-all duration-300 ease-in-out",
      getBackgroundColor(notification.type)
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium text-sm", getTextColor(notification.type))}>
            {notification.title}
          </h4>
          
          {notification.message && (
            <p className={cn("text-sm mt-1 opacity-90", getTextColor(notification.type))}>
              {notification.message}
            </p>
          )}
          
          {notification.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={notification.action.onClick}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(notification.id)}
            className="h-6 w-6 p-0 hover:bg-black/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-h-screen overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}