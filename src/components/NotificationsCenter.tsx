import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Info, Calendar, BookOpen, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export default function NotificationsCenter() {
  const { t, i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return; // Prevent breaking if API is not ready
      const data = await res.json();
      setNotifications(data);
    } catch {
      console.warn('Notifications API not ready yet.');
    }
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev]);
        toast(data.message, { icon: '🔔', style: { borderRadius: '9999px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' } });
      } catch (err) {
        // ignore
      }
    };

    eventSource.onerror = () => {
      eventSource.close(); // Stop spamming console on 404
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch {
      console.error('Failed to mark read');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SCHEDULE_UPDATE': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'CURRICULUM_UPDATE': return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'NEW_RESOURCE': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'NEW_HOMEWORK': return <FileText className="w-5 h-5 text-brand-light" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef} dir={direction}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md border border-white/30 shadow-sm",
          isOpen 
            ? "bg-white/80 dark:bg-gray-800/80 text-indigo-600 dark:text-indigo-400 shadow-md" 
            : "bg-white/40 dark:bg-black/30 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-black/50"
        )}
        aria-label={t('notifications_center')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white/50 rounded-full shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute mt-3 w-80 sm:w-96 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/40 dark:border-gray-700/50 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] z-50 overflow-hidden transform opacity-100 scale-100 transition-all",
          direction === 'rtl' ? "right-0 origin-top-right" : "left-0 origin-top-left"
        )}>
          <div className="p-5 border-b border-white/20 dark:border-gray-700/30 flex items-center justify-between bg-white/30 dark:bg-gray-800/30">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('notifications_center')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50/50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {t('mark_all_read')}
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-gray-800/50 flex items-center justify-center mb-3 shadow-inner">
                  <Bell className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">{t('no_notifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/20 dark:divide-gray-800/50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 flex gap-4 cursor-pointer",
                      !notification.read ? "bg-indigo-50/40 dark:bg-indigo-900/20" : ""
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800 border border-white/50 dark:border-gray-700 flex items-center justify-center shadow-sm backdrop-blur-sm">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm mb-1 leading-relaxed", !notification.read ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-600 dark:text-gray-400")}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        {new Date(notification.timestamp).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/20 dark:border-gray-700/30 text-center bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 transition-colors cursor-pointer">
            <button className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t('view_all_notifications')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}