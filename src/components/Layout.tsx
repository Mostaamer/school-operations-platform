import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  LogOut, Moon, Sun, LayoutDashboard, Languages,
  Users, Clock, FileText, Database, BookOpen,
  ClipboardCheck, TrendingUp, UserCheck, ShieldCheck, Eye,
  Menu, GraduationCap, ZoomIn, ZoomOut, RotateCcw,
  MessageSquareShare, Gamepad2
} from 'lucide-react';

import NotificationsCenter from './NotificationsCenter';
import GlobalSearch from './GlobalSearch';
import WelcomeOverlay from './WelcomeOverlay';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const [zoomLevel, setZoomLevel] = useState(1);
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationLinks = () => {
    const role = user?.role || '';
    const baseLinks = [{ path: '/', icon: LayoutDashboard, label: t('dashboard') }];

    const roleLinks: Record<string, any[]> = {
      ADMIN: [
        ...baseLinks,
        { path: '/admin/student-management', icon: Users, label: t('student_management') },
        { path: '/admin/students', icon: UserCheck, label: t('students_list') },
        { path: '/admin/schedules', icon: Clock, label: t('schedules') },
      ],
      DEVELOPER: [
        ...baseLinks,
        { path: '/dev/users', icon: ShieldCheck, label: t('permissions') },
        { path: '/dev/backup', icon: Database, label: t('backup') },
      ],
      SUPERVISOR: [
        ...baseLinks,
        { path: '/supervisor/teacher-schedules', icon: Clock, label: t('teacher_schedules') },
        { path: '/supervisor/teacher-attendance', icon: UserCheck, label: t('teacher_attendance') },
        { path: '/supervisor/visits', icon: ClipboardCheck, label: t('class_visits') },
        { path: '/supervisor/visits-list', icon: Eye, label: t('visit_reports') },
        { path: '/supervisor/behavior-dashboard', icon: TrendingUp, label: t('behavior_dashboard') },
        { path: '/supervisor/curriculum', icon: BookOpen, label: t('curriculum_tracking') },
        { path: '/reports', icon: FileText, label: t('comprehensive_reports') },
      ],
      TEACHER: [
        ...baseLinks,
        { path: '/teacher/status', icon: UserCheck, label: t('record_attendance') },
        { path: '/teacher/daily-post', icon: MessageSquareShare, label: 'المنشور اليومي' },
        { path: '/teacher/schedule', icon: Clock, label: t('my_schedule') },
        { path: '/teacher/attendance', icon: ClipboardCheck, label: t('absences_attendance') },
        { path: '/teacher/behavior', icon: UserCheck, label: t('behavior_discipline') },
        { path: '/teacher/lesson', icon: BookOpen, label: t('curriculum_tracking') },
        { path: '/teacher/visits', icon: Eye, label: t('my_visits') },
        // 🆕 تم إضافة النشاط التفاعلي هنا
        { path: '/teacher/activity', icon: Gamepad2, label: 'النشاط التفاعلي' },
      ]
    };

    return roleLinks[role] || baseLinks;
  };

  const navLinks = getNavigationLinks();

  return (
    <div className="relative flex h-screen w-full font-sans bg-gray-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img 
          src={isDarkMode ? "/2_2.jpg" : "/2_1.jpg"} 
          alt="Background" 
          className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out" 
        />
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/70 backdrop-blur-[4px] transition-colors duration-500" />
      </div>

      <WelcomeOverlay />

      <div className="relative z-10 flex w-full h-full" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside 
          className={cn(
            "fixed inset-y-0 z-50 flex flex-col bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-x border-white/40 dark:border-slate-700/50 transition-transform duration-300 shadow-2xl",
            i18n.language === 'ar' ? "right-0" : "left-0",
            isSidebarOpen 
              ? "w-[85%] sm:w-72 translate-x-0" 
              : (i18n.language === 'ar' ? "translate-x-full md:translate-x-0 md:w-20" : "-translate-x-full md:translate-x-0 md:w-20")
          )}
        >
          <div className="flex items-center justify-between w-full p-4 border-b border-white/30 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className={cn("text-xl font-black text-gray-800 dark:text-white tracking-tight transition-opacity", !isSidebarOpen && "md:hidden")}>
                SOP <span className="text-blue-600 dark:text-blue-400">Hub</span>
              </h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="flex items-center justify-center p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors z-[60]"
              aria-label="إغلاق القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden", isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400")} title={!isSidebarOpen ? link.label : ""}>
                  <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive && "animate-pulse")} />
                  {isSidebarOpen && <span className="font-bold text-sm tracking-wide whitespace-nowrap z-10">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/30 dark:border-slate-700/50">
            <button onClick={handleLogout} className="flex items-center justify-center w-full gap-3 px-4 py-3.5 text-red-600 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 backdrop-blur-md rounded-2xl transition-all duration-300 font-bold border border-red-100 dark:border-red-500/20">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{t('logout')}</span>}
            </button>
          </div>
        </aside>

        <div className={cn("flex-1 flex flex-col transition-all duration-300 h-full w-full", 
          isSidebarOpen ? (i18n.language === 'ar' ? "md:mr-72" : "md:ml-72") : (i18n.language === 'ar' ? "md:mr-20" : "md:ml-20")
        )}>
          
          <header className="flex-shrink-0 z-30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-white/30 dark:border-slate-700/50 px-3 md:px-6 py-3 flex items-center justify-between shadow-sm transition-colors duration-500 flex-wrap gap-y-2">
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="flex items-center justify-center p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all z-50 flex-shrink-0"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="hidden lg:block flex-shrink-0"><GlobalSearch /></div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3 flex-wrap justify-end flex-1">
              
              <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-xl p-1 shadow-sm flex-shrink-0">
                <button onClick={handleZoomOut} className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 rounded-lg transition-colors" title="تصغير الشاشة">
                  <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button onClick={handleZoomReset} className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 rounded-lg transition-colors" title="استعادة الحجم الأصلي">
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button onClick={handleZoomIn} className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 rounded-lg transition-colors" title="تكبير الشاشة">
                  <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <button onClick={toggleLanguage} className="p-2 md:p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors shadow-sm flex-shrink-0" title="تغيير اللغة">
                <Languages className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <button onClick={toggleDarkMode} className="p-2 md:p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors shadow-sm flex-shrink-0">
                {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />}
              </button>
              
              <div className="relative flex-shrink-0 z-[60]">
                <NotificationsCenter />
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 border-x border-white/40 dark:border-slate-700/50 flex-shrink-0">
                <div className={`hidden sm:block text-${i18n.language === 'ar' ? 'left' : 'right'}`}>
                  <p className="text-sm font-black text-gray-900 dark:text-white drop-shadow-sm truncate max-w-[100px]">{user?.name}</p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{user?.role}</p>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm md:text-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-white/20 flex-shrink-0">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-auto p-3 md:p-6 relative bg-transparent w-full custom-scrollbar">
            
            <div 
              className="w-full pb-20 transition-transform duration-300"
              style={{ 
                transform: `scale(${zoomLevel})`,
                transformOrigin: i18n.language === 'ar' ? 'top right' : 'top left',
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`
              }}
            >
              <div className="mx-auto w-full max-w-[1400px] transition-all duration-300">
                <Outlet />
              </div>
            </div>
            
          </main>
        </div>
      </div>
    </div>
  );
}