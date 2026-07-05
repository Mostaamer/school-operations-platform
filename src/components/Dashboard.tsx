import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  GraduationCap, 
  BarChart3, 
  ShieldAlert,
  Activity,
  Database,
  Terminal,
  RotateCw,
  UserCheck,
  User,
  Clock,
  ClipboardCheck,
  BookOpen,
  Eye,
  TrendingUp,
  Sparkles,
  BellRing,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

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

  // بيانات المطور
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [loadingDevUsers, setLoadingDevUsers] = useState(false);

  // إحصائيات الإدارة
  const [stats, setStats] = useState({
    teachersCount: 0,
    supervisorsCount: 0,
    studentsCount: 0,
    primaryCount: 0,
    middleCount: 0,
    highCount: 0,
    classesCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // 1. جلب إحصائيات المدير (تم تصحيحها لتقرأ من class_id الخاص بالطلاب)
  useEffect(() => {
    async function fetchSchoolStats() {
      if (user?.role !== 'ADMIN') return;
      setLoadingStats(true);
      try {
        const { count: teachers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'TEACHER');
        const { count: supervisors } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'SUPERVISOR');

        // جلب معرفات الفصول الخاصة بالطلاب لحساب الإجمالي والتقسيم وعدد الفصول الفعلي
        const { data: studentsData } = await supabase.from('students').select('class_id');
        
        let primary = 0, middle = 0, high = 0;
        const uniqueClasses = new Set<string>();
        
        if (studentsData) {
          studentsData.forEach(s => {
            if (s.class_id) {
              uniqueClasses.add(s.class_id); // حصر الفصول النشطة فعلياً
              
              // تصنيف الطلاب بناءً على الاختصارات (PRI للابتدائي، PRE للإعدادي، SEC للثانوي)
              if (s.class_id.includes('PRI')) primary++;
              else if (s.class_id.includes('PRE')) middle++;
              else if (s.class_id.includes('SEC')) high++;
            }
          });
        }

        setStats({
          teachersCount: teachers || 0,
          supervisorsCount: supervisors || 0,
          studentsCount: studentsData?.length || 0,
          primaryCount: primary,
          middleCount: middle,
          highCount: high,
          classesCount: uniqueClasses.size // عدد الفصول الفعلي المسجل به طلاب
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchSchoolStats();
  }, [user]);

  // 2. جلب حالة حضور المعلم الفعلية
  useEffect(() => {
    async function fetchTeacherTodayStatus() {
      if (user?.role !== 'TEACHER') return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('attendance')
          .select('status')
          .eq('teacher_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (data) {
          setTeacherAttStatus(data.status);
        } else {
          setTeacherAttStatus(null);
        }
      } catch (err) {
        console.error("Error fetching teacher status:", err);
      }
    }
    fetchTeacherTodayStatus();
  }, [user]);

  // 3. جلب المستخدمين لبيئة المطور
  useEffect(() => {
    async function fetchAllSystemUsers() {
      if (user?.role !== 'DEVELOPER') return;
      setLoadingDevUsers(true);
      try {
        const { data, error } = await supabase.from('users').select('*').order('id', { ascending: false });
        if (!error && data) setDevUsers(data);
      } catch (err) {} finally {
        setLoadingDevUsers(false);
      }
    }
    fetchAllSystemUsers();
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => setLanguage(localStorage.getItem('app_lang') || 'ar');
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ar';
      if (currentLang !== language) setLanguage(currentLang);
    }, 300);
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(interval); };
  }, [language]);

  return (
    <div className="p-6 min-h-screen text-[var(--text-primary)] transition-colors duration-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ======================================================== */}
      {/* 1. لوحة التحكم لوضع المطور (DEVELOPER) */}
      {/* ======================================================== */}
      {user?.role === 'DEVELOPER' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-slate-800">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400">
                <ShieldAlert className="w-8 h-8 text-cyan-400" />
                لوحة تحكم المطور
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">
                [SYSTEM_ROOT_ACCESS] Advanced Server & Database Monitoring
              </p>
            </div>
            <button 
              onClick={() => toast.success('تم تحديث كاش النظام بنجاح')}
              className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-cyan-400 rounded-xl transition-all flex items-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
            >
              <RotateCw className="w-4 h-4" /> تحديث الكاش
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all">
              <div className="absolute -right-10 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="p-3.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Activity className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-xs text-emerald-100/50 uppercase tracking-widest font-mono">Server Status</p>
                <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]"></span>
                  Operational
                </h4>
              </div>
            </div>

            <div className="bg-slate-900 border border-blue-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(59,130,246,0.1)] relative overflow-hidden group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
              <div className="absolute -right-10 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
              <div className="p-3.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Database className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-xs text-blue-100/50 uppercase tracking-widest font-mono">Database Link</p>
                <h4 className="text-lg font-bold text-blue-400 mt-1">Connected</h4>
              </div>
            </div>

            <div className="bg-slate-900 border border-purple-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all">
              <div className="absolute -right-10 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
              <div className="p-3.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Terminal className="w-7 h-7" />
              </div>
              <div className="z-10">
                <p className="text-xs text-purple-100/50 uppercase tracking-widest font-mono">Environment</p>
                <h4 className="text-lg font-bold text-purple-400 mt-1">Production</h4>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-50 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4 relative z-10">
              <Users className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">إدارة الحسابات النشطة</h2>
            </div>
            
            {loadingDevUsers ? (
              <p className="text-center text-cyan-400 py-8 animate-pulse font-mono">Fetching users data...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                {devUsers.map((sysUser) => {
                  const isActive = sysUser.status !== 'INACTIVE' && sysUser.is_active !== false;
                  return (
                    <div key={sysUser.id} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl hover:border-cyan-500/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-200">{sysUser.name || 'مستخدم مجهول'}</h4>
                            <p className="text-xs text-gray-500 font-mono mt-1">{sysUser.employeeCode || sysUser.username || 'NO_ID'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded border font-mono tracking-widest ${
                          sysUser.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          sysUser.role === 'DEVELOPER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          sysUser.role === 'SUPERVISOR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {sysUser.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-700/50 mt-4 pt-3">
                        <span className="text-xs text-gray-500">حالة الحساب</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-rose-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`}></span>
                          {isActive ? 'نشط' : 'معطل'}
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

      {/* ======================================================== */}
      {/* 2. لوحة إدارة المدرسة (ADMIN) */}
      {/* ======================================================== */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-black">إحصائيات المدرسة الحالية</h1>
          </div>

          {loadingStats ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Activity className="w-10 h-10 animate-pulse text-blue-500 mb-4" />
              <p className="font-bold text-lg">جاري جلب وحساب البيانات الفعلية من النظام...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* كارت المعلمين */}
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">إجمالي المدرسين</p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white">{stats.teachersCount}</h4>
                </div>
              </div>

              {/* كارت المشرفين */}
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">إجمالي المشرفين</p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white">{stats.supervisorsCount}</h4>
                </div>
              </div>

              {/* كارت الفصول الحقيقية */}
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 rounded-3xl flex items-center gap-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-bold">الفصول النشطة</p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white">{stats.classesCount}</h4>
                </div>
              </div>

              {/* كارت الطلاب المطور بالتقسيم */}
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 lg:col-span-1 md:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5 font-bold">إجمالي الطلاب المسجلين</p>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{stats.studentsCount}</h4>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-slate-700 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">المرحلة الابتدائية</span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{stats.primaryCount}</span>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-2 rounded-xl text-center border-x border-white dark:border-slate-800">
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">المرحلة الإعدادية</span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">{stats.middleCount}</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">المرحلة الثانوية</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.highCount}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. لوحة المعلم المحدثة (TEACHER DASHBOARD) */}
      {/* ======================================================== */}
      {user?.role === 'TEACHER' && (
        <div className="space-y-8 animate-fadeIn">
           
           <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 border border-white/20">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold mb-3">
                       <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                       <span>بوابة المعلم التفاعلية ومتابعة المهام</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                      أهلاً أستاذ {user?.name?.split(' ')[0] || ''} 👋
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-xl">
                      نتمنى لك يوماً دراسياً موفقاً ومليئاً بالإنجازات. تابع مهامك وفصولك بسهولة من أدناه.
                    </p>
                 </div>

                 <div className="w-full md:w-auto shrink-0">
                    {teacherAttStatus ? (
                      <div className="flex items-center gap-3 text-green-800 dark:text-green-200 font-bold bg-green-400/90 dark:bg-green-500/20 px-5 py-4 rounded-2xl border-2 border-green-300 dark:border-green-500/30 shadow-lg justify-center sm:justify-start">
                        <CheckCircle2 className="w-6 h-6"/>
                        <div className="flex flex-col">
                          <span className="text-sm">حالة تسجيلك اليوم:</span>
                          <span className="text-lg font-black">{teacherAttStatus}</span>
                        </div>
                      </div>
                    ) : (
                      <Link 
                        to="/teacher/status" 
                        className="flex items-center gap-4 text-white font-bold bg-red-600 hover:bg-red-700 px-6 py-4 rounded-2xl border-2 border-red-300 w-full justify-center shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse transition-all hover:scale-105"
                      >
                        <AlertTriangle className="w-8 h-8"/>
                        <div className="flex flex-col">
                          <span className="text-lg font-black">تحذير: لم تسجل حضورك!</span>
                          <span className="text-xs text-red-200 font-normal">اضغط هنا فوراً لتسجيل حالتك اليومية</span>
                        </div>
                      </Link>
                    )}
                 </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/15 flex items-center gap-3 text-xs sm:text-sm text-blue-50">
                 <BellRing className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
                 <span className="font-bold shrink-0">تنبيه سريع:</span>
                 <p className="truncate opacity-90">يرجى التأكد من تحديث دفتر التحضير ورصد السلوك اليومي للطلاب بشكل دوري.</p>
              </div>
           </div>

           <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 px-1">
                 <TrendingUp className="w-5 h-5 text-blue-600" />
                 الوصول السريع لمهامي اليومية
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                 <Link to="/teacher/attendance" className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <ClipboardCheck className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">يومي</span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">سجل حضور الطلاب</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">إدارة حضور وغياب الطلاب اليومي</p>
                    </div>
                 </Link>

                 <Link to="/teacher/schedule" className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <Clock className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">الحصص</span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">الجدول الدراسي</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">عرض الحصص والمواعيد الخاصة بك</p>
                    </div>
                 </Link>

                 <Link to="/teacher/behavior" className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <UserCheck className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">تفاعلي</span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">سلوك والانضباط</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">رصد السلوكيات والملاحظات السريعة</p>
                    </div>
                 </Link>

                 <Link to="/teacher/lesson" className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">الخطة الدراسية</span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">متابعة المناهج</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">تحديث نسب إنجاز المقررات الدراسية</p>
                    </div>
                 </Link>

                 <Link to="/teacher/visits" className="group relative bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between">
                       <div className="p-3.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <Eye className="w-6 h-6" />
                       </div>
                       <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-100/60 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">إشرافي</span>
                    </div>
                    <div className="mt-5">
                       <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">تقارير الزيارات</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">عرض تقييمات المشرفين والملاحظات</p>
                    </div>
                 </Link>

              </div>
           </div>

           <div className="pt-2">
              <ClassroomTracking />
           </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. لوحة المشرف (SUPERVISOR) */}
      {/* ======================================================== */}
      {user?.role === 'SUPERVISOR' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">لوحة مراقبة المشرف</h1>
          <SupervisorMonitoring />
        </div>
      )}
    </div>
  );
}