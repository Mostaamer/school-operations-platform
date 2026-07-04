import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/auth-context';
import { BookOpen, Plus, X, CheckSquare, Square, Trash2, Edit2, Save, Loader2, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = ['الابتدائية', 'الإعدادية', 'الثانوية'];
const GRADES = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];
const CLASSES = ['A', 'B', 'C', 'D', 'E'];
const UNITS = [1, 2, 3, 4, 5];
const CONCEPTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8];
const PARTS = [1, 2, 3, 4];

export default function TeacherLesson() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConceptEnabled, setIsConceptEnabled] = useState(true);
  const [requestApproval, setRequestApproval] = useState(false); 
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    lesson_title: '',
    stage: STAGES[0],
    grade: GRADES[0],
    class_name: CLASSES[0],
    unit_number: 1,
    concept_number: 1,
    lesson_number: 1,
    part_number: 1,
    log_date: new Date().toISOString().split('T')[0]
  });

  const fetchLogs = async () => {
    if (!user || !user.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('lesson_logs')
      .select('*')
      .eq('teacher_id', Number(user.id)) 
      .order('log_date', { ascending: false });
      
    if (error) {
      toast.error('خطأ في جلب البيانات: ' + error.message);
      console.error(error);
    }
    else setLogs(data || []);
    
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      toast.error("حدث خطأ: غير قادر على تحديد هوية المعلم. يرجى تسجيل الدخول مجدداً.");
      return;
    }

    const dataToSubmit = {
      ...formData,
      concept_number: isConceptEnabled ? formData.concept_number : 0,
      teacher_id: Number(user.id),
      needs_approval: requestApproval
    };

    let recordId = editingId;

    if (editingId) {
      const { error } = await supabase.from('lesson_logs').update(dataToSubmit).eq('id', editingId);
      if (error) {
        toast.error('خطأ في التحديث: ' + error.message);
        return;
      }
      else toast.success('تم تعديل الدرس بنجاح');
    } else {
      const { data, error } = await supabase.from('lesson_logs').insert([dataToSubmit]).select();
      if (error) {
        toast.error('خطأ في الحفظ: ' + error.message);
        return;
      }
      else {
        toast.success('تم تسجيل الدرس بنجاح');
        if(data && data[0]) recordId = data[0].id;
      }
    }

    if (requestApproval && recordId) {
      // تعديل هام: جلب الـ ID الفعلي للمشرف لتصل التنبيهات إليه
      const { data: supervisorData } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'SUPERVISOR')
        .limit(1)
        .single();
        
      const supervisorId = supervisorData?.id || 1;

      await supabase.from('notifications').insert({
        sender_id: Number(user.id),
        receiver_id: supervisorId,
        sender_role: 'teacher',
        type: 'curriculum',
        title: 'طلب اعتماد درس',
        message: `طلب المعلم اعتماد درس: ${formData.lesson_title} للصف ${formData.grade}`,
        related_id: recordId
      });
      toast.success('تم إرسال طلب الاعتماد للمشرف بنجاح');
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setRequestApproval(false); 
    fetchLogs();
  };

  const startEdit = (log: any) => {
    setFormData(log);
    setEditingId(log.id);
    setRequestApproval(log.needs_approval || false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    const { error } = await supabase.from('lesson_logs').delete().eq('id', id);
    if(error) toast.error('خطأ في الحذف: ' + error.message);
    else fetchLogs();
  };

  const renderStageSection = (stageName: string) => (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 shadow-xl min-h-[500px]">
      <h2 className="text-3xl font-black text-emerald-900 mb-6 border-b-4 border-emerald-200 pb-4">{stageName}</h2>
      <div className="space-y-4">
        {logs.filter(l => l.stage === stageName).map(log => (
          <div key={log.id} 
            className={`bg-gray-50 p-5 rounded-3xl border-2 transition-all group relative overflow-hidden
            ${log.is_delayed 
              ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
              : log.needs_approval ? 'border-orange-300 shadow-sm' : 'border-gray-100 hover:border-emerald-200'}`}
          >
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {log.needs_approval && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-md">
                  <Clock size={12}/> بانتظار الاعتماد
                </span>
              )}
            </div>
            
            {log.is_delayed && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                <AlertCircle size={12}/> متأخر
              </div>
            )}

            <h4 className="font-black text-xl text-gray-900 mb-3 w-3/4">{log.lesson_title}</h4>
            
            <div className="grid grid-cols-2 gap-2 mt-3 font-extrabold text-xs text-gray-700">
              <span className="bg-emerald-50 p-2 rounded-lg">الصف: {log.grade}</span>
              <span className="bg-emerald-50 p-2 rounded-lg">فصل: {log.class_name}</span>
              <span className="bg-white p-2 rounded-lg border border-gray-200">وحدة: {log.unit_number}</span>
              {log.concept_number > 0 && <span className="bg-white p-2 rounded-lg border border-gray-200">مفهوم: {log.concept_number}</span>}
              <span className="bg-white p-2 rounded-lg border border-gray-200">درس: {log.lesson_number}</span>
              <span className="bg-white p-2 rounded-lg border border-gray-200">جزء: {log.part_number}</span>
            </div>

            <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(log)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit2 size={18}/></button>
              <button onClick={() => handleDelete(log.id)} className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-10 bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-emerald-50 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black text-gray-950">متابعة المنهج</h1>
          <p className="text-2xl font-extrabold text-gray-500 mt-3">سجل وتابع تقدمك بكل تفصيل</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setEditingId(null); setRequestApproval(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-5 rounded-3xl font-black text-xl flex items-center gap-3 shadow-2xl transition-all active:scale-95">
          <Plus size={30} /> تسجيل درس جديد
        </button>
      </div>

      {loading ? <Loader2 className="animate-spin mx-auto mt-20 text-emerald-600" size={60} /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STAGES.map(stage => renderStageSection(stage))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] w-full max-w-3xl shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black text-gray-900">{editingId ? 'تعديل الدرس' : 'تسجيل درس جديد'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={40} /></button>
            </div>

            <input type="text" placeholder="عنوان الدرس" className="w-full p-6 border-4 border-gray-100 rounded-3xl font-black text-2xl focus:border-emerald-500 outline-none transition-colors" value={formData.lesson_title} onChange={e => setFormData({...formData, lesson_title: e.target.value})} required />
            
            <div className="grid grid-cols-3 gap-6">
              <select className="p-5 border-4 rounded-3xl font-black text-lg bg-white" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>
              <select className="p-5 border-4 rounded-3xl font-black text-lg bg-white" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
              <select className="p-5 border-4 rounded-3xl font-black text-lg bg-white" value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})}>{CLASSES.map(c => <option key={c} value={c}>فصل {c}</option>)}</select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center gap-4 bg-gray-100 p-5 rounded-3xl cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setIsConceptEnabled(!isConceptEnabled)}>
                <button type="button" className="text-emerald-600 pointer-events-none">
                  {isConceptEnabled ? <CheckSquare size={35} /> : <Square size={35} />}
                </button>
                <span className="font-black text-xl text-gray-800">تفعيل خيار "المفهوم"</span>
              </div>
              
              <div className={`flex-1 flex items-center gap-4 border-2 p-5 rounded-3xl cursor-pointer transition-all ${requestApproval ? 'bg-orange-100 border-orange-400' : 'bg-orange-50 border-orange-200 hover:bg-orange-100'}`} onClick={() => setRequestApproval(!requestApproval)}>
                <button type="button" className="text-orange-600 pointer-events-none">
                  {requestApproval ? <CheckSquare size={35} /> : <Square size={35} />}
                </button>
                <span className="font-black text-xl text-orange-900">طلب اعتماد المشرف</span>
              </div>
            </div>

            <div className={`grid gap-6 bg-emerald-50 p-8 rounded-[2rem] ${isConceptEnabled ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div><label className="text-sm font-black text-emerald-900 block mb-3">الوحدة</label>
                <select className="w-full p-4 rounded-2xl font-black text-lg bg-white" value={formData.unit_number} onChange={e => setFormData({...formData, unit_number: parseInt(e.target.value)})}>{UNITS.map(n => <option key={n}>{n}</option>)}</select></div>
              {isConceptEnabled && (
                <div><label className="text-sm font-black text-emerald-900 block mb-3">المفهوم</label>
                  <select className="w-full p-4 rounded-2xl font-black text-lg bg-white" value={formData.concept_number} onChange={e => setFormData({...formData, concept_number: parseInt(e.target.value)})}>{CONCEPTS.map(n => <option key={n}>{n}</option>)}</select></div>
              )}
              <div><label className="text-sm font-black text-emerald-900 block mb-3">الدرس</label>
                <select className="w-full p-4 rounded-2xl font-black text-lg bg-white" value={formData.lesson_number} onChange={e => setFormData({...formData, lesson_number: parseInt(e.target.value)})}>{LESSONS.map(n => <option key={n}>{n}</option>)}</select></div>
              <div><label className="text-sm font-black text-emerald-900 block mb-3">الجزء</label>
                <select className="w-full p-4 rounded-2xl font-black text-lg bg-white" value={formData.part_number} onChange={e => setFormData({...formData, part_number: parseInt(e.target.value)})}>{PARTS.map(n => <option key={n}>{n}</option>)}</select></div>
            </div>

            <input type="date" className="w-full p-6 border-4 border-gray-100 rounded-3xl font-black text-2xl focus:border-emerald-500 outline-none transition-colors" value={formData.log_date} onChange={e => setFormData({...formData, log_date: e.target.value})} required />
            
            <button className="w-full py-7 bg-emerald-600 text-white rounded-3xl font-black text-3xl shadow-2xl hover:bg-emerald-700 active:scale-95 transition-all">حفظ البيانات</button>
          </form>
        </div>
      )}
    </div>
  );
}