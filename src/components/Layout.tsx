import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Moon, Sun, Menu, X, LayoutDashboard, 
  Users, Clock, FileText, Settings, Database, BookOpen, 
  UserPlus, ClipboardCheck, Atom, Dna, Activity, UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import NotificationsCenter from './NotificationsCenter';
import GlobalSearch from './GlobalSearch';

// --- مكون الترحيب المطور (Welcome Overlay) ---
function WelcomeOverlay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!user || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050b14]/80"
        dir="rtl"
      >
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] right-[25%] w-[400px] h-[400px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px]" />
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-lg p-[1px] rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent shadow-2xl"
        >
          <div className="bg-[#0a1122]/90 backdrop-blur-3xl p-12 rounded-[3rem] text-center border border-white/10">
            <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute"><Atom className="w-24 h-24 text-blue-400/50" /></motion.div>
              <div className="bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl p-4 shadow-lg"><Dna className="w-8 h-8 text-white" /></div>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">
              مرحباً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.name}</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm tracking-widest uppercase mb-10 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" /> جاري مزامنة بيانات النظام
            </p>
            <div className="h-1.5 bg-white/5 rounded-full w-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5, ease: "easeInOut" }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'ar');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isDarkMode, language]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const handleLanguageToggle = () => { const newLang = language === 'ar' ? 'en' : 'ar'; setLanguage(newLang); localStorage.setItem('app_lang', newLang); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const translate = (key: string) => {
    const translations: Record<string, { ar: string, en: string }> = {
      'منصة SOP': { ar: 'منصة SOP', en: 'SOP Platform' },
      'الأساسية': { ar: 'الأساسية', en: 'Core' },
      'النظام': { ar: 'النظام', en: 'System' },
      'الإدارة': { ar: 'الإدارة', en: 'Management' },
      'التقارير': { ar: 'التقارير', en: 'Reports' },
      'لوحة القيادة': { ar: 'لوحة القيادة', en: 'Dashboard' },
      'إدارة الطلاب': { ar: 'إدارة الطلاب', en: 'Student Management' },
      'تسجيل طلاب جدد': { ar: 'تسجيل طلاب جدد', en: 'New Enrollment' },
      'الجداول': { ar: 'الجداول', en: 'Schedules' },
      'تسجيل الخروج': { ar: 'تسجيل الخروج', en: 'Logout' },
      'صحة النظام': { ar: 'صحة النظام', en: 'System Health' },
      'إدارة المستخدمين': { ar: 'إدارة المستخدمين', en: 'User Management' },
      'سجلات التدقيق': { ar: 'سجلات التدقيق', en: 'Audit Logs' },
      'النسخ الاحتياطي': { ar: 'النسخ الاحتياطي', en: 'Database Backup' },
      'أخرى': { ar: 'أخرى', en: 'Others' },
      'جداول المعلمين': { ar: 'جداول المعلمين', en: 'Teacher Schedules' },
      'السلوك والتقييم': { ar: 'السلوك والتقييم', en: 'Behavior & Assessment' },
      'سجل السلوك': { ar: 'سجل السلوك', en: 'Behavior Logs' },
      'الزيارات الصفية': { ar: 'الزيارات الصفية', en: 'Classroom Visits' },
      'المنهج': { ar: 'المنهج', en: 'Curriculum' },
      'متابعة المناهج': { ar: 'متابعة المناهج', en: 'Curriculum Tracking' },
      'الطلاب': { ar: 'الطلاب', en: 'Students' },
      'المعلم': { ar: 'المعلم', en: 'Teacher' },
      'تسجيل الحضور': { ar: 'تسجيل الحضور', en: 'Attendance' },
      'حضور المعلمين': { ar: 'حضور المعلمين', en: 'Teacher Attendance' },
      'خطة الدرس': { ar: 'خطة الدرس', en: 'Lesson Plan' }
    };
    return translations[key]?.[language as 'ar' | 'en'] || key;
  };

  const getNavigation = () => {
    const common = [{ name: 'لوحة القيادة', href: '/', icon: LayoutDashboard, section: 'الأساسية' }];
    switch (user?.role) {
      case 'DEVELOPER': return [...common, { name: 'صحة النظام', href: '/dev/health', icon: Settings, section: 'النظام' }, { name: 'إدارة المستخدمين', href: '/dev/users', icon: Users, section: 'النظام' }, { name: 'سجلات التدقيق', href: '/dev/audit', icon: FileText, section: 'النظام' }, { name: 'النسخ الاحتياطي', href: '/dev/backup', icon: Database, section: 'النظام' }];
      case 'ADMIN': return [...common, { name: 'إدارة الطلاب', href: '/admin/student-management', icon: Users, section: 'الإدارة' }, { name: 'تسجيل طلاب جدد', href: '/admin/students/enroll', icon: UserPlus, section: 'الإدارة' }, { name: 'الجداول', href: '/admin/schedules', icon: Clock, section: 'الإدارة' }, { name: 'التقارير', href: '/reports', icon: FileText, section: 'التقارير' }];
      case 'SUPERVISOR': return [...common, { name: 'جداول المعلمين', href: '/supervisor/teacher-schedules', icon: Clock, section: 'الجداول' }, { name: 'حضور المعلمين', href: '/supervisor/attendance', icon: UserCheck, section: 'المعلم' }, { name: 'إدارة الطلاب', href: '/supervisor/students', icon: Users, section: 'الطلاب' }, { name: 'سجل السلوك', href: '/supervisor/behavior', icon: FileText, section: 'السلوك والتقييم' }, { name: 'الزيارات الصفية', href: '/supervisor/visits', icon: ClipboardCheck, section: 'السلوك والتقييم' }, { name: 'متابعة المناهج', href: '/supervisor/curriculum', icon: BookOpen, section: 'المنهج' }];
      case 'TEACHER': return [...common, { name: 'تسجيل الحضور', href: '/teacher/status', icon: UserCheck, section: 'المعلم' }, { name: 'الجداول', href: '/teacher/schedule', icon: Clock, section: 'المعلم' }, { name: 'سجل السلوك', href: '/teacher/behavior', icon: Users, section: 'المعلم' }, { name: 'الزيارات الصفية', href: '/teacher/visits', icon: ClipboardCheck, section: 'المعلم' }, { name: 'خطة الدرس', href: '/teacher/lesson', icon: BookOpen, section: 'المعلم' }];
      default: return common;
    }
  };

  const navigation = getNavigation();
  const groupedNav: Record<string, any[]> = {};
  navigation.forEach(item => { const sec = item.section || 'أخرى'; if (!groupedNav[sec]) groupedNav[sec] = []; groupedNav[sec].push(item); });

  return (
    <div className="min-h-screen p-4 gap-4 flex overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <WelcomeOverlay />
      
      {/* Sidebar: تصميم زجاجي شفاف */}
      <aside className={cn(
        "fixed inset-y-0 z-50 w-68 p-4 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between shrink-0 rounded-3xl border border-white/20 backdrop-blur-2xl floating-card",
        isSidebarOpen ? "translate-x-0" : language === 'ar' ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="space-y-6">
          <div className="h-14 flex items-center justify-between px-2 border-b border-white/20 pb-4">
            <div className="flex items-center gap-3"><div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-md"><BookOpen className="w-5 h-5" /></div><span className="font-bold text-base tracking-wide text-gray-900 dark:text-white">{translate('منصة SOP')}</span></div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto space-y-6 pr-1 pl-1 max-h-[calc(100vh-220px)]">
            {Object.entries(groupedNav).map(([section, items]) => (
              <div key={section} className="space-y-1.5">
                <h3 className="px-3 text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-2">{translate(section)}</h3>
                {items.map((item) => (
                  <button key={item.name} onClick={() => { navigate(item.href); setIsSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 p-3 rounded-xl transition-all", location.pathname === item.href ? "bg-blue-600 text-white shadow-lg" : "hover:bg-white/40 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200")}>
                    <item.icon className="w-4 h-4" /><span className="text-sm">{translate(item.name)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-white/20">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-600 dark:text-red-400 hover:bg-white/40 dark:hover:bg-white/10 rounded-xl"><LogOut className="w-4 h-4" /><span className="text-sm">{translate('تسجيل الخروج')}</span></button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <header className="h-16 rounded-3xl flex items-center justify-between px-6 border border-white/20 backdrop-blur-2xl floating-card shadow-lg">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationsCenter />
            <button onClick={handleLanguageToggle} className="text-xs font-bold text-gray-700 dark:text-gray-200">{language === 'ar' ? 'EN' : 'AR'}</button>
            <button onClick={toggleDarkMode} className="text-gray-700 dark:text-gray-200">{isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
          </div>
        </header>
        <main className="flex-1 rounded-3xl p-6 overflow-y-auto border border-white/20 backdrop-blur-2xl floating-card shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}