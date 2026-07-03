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
  Menu, GraduationCap
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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // مراقبة حجم الشاشة لضبط القائمة تلقائياً
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة في وضع الموبايل
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
        { path: '/teacher/schedule', icon: Clock, label: t('my_schedule') },
        { path: '/teacher/attendance', icon: ClipboardCheck, label: t('absences_attendance') },
        { path: '/teacher/behavior', icon: UserCheck, label: t('behavior_discipline') },
        { path: '/teacher/lesson', icon: BookOpen, label: t('curriculum_tracking') },
        { path: '/teacher/visits', icon: Eye, label: t('my_visits') },
      ]
    };

    return roleLinks[role] || baseLinks;
  };

  const navLinks = getNavigationLinks();

  return (
    <div className="relative flex h-screen overflow-hidden font-sans bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
      
      {/* الخلفية */}
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
        
        {/* طبقة التظليل للموبايل */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* القائمة الجانبية */}
        <aside 
          className={cn(
            "fixed inset-y-0 z-50 flex flex-col bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-x border-white/40 dark:border-slate-700/50 transition-transform duration-300 shadow-2xl",
            i18n.language === 'ar' ? "right-0" : "left-0",
            isSidebarOpen 
              ? "w-72 translate-x-0" 
              : (i18n.language === 'ar' ? "translate-x-full md:translate-x-0 md:w-20" : "-translate-x-full md:translate-x-0 md:w-20")
          )}
        >
          {/* ترويسة القائمة الجانبية - هنا تم الإصلاح الجذري للزر */}
          <div className="flex items-center justify-between w-full p-4 border-b border-white/30 dark:border-slate-700/50">
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className={cn("text-xl font-black text-gray-800 dark:text-white tracking-tight transition-opacity", !isSidebarOpen && "md:hidden")}>
                SOP <span className="text-blue-600 dark:text-blue-400">Hub</span>
              </h1>
            </div>
            
            {/* زر "الثلاث شُرط" لطي القائمة على الموبايل - أصبح واضحاً وظاهراً بقوة */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden flex items-center justify-center p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors z-[60]"
              aria-label="طي القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>

          </div>

          {/* روابط القائمة */}
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

          {/* زر تسجيل الخروج */}
          <div className="p-4 border-t border-white/30 dark:border-slate-700/50">
            <button onClick={handleLogout} className="flex items-center justify-center w-full gap-3 px-4 py-3.5 text-red-600 bg-red-50/50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 backdrop-blur-md rounded-2xl transition-all duration-300 font-bold border border-red-100 dark:border-red-500/20">
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>{t('logout')}</span>}
            </button>
          </div>
        </aside>

        {/* مساحة المحتوى الرئيسية */}
        <div className={cn("flex-1 flex flex-col transition-all duration-300 h-full", 
          isSidebarOpen ? (i18n.language === 'ar' ? "md:mr-72" : "md:ml-72") : (i18n.language === 'ar' ? "md:mr-20" : "md:ml-20")
        )}>
          
          <header className="sticky top-0 z-30 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-b border-white/30 dark:border-slate-700/50 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-500">
            <div className="flex items-center gap-4">
              {/* زر "الثلاث شُرط" لفتح القائمة (يظهر عندما تكون القائمة مغلقة) */}
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden flex items-center justify-center p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40 hover:bg-blue-700 active:scale-95 transition-all z-50"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block"><GlobalSearch /></div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={toggleLanguage} className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors shadow-sm" title="تغيير اللغة">
                <Languages className="w-5 h-5" />
              </button>
              
              <button onClick={toggleDarkMode} className="p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-slate-700/50 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors shadow-sm">
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>
              
              <NotificationsCenter />
              
              <div className="hidden md:flex items-center gap-3 px-4 border-x border-white/40 dark:border-slate-700/50 mx-2">
                <div className={`text-${i18n.language === 'ar' ? 'left' : 'right'}`}>
                  <p className="text-sm font-black text-gray-900 dark:text-white drop-shadow-sm">{user?.name}</p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{user?.role}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-white/20">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 relative bg-transparent">
            <div className="max-w-[100rem] mx-auto w-full pb-20">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}