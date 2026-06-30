import React, { useState } from 'react';
import { UserPlus, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { schoolStructure, generateClassId } from '../lib/schoolConfig';

// تهيئة الاتصال المباشر بـ Supabase
const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function StudentEnrollment() {
  // التبديل فقط بين إضافة طالب فردي أو إضافة جماعية للفصول
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [isSaving, setIsSaving] = useState(false);
  
  // الفصول الموحدة لتطابق صفحة الإدارة
  const sections = ['A', 'B', 'C', 'D', 'E'];

  // حالات النماذج للطلاب متوافقة مع الهيكل المركزي الجديد
  const [newStudent, setNewStudent] = useState({ fullName: '', stage: 'Primary', grade: '1', section: 'A' });
  const [bulkInput, setBulkInput] = useState('');
  const [bulkConfig, setBulkConfig] = useState({ stage: 'Primary', grade: '1', section: 'A' });

  // 1. إضافة طالب منفرد إلى جدول students السحابي
  const handleSingleSubmit = async () => {
    if (!newStudent.fullName.trim()) {
      toast.error('الرجاء إدخال اسم الطالب');
      return;
    }

    setIsSaving(true);
    try {
      const combinedClassId = generateClassId(newStudent.stage, newStudent.grade, newStudent.section);

      const { error } = await supabase
        .from('students')
        .insert([{ name: newStudent.fullName.trim(), class_id: combinedClassId }]);

      if (error) throw error;

      toast.success('تمت إضافة الطالب وحفظه بالسحابة بنجاح');
      setNewStudent({ ...newStudent, fullName: '' });
    } catch (error: any) {
      toast.error(`فشل الحفظ: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 2. إضافة جماعية للطلاب إلى جدول students السحابي
  const handleBulkSubmit = async () => {
    if (!bulkInput.trim()) {
      toast.error('الرجاء إدخال أسماء الطلاب أولاً');
      return;
    }

    setIsSaving(true);
    try {
      const namesArray = bulkInput.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      const combinedClassId = generateClassId(bulkConfig.stage, bulkConfig.grade, bulkConfig.section);

      const insertRows = namesArray.map(name => ({
        name: name,
        class_id: combinedClassId
      }));

      const { error } = await supabase
        .from('students')
        .insert(insertRows);

      if (error) throw error;

      toast.success(`تم بنجاح حفظ السجل المجمع لـ ${namesArray.length} طالب`);
      setBulkInput('');
    } catch (error: any) {
      toast.error(`فشل الرفع المجمع: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2 border-b pb-4 text-gray-900">
        <UserPlus className="w-6 h-6 text-blue-600" /> إدارة وقبول الطلاب بالفصول
      </h1>

      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-6">
        
        {/* تبويبات التنقل الخاصة بالطلاب فقط */}
        <div className="flex gap-2 border-b pb-4">
          <button 
            onClick={() => setActiveTab('SINGLE')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'SINGLE' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            إضافة طالب فردي
          </button>
          <button 
            onClick={() => setActiveTab('BULK')} 
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'BULK' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            قبول مجمع بالفصل
          </button>
        </div>

        {/* التبويب الأول: إضافة طالب فردي */}
        {activeTab === 'SINGLE' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم الطالب رباعي</label>
              <input 
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="أدخل اسم الطالب الكامل" 
                value={newStudent.fullName} 
                onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">المرحلة الدراسية</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-white" 
                  value={newStudent.stage} 
                  onChange={(e) => {
                    const selectedStage = e.target.value;
                    setNewStudent({
                      ...newStudent, 
                      stage: selectedStage, 
                      grade: schoolStructure[selectedStage as keyof typeof schoolStructure].years[0]
                    });
                  }}
                >
                  {Object.keys(schoolStructure).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الصف</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-white" 
                  value={newStudent.grade} 
                  onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                >
                  {schoolStructure[newStudent.stage as keyof typeof schoolStructure]?.years.map(g => (
                    <option key={g} value={g}>
                      {newStudent.stage === 'Primary' ? 'Primary' : newStudent.stage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الفصل</label>
                <select className="w-full p-2 border rounded-lg text-sm bg-white" value={newStudent.section} onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}>
                  {sections.map(s => <option key={s} value={s}>فصل {s}</option>)}
                </select>
              </div>
            </div>
            
            <button 
              onClick={handleSingleSubmit} 
              disabled={isSaving} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all pt-2"
            >
              <Save size={16}/> {isSaving ? 'جاري الحفظ بالسحابة...' : 'تثبيت الطالب في الفصل'}
            </button>
          </div>
        )}

        {/* التبويب الثاني: إضافة جماعية */}
        {activeTab === 'BULK' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">تحديد المرحلة المستهدفة</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-white" 
                  value={bulkConfig.stage} 
                  onChange={(e) => {
                    const selectedStage = e.target.value;
                    setBulkConfig({ 
                      ...bulkConfig, 
                      stage: selectedStage, 
                      grade: schoolStructure[selectedStage as keyof typeof schoolStructure].years[0]
                    });
                  }}
                >
                  {Object.keys(schoolStructure).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الصف</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-white" 
                  value={bulkConfig.grade} 
                  onChange={(e) => setBulkConfig({...bulkConfig, grade: e.target.value})}
                >
                  {schoolStructure[bulkConfig.stage as keyof typeof schoolStructure]?.years.map(g => (
                    <option key={g} value={g}>
                      {bulkConfig.stage === 'Primary' ? 'Primary' : bulkConfig.stage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">الفصل</label>
                <select className="w-full p-2 border rounded-lg text-sm bg-white" value={bulkConfig.section} onChange={(e) => setBulkConfig({...bulkConfig, section: e.target.value})}>
                  {sections.map(s => <option key={s} value={s}>فصل {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">قائمة أسماء الفصـل (اسم كل طالب في سطر منفصل)</label>
              <textarea 
                className="w-full h-44 p-3 border rounded-lg text-sm bg-white font-sans focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="أحمد محمد علي&#10;محمود خالد حسن&#10;مصطفى إبراهيم صابر" 
                value={bulkInput} 
                onChange={(e) => setBulkInput(e.target.value)} 
              />
            </div>

            <button 
              onClick={handleBulkSubmit} 
              disabled={isSaving} 
              className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              <Upload size={16}/> {isSaving ? 'جاري رفع وتسكين القائمة...' : 'حفظ قائمة الفصل بالسحابة'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}