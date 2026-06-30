import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../lib/auth-context';
import { Student, StudentTrackingLog } from '../lib/types';

const supabase = createClient("https://wwgchgvykykeapbnivmr.supabase.co", "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv");

export default function ClassroomTracking() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data: sData } = await supabase.from('students').select('*');
    const { data: lData } = await supabase.from('student_tracking').select('*').eq('date', today);
    
    setStudents(sData || []);
    const newData: any = {};
    (sData || []).forEach(s => {
      newData[s.id] = lData?.find(l => l.studentId === s.id) || { studentId: s.id, date: today, attendance: 'PRESENT', behavior: 'EXCELLENT', teacherNotes: '' };
    });
    setTrackingData(newData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    const logsToSave = Object.values(trackingData).map(log => ({
      ...log,
      updated_by: user?.name || 'معلم',
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase.from('student_tracking').upsert(logsToSave);
    error ? toast.error('خطأ في الحفظ') : toast.success('تم إرسال البيانات للمشرف');
    setIsSaving(false);
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">المتابعة اليومية</h1>
      <table className="w-full text-right border-collapse bg-white rounded-lg shadow-sm">
        <thead><tr className="border-b bg-gray-50">
          <th className="p-4">الطالب</th>
          <th className="p-4">السلوك</th>
          <th className="p-4">ملاحظات</th>
        </tr></thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="border-b">
              <td className="p-4 font-medium">{s.fullName}</td>
              <td className="p-4">
                <select 
                  className={`p-2 border rounded ${trackingData[s.id]?.behavior === 'NEEDS_ATTENTION' ? 'text-red-600 font-bold' : ''}`}
                  value={trackingData[s.id]?.behavior} 
                  onChange={(e) => setTrackingData({...trackingData, [s.id]: {...trackingData[s.id], behavior: e.target.value}})}
                >
                  <option value="EXCELLENT">ممتاز</option>
                  <option value="NEEDS_ATTENTION">يحتاج متابعة</option>
                </select>
              </td>
              <td className="p-4"><input className="border rounded p-2 w-full" value={trackingData[s.id]?.teacherNotes || ''} onChange={(e) => setTrackingData({...trackingData, [s.id]: {...trackingData[s.id], teacherNotes: e.target.value}})} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSaveAll} className="bg-blue-600 text-white px-6 py-2 mt-4 rounded-lg flex items-center gap-2">
        <Save size={18}/> {isSaving ? 'جاري الحفظ...' : 'حفظ وإرسال'}
      </button>
    </div>
  );
}