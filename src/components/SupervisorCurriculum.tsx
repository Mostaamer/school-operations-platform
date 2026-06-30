import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Zap, RefreshCw, Bell, User, CalendarDays, BookOpenText, Tag, Layers, Hash 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('الكل');
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [selectedClass, setSelectedClass] = useState<string>('الكل');
  const [lessonLogs, setLessonLogs] = useState<any[]>([]);

  const stats = useMemo(() => {
    const total = lessonLogs.length;
    const delayed = lessonLogs.filter(l => l.is_delayed).length;
    return { total, delayed };
  }, [lessonLogs]);

  // الربط الصحيح مع جدول users لجلب اسم المدرس
  const fetchCurriculumData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lesson_logs')
      .select('*, users(name)') 
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error(error);
      toast.error('خطأ في جلب البيانات');
    } else {
      setLessonLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCurriculumData(); }, []);

  const toggleDelay = async (id: number, currentStatus: boolean | null) => {
    const { error } = await supabase.from('lesson_logs').update({ is_delayed: !currentStatus }).eq('id', id);
    if (!error) {
      setLessonLogs(prev => prev.map(l => l.id === id ? { ...l, is_delayed: !currentStatus } : l));
      toast.success(currentStatus ? 'تم إلغاء التنبيه' : 'تم تفعيل تنبيه التأخير');
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
            <p className="text-slate-500 font-bold mt-1">متابعة التنبيهات الميدانية للمدرسين</p>
          </div>
          <button onClick={fetchCurriculumData} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700">
            <RefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-red-50 text-red-600"><Bell size={24} /></div>
            <div><p className="text-sm font-bold text-slate-400">التنبيهات النشطة</p><h3 className="text-2xl font-black">{stats.delayed}</h3></div>
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
            <select value={f.val} onChange={(e) => { f.setter(e.target.value); if(i===0) setSelectedGrade('الكل'); }} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
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
                  <div key={log.id} className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${log.is_delayed ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-xl text-slate-800">{log.lesson_title}</h3>
                      {log.is_delayed && <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">تنبيه نشط</span>}
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {/* عرض اسم المدرس من جدول users */}
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

                    <button onClick={() => toggleDelay(log.id, log.is_delayed)} className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${log.is_delayed ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                      {log.is_delayed ? 'إلغاء التنبيه' : 'تفعيل تنبيه التأخير'}
                    </button>
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