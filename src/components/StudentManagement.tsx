import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Trash2, Edit2, AlertTriangle, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { schoolStructure, generateClassId } from '../lib/schoolConfig';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // حالات التعديل والحذف
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', stage: 'Primary', grade: '1', section: 'A' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // الفلاتر الافتراضية بناءً على الهيكل الجديد
  const [stage, setStage] = useState('Primary');
  const [grade, setGrade] = useState('1');
  const [section, setSection] = useState('A');

  const fetchStudents = async () => {
    setLoading(true);
    const classId = generateClassId(stage, grade, section);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('name');

    if (error) toast.error('خطأ في جلب البيانات');
    else setStudents(data || []);
    setLoading(false);
  };

  // وظيفة حفظ التعديلات الشاملة (الاسم + المرحلة + الصف + الفصل)
  const handleUpdate = async (id: string) => {
    const newClassId = generateClassId(editData.stage, editData.grade, editData.section);
    const { error } = await supabase
      .from('students')
      .update({ name: editData.name, class_id: newClassId })
      .eq('id', id);
    
    if (error) toast.error('فشل التعديل');
    else {
      toast.success('تم تحديث البيانات ونقل الطالب بنجاح');
      setEditingId(null);
      fetchStudents();
    }
  };

  // حذف طالب واحد
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('students').delete().eq('id', deleteId);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف بنجاح');
      setDeleteId(null);
      fetchStudents();
    }
  };

  // مسح الفصل بالكامل
  const handleClearClass = async () => {
    const classId = generateClassId(stage, grade, section);
    const { error } = await supabase.from('students').delete().eq('class_id', classId);
    if (error) toast.error('فشل مسح الفصل');
    else {
      toast.success('تم مسح جميع طلاب الفصل');
      setShowClearConfirm(false);
      fetchStudents();
    }
  };

  useEffect(() => { fetchStudents(); }, [stage, grade, section]);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* العنوان وإجمالي الطلاب */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Users className="text-blue-600" /> إدارة الطلاب
        </h1>
        <div className="flex gap-2">
          {students.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 font-bold transition">
              <Trash size={16} /> مسح الكل
            </button>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl text-blue-700 dark:text-blue-300 font-bold border">
            الطلاب: {students.length}
          </div>
        </div>
      </div>
      
      {/* الفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">المرحلة</label>
          <select 
            className="w-full p-3 bg-gray-50 dark:bg-slate-900 border-none rounded-xl" 
            value={stage} 
            onChange={(e) => {
              const selectedStage = e.target.value;
              setStage(selectedStage); 
              setGrade(schoolStructure[selectedStage as keyof typeof schoolStructure].years[0]);
            }}
          >
            {Object.keys(schoolStructure).map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">الصف</label>
          <select 
            className="w-full p-3 bg-gray-50 dark:bg-slate-900 border-none rounded-xl" 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
          >
            {schoolStructure[stage as keyof typeof schoolStructure]?.years.map((g: string) => (
              <option key={g} value={g}>
                {stage === 'Primary' ? 'Primary' : stage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-2">الفصل</label>
          <select 
            className="w-full p-3 bg-gray-50 dark:bg-slate-900 border-none rounded-xl" 
            value={section} 
            onChange={(e) => setSection(e.target.value)}
          >
            {['A', 'B', 'C', 'D', 'E'].map((s: string) => <option key={s} value={s}>فصل {s}</option>)}
          </select>
        </div>
      </div>

      {/* جدول عرض الطلاب */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">اسم الطالب</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">رمز الفصل</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">جاري تحميل البيانات...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">لا يوجد طلاب في هذا الفصل</td>
              </tr>
            ) : (
              students.map((s: any) => (
                <tr key={s.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="p-4 font-medium">{s.name}</td>
                  <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-400">{s.class_id}</td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => { setEditingId(s.id); setEditData({ name: s.name, stage, grade, section }); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => setDeleteId(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* مودال التعديل الشامل */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-md border">
            <h3 className="text-xl font-bold mb-4">تعديل بيانات الطالب ونقله</h3>
            <input className="w-full p-3 border rounded-xl mb-3" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} placeholder="اسم الطالب" />
            
            <div className="grid grid-cols-3 gap-2 mb-4">
               <select 
                 className="p-3 border rounded-xl text-xs" 
                 value={editData.stage} 
                 onChange={(e) => {
                   const selectedStage = e.target.value;
                   setEditData({
                     ...editData, 
                     stage: selectedStage, 
                     grade: schoolStructure[selectedStage as keyof typeof schoolStructure].years[0]
                   });
                 }}
               >
                  {Object.keys(schoolStructure).map((s: string) => <option key={s} value={s}>{s}</option>)}
               </select>
               
               <select 
                 className="p-3 border rounded-xl text-xs" 
                 value={editData.grade} 
                 onChange={(e) => setEditData({...editData, grade: e.target.value})}
               >
                  {schoolStructure[editData.stage as keyof typeof schoolStructure]?.years.map((g: string) => (
                    <option key={g} value={g}>
                      {editData.stage === 'Primary' ? 'Primary' : editData.stage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
                    </option>
                  ))}
               </select>

               <select 
                 className="p-3 border rounded-xl text-xs" 
                 value={editData.section} 
                 onChange={(e) => setEditData({...editData, section: e.target.value})}
               >
                  {['A', 'B', 'C', 'D', 'E'].map((s: string) => <option key={s} value={s}>فصل {s}</option>)}
               </select>
            </div>
            <button onClick={() => handleUpdate(editingId)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-2">حفظ التغييرات</button>
            <button onClick={() => setEditingId(null)} className="w-full py-3 bg-gray-100 rounded-xl font-bold dark:bg-slate-700 dark:text-white">إلغاء</button>
          </div>
        </div>
      )}

      {/* مودال الحذف الفردي */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">هل أنت متأكد؟</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">نعم، حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال مسح الفصل */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border-red-200">
            <Trash className="mx-auto text-red-600 mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">مسح الفصل بالكامل؟</h3>
            <p className="text-gray-500 mb-6">سيتم حذف كل الطلاب من الصف ({stage === 'Primary' ? 'Primary' : stage === 'Preparatory' ? 'Prep' : 'Secondary'} {grade}) بشكل نهائي.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={handleClearClass} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">مسح الكل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}