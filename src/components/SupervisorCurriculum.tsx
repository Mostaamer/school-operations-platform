import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Zap, RefreshCw, Bell, User, CalendarDays, BookOpenText, Tag, Layers, Hash, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../lib/auth-context';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

const normalize = (str: string) => str?.trim().toLowerCase().replace('ال', '');

const STAGES = ['الابتدائية', 'الإعدادية', 'الثانوية'];
const GRADES: { [key: string]: string[] } = {
  'الابتدائية': ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'],
  'الإعدادية': ['الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي'],
  'الثانوية': ['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي']
};
const CLASSES = ['أ', 'ب', 'ج', 'د', 'هـ'];

export default function SupervisorCurriculum() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('الكل');
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [selectedClass, setSelectedClass] = useState<string>('الكل');
  const [lessonLogs, setLessonLogs] = useState<any[]>([]);

  const stats = useMemo(() => {
    const total = lessonLogs.length;
    const delayed = lessonLogs.filter(l => l.is_delayed).length;
    const pending = lessonLogs.filter(l => l.needs_approval).length;
    return { total, delayed, pending };
  }, [lessonLogs]);

  const fetchCurriculumData = async () => {
    setLoading(true);
    // نجلب البيانات مع التأكد من جلب حقل needs_approval
    const { data, error } = await supabase
      .from('lesson_logs')
      .select('*, users(name)') 
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error(error);
      toast.error('خطأ في جلب البيانات من قاعدة البيانات');
    } else {
      setLessonLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchCurriculumData(); 
  }, []);

  const toggleDelay = async (id: number, currentStatus: boolean | null) => {
    const { error } = await supabase.from('lesson_logs').update({ is_delayed: !currentStatus }).eq('id', id);
    if (!error) {
      setLessonLogs(prev => prev.map(l => l.id === id ? { ...l, is_delayed: !currentStatus } : l));
      toast.success(currentStatus ? 'تم إلغاء تنبيه التأخير' : 'تم تفعيل تنبيه التأخير بنجاح');
    } else {
      toast.error('حدث خطأ أثناء تغيير حالة التنبيه');
    }
  };

  // الدالة الخاصة باعتماد الدرس من قبل المشرف وإرسال إشعار للمدرس
  const handleApproveLesson = async (log: any) => {
    try {
      // 1. تحديث حالة الدرس في قاعدة البيانات ليكون معتمداً
      const { error: updateError } = await supabase
        .from('lesson_logs')
        .update({ needs_approval: false })
        .eq('id', log.id);
        
      if (updateError) throw updateError;

      // 2. تحديث الواجهة فوراً
      setLessonLogs(prev => prev.map(l => l.id === log.id ? { ...l, needs_approval: false } : l));
      toast.success('تم اعتماد الدرس بنجاح!', { icon: '✅' });

      // 3. إرسال إشعار للمعلم بأنه تم الاعتماد
      if (log.teacher_id) {
        await supabase.from('notifications').insert({
          sender_id: user?.id || 1,
          receiver_id: log.teacher_id,
          sender_role: 'supervisor',
          type: 'curriculum',
          title: 'تم اعتماد الدرس',
          message: `تم اعتماد درس "${log.lesson_title}" من قبل المشرف.`,
          related_id: log.id
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء محاولة اعتماد الدرس');
    }
  };

  const filteredLogs = useMemo(() => {
    return lessonLogs.filter(log => 
      (selectedStage === 'الكل' || normalize(log.stage) === normalize(selectedStage)) &&
      (selectedGrade === 'الكل' || normalize(log.grade) === normalize(selectedGrade)) &&
      (selectedClass === 'الكل' || normalize(log.class_name) === normalize(selectedClass))
    );
  }, [lessonLogs, selectedStage, selectedGrade, selectedClass]);

  return (
    <div className="max-w-[100rem] mx-auto p-8 space-y-8 bg-slate-50 min-h-screen" dir="rtl">
      <header className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-800">لوحة متابعة المناهج</h1>
            <p className="text-slate-500 font-bold mt-1">متابعة التنبيهات الميدانية للمدرسين واعتماد الدروس</p>
          </div>
          <button onClick={fetchCurriculumData} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors">
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-50 text-red-600"><Bell size={20} /></div>
              <div><p className="text-xs font-bold text-slate-400">التنبيهات النشطة</p><h3 className="text-xl font-black">{stats.delayed}</h3></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><CheckCircle size={20} /></div>
              <div><p className="text-xs font-bold text-slate-400">طلبات الاعتماد</p><h3 className="text-xl font-black">{stats.pending}</h3></div>
            </div>
        </div>
      </header>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'المرحلة الدراسية', val: selectedStage, setter: setSelectedStage, options: STAGES },
          { label: 'الصف الدراسي', val: selectedGrade, setter: setSelectedGrade, options: selectedStage !== 'الكل' ? GRADES[selectedStage] : [] },
          { label: 'الفصل الدراسي', val: selectedClass, setter: setSelectedClass, options: CLASSES }
        ].map((f, i) => (
          <div key={i}>
            <label className="text-sm font-black text-slate-500 mb-3 block">{f.label}</label>
            <select value={f.val} onChange={(e) => { f.setter(e.target.value); if(i===0) setSelectedGrade('الكل'); }} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold cursor-pointer hover:border-slate-300 outline-none">
              <option value="الكل">عرض الكل</option>
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className={`grid gap-8 ${selectedStage === 'الكل' ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1'}`}>
        {STAGES.map((stage) => {
          if (selectedStage !== 'الكل' && selectedStage !== stage) return null;
          return (
            <div key={stage} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8 border-b pb-6">
                <h2 className="font-black text-2xl flex items-center gap-3"><Zap className="text-indigo-500" /> مرحلة {stage}</h2>
                <span className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full font-black text-sm">{filteredLogs.filter(l => normalize(l.stage) === normalize(stage)).length} سجل</span>
              </div>
              
              <div className={`grid gap-6 ${selectedStage !== 'الكل' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredLogs.filter(l => normalize(l.stage) === normalize(stage)).map(log => (
                  <div key={log.id} className={`p-6 rounded-[2rem] border-2 transition-all duration-300 relative ${log.is_delayed ? 'bg-red-50 border-red-200' : log.needs_approval ? 'bg-orange-50 border-orange-200 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-xl text-slate-800 w-3/4 leading-tight">{log.lesson_title}</h3>
                      {log.is_delayed && <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse whitespace-nowrap">تنبيه نشط</span>}
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl text-sm font-bold text-slate-700 border border-slate-100">
                        <User size={16} className="text-indigo-400"/> المدرس: {log.users?.name || 'غير محدد'}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                          <Layers size={14} className="text-indigo-400"/> وحدة: {log.unit_number || '-'}
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                          <Hash size={14} className="text-indigo-400"/> جزء: {log.part_number || '-'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                          <CalendarDays size={14} className="text-indigo-400"/> {log.log_date ? new Date(log.log_date).toLocaleDateString('ar-EG') : 'بدون تاريخ'}
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                          <BookOpenText size={14} className="text-indigo-400"/> صف: {log.grade}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                            <Tag size={14} className="text-indigo-400"/> مفهوم: {log.concept || 'لا يوجد'}
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                            <Database size={14} className="text-indigo-400"/> فصل: {log.class_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* زر الاعتماد يظهر فقط إذا كان الدرس بحاجة لاعتماد */}
                      {log.needs_approval && (
                        <button onClick={() => handleApproveLesson(log)} className="w-full py-3 rounded-xl text-sm font-black transition-all bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center gap-2 shadow-sm active:scale-95">
                          <CheckCircle size={18} /> اعتماد الدرس الآن
                        </button>
                      )}
                      
                      <button onClick={() => toggleDelay(log.id, log.is_delayed)} className={`w-full py-3 rounded-xl text-sm font-black transition-all active:scale-95 ${log.is_delayed ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                        {log.is_delayed ? 'إلغاء التنبيه' : 'تفعيل تنبيه التأخير'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}