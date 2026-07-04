import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Info, Calendar, BookOpen, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/auth-context';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_role: string;
}

export default function NotificationsCenter() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user?.id) return;

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);

          toast.success(newNotification.title, {
            icon: '🔔',
            style: { borderRadius: '9999px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
        
      setNotifications([]); // إخفاء كل الإشعارات فوراً من الشاشة
    } catch {
      console.error('Failed to mark read');
    }
  };

  // الدالة الجديدة: إخفاء الإشعار بمجرد الضغط عليه
  const handleNotificationClick = async (id: number) => {
    // إخفاء فوري من الواجهة
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // التحديث في قاعدة البيانات
    if (user?.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (error) {
        console.error('Failed to hide notification');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'behavior': return <Info className="w-5 h-5 text-red-500" />;
      case 'curriculum': return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'evaluation': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'system': return <Calendar className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
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
            : "bg-white/40 dark:bg-black/30 text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-black/50",
          isAnimating && "animate-bounce"
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
          // التعديل هنا: عكسنا الاتجاه ليكون صحيحاً (left-0 للعربي، right-0 للإنجليزي) وأضفنا حماية الشاشات الصغيرة
          direction === 'rtl' ? "left-0 origin-top-left" : "right-0 origin-top-right",
          "max-w-[calc(100vw-2rem)] sm:max-w-md"
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
                    onClick={() => handleNotificationClick(notification.id)} // تفعيل الإخفاء عند الضغط
                    className={cn(
                      "p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 flex items-start gap-4 cursor-pointer text-start", // text-start لضبط الاتجاه
                      !notification.is_read ? "bg-indigo-50/40 dark:bg-indigo-900/20" : ""
                    )}
                  >
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800 border border-white/50 dark:border-gray-700 flex items-center justify-center shadow-sm backdrop-blur-sm">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-black mb-1", !notification.is_read ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300")}>
                        {notification.title}
                      </p>
                      <p className={cn("text-xs leading-relaxed mb-1", !notification.is_read ? "font-bold text-gray-800 dark:text-gray-200" : "font-medium text-gray-600 dark:text-gray-400")}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 flex items-center gap-1">
                        {new Date(notification.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
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