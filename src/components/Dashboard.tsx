import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  GraduationCap, 
  CalendarDays, 
  BarChart3, 
  FileSpreadsheet,
  ShieldAlert,
  Activity,
  Database,
  Terminal,
  Settings,
  RotateCw,
  UserCheck,
  UserX,
  User,
  Clock,
  ClipboardCheck,
  BookOpen,
  Eye,
  TrendingUp,
  Sparkles,
  BellRing,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// استيراد المكونات الأساسية للسيستم
import TeacherManagement from './TeacherManagement';
import ClassroomTracking from './ClassroomTracking';
import SupervisorMonitoring from './SupervisorMonitoring';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function Dashboard() {
  const { user } = useAuth();
  const [teacherAttStatus, setTeacherAttStatus] = useState<string | null>(null);
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'ar');
  const [activeTab, setActiveTab] = useState('reports'); // الافتراضي تبويب التقارير

  // حالات خاصة ببيانات المطور
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [loadingDevUsers, setLoadingDevUsers] = useState(false);

  const [stats, setStats] = useState({
    teachersCount: 0,
    classesCount: 0,
    schedulesCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // جلب إحصائيات لوحة الأدمن
  useEffect(() => {
    async function fetchSchoolStats() {
      if (user?.role !== 'ADMIN') return;
      setLoadingStats(true);
      try {
        const { count: teachers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'TEACHER');

        const { count: classes } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        const { count: schedules } = await supabase
          .from('schedules')
          .select('*', { count: 'exact', head: true });

        setStats({
          teachersCount: teachers || 0,
          classesCount: classes || 0,
          schedulesCount: schedules || 0
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchSchoolStats();
  }, [user]);

  // جلب المستخدمين الحاليين في النظام لبيئة المطور
  useEffect(() => {
    async function fetchAllSystemUsers() {
      if (user?.role !== 'DEVELOPER') return;
      setLoadingDevUsers(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('id', { ascending: false });

        if (!error && data) {
          setDevUsers(data);
        }
      } catch (err) {
        console.error("Error fetching system users for developer:", err);
      } finally {
        setLoadingDevUsers(false);
      }
    }
    fetchAllSystemUsers();
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      setLanguage(localStorage.getItem('app_lang') || 'ar');
    };
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ar';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [language]);

  const translate = (key: string) => {
    const translations: Record<string, { ar: string, en: string }> = {
      'لوحة التحكم - وضع المطور': { ar: 'لوحة التحكم - وضع المطور', en: 'Control Panel - Developer Mode' },
      'لوحة إدارة المدرسة': { ar: 'لوحة إدارة المدرسة', en: 'School Management Dashboard' },
      'أهلاً أستاذ': { ar: 'أهلاً أستاذ', en: 'Welcome Teacher' },
      'تسجيل الحضور اليومي': { ar: 'تسجيل الحضور اليومي', en: 'Daily Attendance Registration' },
      'حاضر': { ar: 'حاضر', en: 'Present' },
      'غائب': { ar: 'غائب', en: 'Absent' },
      'لوحة مراقبة المشرف': { ar: 'لوحة مراقبة المشرف', en: 'Supervisor Monitoring Dashboard' },
      'التقارير': { ar: 'التقارير', en: 'Reports' },
      'الإحصائيات': { ar: 'الإحصائيات', en: 'Statistics' },
      'إحصائيات المنصة الحالية': { ar: 'إحصائيات المنصة الحالية', en: 'Current Platform Statistics' },
      'عدد المدرسين المسجلين': { ar: 'عدد المدرسين المسجلين', en: 'Registered Teachers' },
      'جاري تحميل البيانات...': { ar: 'جاري تحميل البيانات...', en: 'Loading data...' },
      'محتوى التقارير قيد التطوير...': { ar: 'محتوى التقارير قيد التطوير...', en: 'Reports content under development...' },
      'تم تسجيل الحضور': { ar: 'تم تسجيل الحضور', en: 'Attendance registered successfully' },
      'خطأ في تسجيل الحضور': { ar: 'خطأ في تسجيل الحضور', en: 'Error registering attendance' },
      'حالة الخوادم': { ar: 'حالة الخوادم والخدمات', en: 'Servers & Services Status' },
      'ممتاز': { ar: 'يعمل بكفاءة', en: 'Operational' },
      'تحديث الكاش': { ar: 'تحديث كاش النظام', en: 'Clear System Cache' },
      'تم تحديث الكاش بنجاح': { ar: 'تم تحديث كاش النظام بنجاح', en: 'System cache cleared successfully' },
      'المستخدمين الحاليين في النظام': { ar: 'المستخدمين الحاليين في النظام (مراقبة الحسابات)', en: 'Current System Users (Account Monitoring)' },
      'مفعل': { ar: 'مفعل', en: 'Active' },
      'غير مفعل': { ar: 'غير مفعل', en: 'Inactive' },
      // نصوص خاصة ببطاقات المعلم المحدثة
      'بوابة المعلم التفاعلية': { ar: 'بوابة المعلم التفاعلية ومتابعة المهام', en: 'Interactive Teacher Portal & Task Tracking' },
      'تنبيه سريع': { ar: 'تنبيه سريع:', en: 'Quick Notice:' },
      'يرجى التأكد من تحديث دفتر التحضير ورصد السلوك اليومي للطلاب بشكل دوري.': { ar: 'يرجى التأكد من تحديث دفتر التحضير ورصد السلوك اليومي للطلاب بشكل دوري.', en: 'Please ensure daily prep books and student behavior monitoring are updated regularly.' },
      'الوصول السريع لمهامي اليومية': { ar: 'الوصول السريع لمهامي اليومية', en: 'Quick Access to Daily Tasks' },
      'سجل الحضور': { ar: 'سجل الحضور', en: 'Attendance Log' },
      'إدارة حضور وغياب الطلاب اليومي': { ar: 'إدارة حضور وغياب الطلاب اليومي', en: 'Manage daily student attendance' },
      'الجدول الدراسي': { ar: 'الجدول الدراسي', en: 'My Schedule' },
      'عرض الحصص والمواعيد الخاصة بك': { ar: 'عرض الحصص والمواعيد الخاصة بك', en: 'View your classes and timetable' },
      'سلوك والانضباط': { ar: 'السلوك والانضباط', en: 'Behavior & Discipline' },
      'رصد السلوكيات والملاحظات السريعة': { ar: 'Track student behaviors and quick notes', en: 'Track student behaviors and quick notes' },
      'متابعة المناهج': { ar: 'متابعة المناهج', en: 'Curriculum Progress' },
      'تحديث نسب إنجاز المقررات الدراسية': { ar: 'Update completion percentage for subjects', en: 'Update completion percentage for subjects' },
      'تقارير الزيارات': { ar: 'تقارير الزيارات', en: 'Class Visits' },
      'عرض تقييمات المشرفين والملاحظات': { ar: 'View supervisor evaluations and notes', en: 'View supervisor evaluations and notes' },
      'الحالة اليومية': { ar: 'الحالة اليومية', en: 'Daily Status' },
      'تحديث حالة التواجد والنشاط': { ar: 'Update presence and activity status', en: 'Update presence and activity status' }
    };
    return translations[key]?.[language as 'ar' | 'en'] || key;
  };

  const handleTeacherAttendance = async (status: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('teacher_attendance')
      .upsert({ teacherId: user.id, date: today, status });
    
    if (!error) {
      setTeacherAttStatus(status);
      toast.success(translate('تم تسجيل الحضور'));
    } else {
      toast.error(translate('خطأ في تسجيل الحضور'));
    }
  };

  return (
    <div className="p-6 min-h-screen text-[var(--text-primary)] transition-colors duration-300">
      
      {/* 1. لوحة التحكم لوضع المطور (DEVELOPER) */}
      {user?.role === 'DEVELOPER' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-7 h-7 text-amber-500" />
                {translate('لوحة التحكم - وضع المطور')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {language === 'ar' ? 'أدوات الوصول المتقدمة، معالجة الصلاحيات ومراقبة أداء الخادم' : 'Advanced access tools, authority handling, and core services monitoring.'}
              </p>
            </div>
            
            <div>
              <button 
                onClick={() => toast.success(translate('تم تحديث الكاش بنجاح'))}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 text-[var(--text-primary)] shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {translate('تحديث الكاش')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{translate('حالة الخوادم')}</p>
                <h4 className="text-sm font-bold text-green-600 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {translate('ممتاز')}
                </h4>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{language === 'ar' ? 'قاعدة البيانات الحالية' : 'Main Database'}</p>
                <h4 className="text-sm font-bold text-blue-600 mt-0.5">Supabase Client Connected</h4>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{language === 'ar' ? 'بيئة التشغيل' : 'Environment Mode'}</p>
                <h4 className="text-sm font-bold text-amber-600 mt-0.5">Production Mode</h4>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-slate-800/60 pb-3">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold">{translate('المستخدمين الحاليين في النظام')}</h2>
            </div>
            
            {loadingDevUsers ? (
              <p className="text-center text-[var(--text-secondary)] py-8">{translate('جاري تحميل البيانات...')}</p>
            ) : devUsers.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-8">
                {language === 'ar' ? 'لا يوجد مستخدمين مسجلين حالياً.' : 'No registered users found.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {devUsers.map((sysUser) => {
                  const isActive = sysUser.status !== 'INACTIVE' && sysUser.is_active !== false;
                  
                  return (
                    <div 
                      key={sysUser.id} 
                      className="bg-[var(--bg-primary)] border border-gray-100 dark:border-slate-800/70 p-4 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="truncate max-w-[140px] sm:max-w-[180px]">
                            <h4 className="font-bold text-sm truncate">{sysUser.name || (language === 'ar' ? 'مستخدم بدون اسم' : 'Unnamed User')}</h4>
                            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{sysUser.email || sysUser.username || ''}</p>
                          </div>
                        </div>
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${
                          sysUser.role === 'ADMIN' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                          sysUser.role === 'DEVELOPER' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                          sysUser.role === 'SUPERVISOR' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' :
                          'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400'
                        }`}>
                          {sysUser.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800/50 mt-4 pt-3">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {language === 'ar' ? 'حالة الحساب' : 'Account Status'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isActive ? 'text-green-600' : 'text-red-500'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {isActive ? translate('مفعل') : translate('غير مفعل')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. لوحة إدارة المدرسة (ADMIN) */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center sm:text-initial">
            {translate('لوحة إدارة المدرسة')}
          </h1>

          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700">
              {['reports', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {translate(tab === 'reports' ? 'التقارير' : 'الإحصائيات')}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'reports' && (
            <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-[var(--text-secondary)] shadow-sm">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              {translate('محتوى التقارير قيد التطوير...')}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">{translate('إحصائيات المنصة الحالية')}</h2>
                </div>
                {loadingStats ? (
                  <p className="text-center text-[var(--text-secondary)] py-4">{translate('جاري تحميل البيانات...')}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[var(--bg-primary)] border border-gray-100 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm">
                      <GraduationCap className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-xs text-[var(--text-secondary)]">{translate('عدد المدرسين المسجلين')}</p>
                        <h4 className="text-xl font-bold">{stats.teachersCount}</h4>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8">
            <SupervisorMonitoring />
          </div>
        </div>
      )}

      {/* 3. لوحة المعلم المحدثة (TEACHER DASHBOARD) */}
      {user?.role === 'TEACHER' && (
        <div className="space-y-8 animate-fadeIn">
           
           {/* بطاقة الترحيب العلوية المدمجة مع التنبيهات السريعة */}
           <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 border border-white/20">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold mb-3">
                       <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                       <span>{translate('بوابة المعلم التفاعلية')}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      {translate('أهلاً أستاذ')} {user?.name?.split(' ')[0] || ''} 👋
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-xl">
                      نتمنى لك يوماً دراسياً موفقاً ومليئاً بالإنجازات. تابع مهامك وفصولك بسهولة من أدناه.
                    </p>
                 </div>

                 {/* صندوق تسجيل الحضور السريع داخل الهيدر */}
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-lg">
                    <div className="text-center sm:text-right">
                       <span className="text-xs font-semibold text-blue-100 block">{translate('تسجيل الحضور اليومي')}</span>
                       <span className="text-sm font-bold mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                          {teacherAttStatus ? (
                            teacherAttStatus === 'PRESENT' ? (
                              <span className="text-green-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> تم تسجيلك حاضراً</span>
                            ) : (
                              <span className="text-red-300 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> تم تسجيلك غائباً</span>
                            )
                          ) : (
                            <span className="text-amber-200">بانتظار التسجيل اليومي</span>
                          )}
                       </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                       <button 
                         onClick={() => handleTeacherAttendance('PRESENT')} 
                         className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                       >
                         <CheckCircle2 className="w-4 h-4" />
                         {translate('حاضر')}
                       </button>
                       <button 
                         onClick={() => handleTeacherAttendance('ABSENT')} 
                         className="flex-1 sm:flex-none px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                       >
                         <UserX className="w-4 h-4" />
                         {translate('غائب')}
                       </button>
                    </div>
                 </div>
              </div>

              {/* شريط تنبيه متحرك وسريع بالأسفل */}
              <div className="mt-6 pt-4 border-t border-white/15 flex items-center gap-3 text-xs sm:text-sm text-blue-50">
                 <BellRing className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
                 <span className="font-bold shrink-0">{translate('تنبيه سريع')}</span>
                 <p className="truncate opacity-90">{translate('يرجى التأكد من تحديث دفتر التحضير ورصد السلوك اليومي للطلاب بشكل دوري.')}</p>
              </div>
           </div>

           {/* كروت الوصول السريع المطابقة تماماً لخيارات القائمة الجانبية (Sidebar) */}
           <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 px-1">
                 <TrendingUp className="w-5 h-5 text-blue-600" />
                 {translate('الوصول السريع لمهامي اليومية')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                 
                 {/* 1. كارت تسجيل الحضور والغياب للطلاب */}
                 <Link 
                   to="/teacher/attendance" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <ClipboardCheck className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                          يومي
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{translate('سجل الحضور')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('إدارة حضور وغياب الطلاب اليومي')}</p>
                    </div>
                 </Link>

                 {/* 2. كارت الجدول الدراسي */}
                 <Link 
                   to="/teacher/schedule" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <Clock className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                          الحصص
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{translate('الجدول الدراسي')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('عرض الحصص والمواعيد الخاصة بك')}</p>
                    </div>
                 </Link>

                 {/* 3. كارت السلوك والانضباط */}
                 <Link 
                   to="/teacher/behavior" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <UserCheck className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
                          تفاعلي
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{translate('سلوك والانضباط')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('رصد السلوكيات والملاحظات السريعة')}</p>
                    </div>
                 </Link>

                 {/* 4. كارت متابعة المناهج */}
                 <Link 
                   to="/teacher/lesson" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                          الخطة الدراسية
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{translate('متابعة المناهج')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('تحديث نسب إنجاز المقررات الدراسية')}</p>
                    </div>
                 </Link>

                 {/* 5. كارت تقارير الزيارات */}
                 <Link 
                   to="/teacher/visits" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <Eye className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-100/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                          إشرافي
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{translate('تقارير الزيارات')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('عرض تقييمات المشرفين والملاحظات')}</p>
                    </div>
                 </Link>

                 {/* 6. كارت رصد الحالة اليومية للمعلم */}
                 <Link 
                   to="/teacher/status" 
                   className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <Activity className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-rose-100/60 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full">
                          شخصي
                       </span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{translate('الحالة اليومية')}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{translate('تحديث حالة التواجد والنشاط')}</p>
                    </div>
                 </Link>

              </div>
           </div>

           {/* قسم تتبع الفصول الحالي والجدول اليومي */}
           <div className="pt-2">
              <ClassroomTracking />
           </div>
        </div>
      )}

      {/* 4. لوحة المشرف (SUPERVISOR) */}
      {user?.role === 'SUPERVISOR' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">{translate('لوحة مراقبة المشرف')}</h1>
          <SupervisorMonitoring />
        </div>
      )}
    </div>
  );
}