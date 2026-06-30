import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Loader2, AlertTriangle, Plus, Trash2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

interface ScheduleItem {
  id?: number;
  teacher_id: number;
  class_id: string;
  day_of_week: string;
  period: string;
  subject: string;
  stage: string;
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const GRADES = ['1', '2', '3', '4', '5', '6'];
const CLASSES = ['A', 'B', 'C', 'D'];

export default function ScheduleView() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingCell, setEditingCell] = useState<{ day: string; period: string; existingRecord?: ScheduleItem } | null>(null);
  const [modalForm, setModalForm] = useState({ 
    grade: '1', classLabel: 'A', stage: 'المرحلة الابتدائية', newDay: '', newPeriod: '' 
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const { data: teachersData } = await supabase.from('users').select('*').eq('role', 'TEACHER');
      setTeachers(teachersData || []);
      if (user?.role === 'TEACHER') setSelectedTeacherId(String(user.id));
      else if (teachersData?.length) setSelectedTeacherId(String(teachersData[0].id));
      setLoading(false);
    };
    loadInitialData();
  }, [user]);

  const fetchSchedules = async () => {
    if (!selectedTeacherId) return;
    const { data, error } = await supabase.from('schedule').select('*').eq('teacher_id', parseInt(selectedTeacherId));
    if (error) toast.error('فشل في جلب البيانات');
    else setSchedules(data || []);
  };

  useEffect(() => { fetchSchedules(); }, [selectedTeacherId]);

  const handleCellClick = (day: string, period: string, currentSchedule?: ScheduleItem) => {
    const isEditable = user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.role === 'SUPERVISOR';
    if (!isEditable) return;
    if (currentSchedule) {
      const parts = currentSchedule.class_id.split('/');
      setModalForm({ grade: parts[0] || '1', classLabel: parts[1] || 'A', stage: currentSchedule.stage || 'المرحلة الابتدائية', newDay: day, newPeriod: period });
    } else {
      setModalForm({ grade: '1', classLabel: 'A', stage: 'المرحلة الابتدائية', newDay: day, newPeriod: period });
    }
    setEditingCell({ day, period, existingRecord: currentSchedule });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !selectedTeacherId) return;
    setIsSaving(true);
    const payload = { 
      teacher_id: parseInt(selectedTeacherId), day_of_week: modalForm.newDay, period: modalForm.newPeriod, 
      subject: 'Science', class_id: `${modalForm.grade}/${modalForm.classLabel}`, stage: modalForm.stage 
    };
    if (editingCell.existingRecord?.id) {
      await supabase.from('schedule').update(payload).eq('id', editingCell.existingRecord.id);
    } else {
      await supabase.from('schedule').insert([payload]);
    }
    setEditingCell(null); setIsSaving(false); fetchSchedules();
  };

  const handleDelete = async () => {
    if (!editingCell?.existingRecord?.id) return;
    await supabase.from('schedule').delete().eq('id', editingCell.existingRecord.id);
    setShowDeleteConfirm(false); setEditingCell(null); fetchSchedules();
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" /> جاري تحميل الجدول...</div>;

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <Calendar className="text-blue-600" /> الجدول الدراسي الأسبوعي
        </h1>
        {user?.role !== 'TEACHER' && (
          <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="p-3 px-6 border-2 border-blue-100 rounded-2xl font-bold bg-blue-50 text-blue-800">
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-blue-700 text-white shadow-md">
                <th className="p-6 font-black text-lg border-l border-blue-600 rounded-tr-2xl">اليوم \ الحصة</th>
                {PERIODS.map(p => (
                  <th key={p} className="p-6 text-center font-black text-lg border-l border-blue-600 last:border-none">
                    <span className="text-blue-100 font-normal text-sm block">حصة</span>
                    <span className="text-white text-xl">{p}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-6 font-black text-blue-900 text-lg bg-blue-50/50 border-l border-gray-200">{day}</td>
                  {PERIODS.map((period) => {
                    const data = schedules.find(s => s.day_of_week === day && s.period === period);
                    return (
                      <td key={period} onClick={() => handleCellClick(day, period, data)} className="p-2 border-l border-gray-100 cursor-pointer transition-all hover:scale-[0.98]">
                        {data ? (
                          <div className="bg-white border-2 border-blue-100 p-4 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
                            <p className="font-black text-blue-900 text-[15px] border-b pb-2 mb-2">{data.subject}</p>
                            <div className="flex flex-col gap-1 text-[12px] text-gray-700 font-bold">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{data.stage}</span>
                              <div className="flex justify-between mt-1 px-1">
                                <span>صف: {data.class_id.split('/')[0]}</span>
                                <span>فصل: {data.class_id.split('/')[1]}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-300 hover:text-blue-400 transition-all">
                            <Plus size={24} />
                            <span className="text-[10px] font-bold mt-1">إضافة</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* باقي المكونات (Modal & DeleteConfirm) كما هي لا تغيير */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-gray-800">{editingCell.existingRecord ? 'تعديل الحصة' : 'إضافة حصة جديدة'}</h2>
            <form onSubmit={handleSaveModal}>
              <select className="w-full p-4 border-2 border-gray-100 rounded-2xl mb-4 font-bold" value={modalForm.stage} onChange={e => setModalForm({...modalForm, stage: e.target.value})}>
                <option>المرحلة الابتدائية</option><option>المرحلة الإعدادية</option><option>المرحلة الثانوية</option>
              </select>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <select className="p-4 border-2 border-gray-100 rounded-2xl font-bold" value={modalForm.grade} onChange={e => setModalForm({...modalForm, grade: e.target.value})}>{GRADES.map(g => <option key={g} value={g}>صف {g}</option>)}</select>
                <select className="p-4 border-2 border-gray-100 rounded-2xl font-bold" value={modalForm.classLabel} onChange={e => setModalForm({...modalForm, classLabel: e.target.value})}>{CLASSES.map(c => <option key={c} value={c}>فصل {c}</option>)}</select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingCell(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">إلغاء</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold">حفظ التغييرات</button>
              </div>
              {editingCell.existingRecord && (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full py-4 mt-3 bg-red-50 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2">
                  <Trash2 size={18} /> حذف الحصة
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white p-8 rounded-[2rem] text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black mb-2">تنبيه</h3>
            <p className="text-gray-600 mb-8">هل أنت متأكد من حذف هذه الحصة؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">إلغاء</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold">نعم، احذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}