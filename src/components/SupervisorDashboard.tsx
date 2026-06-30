import React, { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, Users, TrendingUp, RefreshCw, ChevronRight, UserCheck, CheckCircle, ClipboardCheck, CalendarDays } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingLessons: 0,
    pendingBehaviors: 0,
    totalStudents: 0,
    activeTeachers: 0,
    completedLessons: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ count: lessons }, { count: behaviors }, { count: students }, { count: teachers }, { count: completed }] = await Promise.all([
        supabase.from('lesson_logs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('behaviors').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'TEACHER').eq('isActive', true),
        supabase.from('lesson_logs').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      ]);

      setStats({
        pendingLessons: lessons || 0,
        pendingBehaviors: behaviors || 0,
        totalStudents: students || 0,
        activeTeachers: teachers || 0,
        completedLessons: completed || 0
      });
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800">مرحباً بك يا مشرفنا</h1>
          <p className="text-slate-500 mt-2 font-medium">إليك ملخص العمليات الإشرافية لهذا اليوم</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all font-bold text-slate-700"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          تحديث البيانات
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-indigo-100 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-indigo-50 rounded-2xl"><BookOpen className="text-indigo-600" size={28} /></div>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">المناهج</span>
          </div>
          <h3 className="text-slate-400 font-bold text-sm">دروس بانتظار الاعتماد</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-4xl font-black text-slate-800">{stats.pendingLessons}</p>
            <button onClick={() => navigate('/supervisor/curriculum')} className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">عرض التفاصيل <ChevronRight size={16} /></button>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-amber-100 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-50 rounded-2xl"><AlertTriangle className="text-amber-600" size={28} /></div>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">السلوك</span>
          </div>
          <h3 className="text-slate-400 font-bold text-sm">ملاحظات سلوكية معلقة</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-4xl font-black text-slate-800">{stats.pendingBehaviors}</p>
            <button onClick={() => navigate('/supervisor/behavior')} className="text-amber-600 font-bold text-sm flex items-center gap-1 hover:underline">متابعة السجل <ChevronRight size={16} /></button>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-emerald-100 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-emerald-50 rounded-2xl"><Users className="text-emerald-600" size={28} /></div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">الطلاب</span>
          </div>
          <h3 className="text-slate-400 font-bold text-sm">إجمالي عدد الطلاب</h3>
          <div className="flex items-end justify-between mt-2">
            <p className="text-4xl font-black text-slate-800">{stats.totalStudents}</p>
            <div className="flex items-center text-emerald-600 font-bold text-sm gap-1"><TrendingUp size={16} /> مسجلون حالياً</div>
          </div>
        </motion.div>
      </div>

      {/* قسم الإجراءات السريعة - تم التعديل ليحتوي 3 أزرار كبيرة موزعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'الزيارات الصفية', icon: ClipboardCheck, color: 'bg-rose-500', path: '/supervisor/visits' },
          { label: 'جدول المعلمين', icon: CalendarDays, color: 'bg-sky-500', path: '/supervisor/teacher-schedules' },
          { label: 'سجلات الطلاب', icon: Users, color: 'bg-indigo-500', path: '/supervisor/students' },
        ].map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => navigate(action.path)} 
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-4 hover:border-indigo-200 hover:shadow-lg transition-all group"
          >
            <div className={`${action.color} p-4 rounded-2xl text-white group-hover:scale-110 transition-transform`}>
              <action.icon size={28} />
            </div>
            <span className="font-black text-slate-700 text-xl">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><UserCheck size={28} /></div>
          <div>
            <h3 className="text-slate-400 font-bold text-sm">المعلمون النشطون</h3>
            <p className="text-2xl font-black text-slate-800">{stats.activeTeachers} معلم متواجد</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-teal-50 rounded-2xl text-teal-600"><CheckCircle size={28} /></div>
          <div>
            <h3 className="text-slate-400 font-bold text-sm">الدروس المكتملة</h3>
            <p className="text-2xl font-black text-slate-800">{stats.completedLessons} درس تم اعتماده</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-6">نظرة عامة على النظام</h2>
        <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium">
          تم تحديث النظام بنجاح وربطه بقاعدة البيانات، جميع التقارير أعلاه تسحب بياناتها اللحظية من النظام.
        </div>
      </div>
    </div>
  );
}