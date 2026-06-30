import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Search, GraduationCap, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { schoolStructure, generateClassId } from '../lib/schoolConfig';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function SupervisorStudentView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // الفلاتر الافتراضية
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

  useEffect(() => { fetchStudents(); }, [stage, grade, section]);

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen" dir="rtl">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
            <Users className="text-blue-600 w-8 h-8" />
          </div>
          سجل الطلاب - عرض المشرف
        </h1>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/20 self-start sm:self-auto">
          إجمالي الطلاب: {students.length}
        </div>
      </div>
      
      {/* الفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <label className="block text-sm font-black text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <Layers size={16} className="text-blue-500" /> المرحلة
          </label>
          <select 
            className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer" 
            value={stage} 
            onChange={(e) => {
              const selectedStage = e.target.value;
              setStage(selectedStage); 
              setGrade(schoolStructure[selectedStage as keyof typeof schoolStructure].years[0]);
            }}
          >
            {Object.keys(schoolStructure).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-black text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <GraduationCap size={16} className="text-blue-500" /> الصف
          </label>
          <select 
            className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer" 
            value={grade} 
            onChange={(e) => setGrade(e.target.value)}
          >
            {schoolStructure[stage as keyof typeof schoolStructure]?.years.map(g => (
              <option key={g} value={g}>
                {stage === 'Primary' ? 'Primary' : stage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-black text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <Search size={16} className="text-blue-500" /> الفصل
          </label>
          <select 
            className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer" 
            value={section} 
            onChange={(e) => setSection(e.target.value)}
          >
            {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>فصل {s}</option>)}
          </select>
        </div>
      </div>

      {/* جدول عرض الطلاب */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="p-6 text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">اسم الطالب</th>
              <th className="p-6 text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">رمز الفصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={2} className="p-20 text-center text-xl text-gray-400 font-medium">جاري التحميل...</td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s, idx) => (
                <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors cursor-default`}>
                  <td className="p-6 text-xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">{s.name}</td>
                  <td className="p-6 font-mono text-lg font-semibold text-blue-600 dark:text-blue-400">{s.class_id}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-20 text-center text-xl text-gray-400 dark:text-gray-500 font-medium">
                  لا يوجد طلاب في هذا الفصل حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}