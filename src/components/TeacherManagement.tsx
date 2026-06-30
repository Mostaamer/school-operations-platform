import React, { useState, useEffect } from 'react';
import { UserPlus, BarChart3, FileText, Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../lib/auth-context';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

interface Teacher {
  id: string;
  name: string;
  subject: string;
  role: string;
  class_id: string | null;
  assigned_stages: string[] | null;
}

export default function TeacherManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'LIST' | 'STATS' | 'REPORT'>('LIST');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // تأكد أننا نجلب كل البيانات بما فيها الـ name
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'TEACHER');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error(error);
      toast.error("فشل في تحميل بيانات المعلمين");
    } finally {
      setLoading(false);
    }
  };

  const updateTeacherClass = async (teacherId: string, newClassId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ class_id: newClassId })
        .eq('id', teacherId);

      if (error) throw error;
      toast.success('تم تحديث توزيع الفصل بنجاح');
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ أثناء التوزيع');
    }
  };

  const updateTeacherStages = async (teacherId: string, stages: string[]) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ assigned_stages: stages })
        .eq('id', teacherId);

      if (error) throw error;
      toast.success('تم تحديث المراحل بنجاح');
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث المراحل');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex gap-2 p-1 bg-white border rounded-xl w-fit shadow-sm">
        <button onClick={() => setActiveTab('LIST')} className={`px-6 py-2 rounded-lg ${activeTab === 'LIST' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>إدارة المعلمين</button>
        <button onClick={() => setActiveTab('STATS')} className={`px-6 py-2 rounded-lg ${activeTab === 'STATS' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>الإحصائيات</button>
        <button onClick={() => setActiveTab('REPORT')} className={`px-6 py-2 rounded-lg ${activeTab === 'REPORT' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>التقارير</button>
      </div>

      {activeTab === 'LIST' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-bold mb-4">قائمة أعضاء هيئة التدريس</h2>
          {loading ? <p className="text-center py-10">جاري التحميل...</p> : (
            <table className="w-full text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-3">اسم المعلم</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">المراحل التعليمية</th>
                  <th className="p-3">الفصل الموكل إليه</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="p-3 font-medium">{t.name || 'بدون اسم'}</td>
                    <td className="p-3">{t.subject || 'غير محدد'}</td>
                    <td className="p-3">
                      {user?.role === 'ADMIN' ? (
                        <div className="flex flex-col gap-1 text-[11px]">
                          {['المرحلة الابتدائية', 'المرحلة الإعدادية', 'المرحلة الثانوية'].map(stage => (
                            <label key={stage} className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(t.assigned_stages || []).includes(stage)}
                                onChange={(e) => {
                                  const currentStages = t.assigned_stages || [];
                                  const newStages = e.target.checked 
                                    ? [...currentStages, stage] 
                                    : currentStages.filter((s: string) => s !== stage);
                                  updateTeacherStages(t.id, newStages);
                                }}
                              />
                              {stage}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-600 text-xs font-bold">{(t.assigned_stages || []).join('، ')}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {user?.role === 'ADMIN' ? (
                        <select 
                          value={t.class_id || ''}
                          onChange={(e) => updateTeacherClass(t.id, e.target.value)}
                          className="border rounded p-1 w-full max-w-[150px]"
                        >
                          <option value="">غير موزع</option>
                          <option value="1/A">أولى/أ</option>
                          <option value="1/B">أولى/ب</option>
                          <option value="2/A">ثانية/أ</option>
                          <option value="2/B">ثانية/ب</option>
                        </select>
                      ) : (
                        <span className="text-blue-600 font-bold">{t.class_id || 'غير موزع'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* بقية التبويبات كما هي */}
      {activeTab === 'STATS' && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4">ملخص النشاط</h3>
          <p>إجمالي المعلمين: {teachers.length}</p>
          <p>المعلمين الموزعين على فصول: {teachers.filter(t => t.class_id).length}</p>
        </div>
      )}

      {activeTab === 'REPORT' && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="font-bold mb-4">سجل الحضور</h2>
          <p className="text-gray-500">جاري ربط البيانات بالتقارير...</p>
        </div>
      )}
    </div>
  );
}