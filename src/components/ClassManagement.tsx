import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Check, Save, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

// تهيئة الاتصال بـ Supabase الخاص بك
const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function ClassManagement() {
  // التبويب النشط حالياً (إضافة طالب، إضافة جماعية، توزيع المعلمين) طابقاً للصورة
  const [activeTab, setActiveTab] = useState<'single' | 'group' | 'assign'>('single');
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);

  // الخيارات الثابتة للهيكل الهرمي
  const grades = [
    { code: 'PRI', name: 'المرحلة الابتدائية' },
    { code: 'PRE', name: 'المرحلة الإعدادية' },
    { code: 'SEC', name: 'المرحلة الثانوية' }
  ];
  const years = ['الصف الأول', 'الصف الثاني', 'الصف الثالث'];
  const sections = ['أ', 'ب', 'ج', 'د', 'هـ'];

  // الحالات المشتركة للاختيار الهرمي (المرحلة -> الصف -> الفصل)
  const [selectedGrade, setSelectedGrade] = useState('PRI');
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSection, setSelectedSection] = useState('أ');

  // مدخلات الطلاب
  const [singleStudentName, setSingleStudentName] = useState('');
  const [groupStudentsInput, setGroupStudentsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // حالة المعلم المختار في تبويب التوزيع
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // جلب المعلمين من جدول users بالسحابة
  const loadTeachers = async () => {
    try {
      setLoading(false);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'TEACHER');
      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('فشل في جلب قائمة المعلمين من السحابة');
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // دالة الحفظ الموحدة للطلاب (فردي أو جماعي)
  const handleSaveStudents = async () => {
    let namesArray: string[] = [];

    if (activeTab === 'single') {
      if (!singleStudentName.trim()) {
        toast.error('الرجاء كتابة اسم الطالب أولاً');
        return;
      }
      namesArray = [singleStudentName.trim()];
    } else {
      if (!groupStudentsInput.trim()) {
        toast.error('الرجاء كتابة قائمة أسماء الطلاب');
        return;
      }
      namesArray = groupStudentsInput
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0);
    }

    setIsSaving(true);
    try {
      // تكوين المعرف المركب الهرمي (مثال: PRI-1-أ)
      const combinedClassId = `${selectedGrade}-${selectedYear}-${selectedSection}`;

      // تجهيز الصفوف لجدول students
      const insertRows = namesArray.map(name => ({
        name: name,
        class_id: combinedClassId // العمود الفعلي في قاعدة البيانات
      }));

      const { error } = await supabase
        .from('students')
        .insert(insertRows);

      if (error) {
        console.error(error);
        toast.error(`فشل الحفظ في السحابة: ${error.message}`);
        return;
      }

      toast.success(activeTab === 'single' ? 'تم حفظ الطالب بنجاح' : `تم حفظ ${namesArray.length} طالب بنجاح`);
      setSingleStudentName('');
      setGroupStudentsInput('');
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  // دالة حفظ توزيع المعلم في جدول users
  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) {
      toast.error('الرجاء اختيار المعلم أولاً');
      return;
    }

    setIsSaving(true);
    try {
      const combinedClassId = `${selectedGrade}-${selectedYear}-${selectedSection}`;

      const { error } = await supabase
        .from('users')
        .update({ class_id: combinedClassId })
        .eq('id', selectedTeacherId);

      if (error) {
        console.error(error);
        toast.error(`فشل توزيع المعلم: ${error.message}`);
        return;
      }

      toast.success('تم حفظ وتثبيت توزيع المعلم في قاعدة البيانات');
      loadTeachers(); // تحديث القائمة
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 font-sans" dir="rtl">
      
      {/* هيدر الصفحة المماثل لـ image_31f65a.png */}
      <div className="flex items-center gap-2 border-b pb-4 text-gray-800">
        <Users className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">إدارة الطلاب والفصول</h1>
      </div>

      {/* الحاوية الرئيسية المطابقة لتصميم البرنامج */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        
        {/* أزرار التبويبات العلوية (نفس ترتيب صورتك) */}
        <div className="flex justify-end gap-2 border-b pb-4">
          <button
            onClick={() => setActiveTab('assign')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'assign' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            توزيع المعلمين
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'group' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            إضافة جماعية
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            إضافة طالب
          </button>
        </div>

        {/* الجزء الهرمي المشترك المطلوب (المرحلة -> الصف -> الفصل) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">1. اختر المرحلة الدراسية</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)} 
              className="w-full border rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {grades.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">2. اختر الصف الدراسي</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="w-full border rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y, index) => <option key={index} value={String(index + 1)}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">3. اختر الفصل</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)} 
              className="w-full border rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {sections.map(s => <option key={s} value={s}>فصل {s}</option>)}
            </select>
          </div>
        </div>

        {/* الحقول المتغيرة بناءً على التبويب المفتوح */}
        
        {/* تبويب: إضافة طالب فردي */}
        {activeTab === 'single' && (
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-bold text-gray-800">اسم الطالب الجديد ثلاثي</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={singleStudentName}
                onChange={(e) => setSingleStudentName(e.target.value)}
                placeholder="اكتب اسم الطالب هنا واضغط حفظ..."
                className="w-full border rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveStudents}
                disabled={isSaving}
                className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ الطالب'}
              </button>
            </div>
          </div>
        )}

        {/* تبويب: إضافة جماعية للطلاب */}
        {activeTab === 'group' && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-gray-800">قائمة أسماء الطلاب (اسم في كل سطر للتخزين المجمع)</label>
              <button
                onClick={handleSaveStudents}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري رفع القائمة...' : 'حفظ كافة الطلاب بالسحابة'}
              </button>
            </div>
            <textarea
              rows={6}
              value={groupStudentsInput}
              onChange={(e) => setGroupStudentsInput(e.target.value)}
              placeholder="انسخ الأسماء هنا، مثال:&#10;محمد أحمد السعيد&#10;كريم محمود عبد الله&#10;يوسف رأفت علي"
              className="w-full border rounded-xl p-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>
        )}

        {/* تبويب: توزيع المعلمين الهرمي الصرف */}
        {activeTab === 'assign' && (
          <div className="space-y-4 pt-2">
            <label className="block text-sm font-bold text-gray-800">اختر المعلم من قاعدة البيانات لربطه بالهيكل المختار أعلاه</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-3">
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- اضغط لفتح قائمة المعلمين المزامنة مع الكلاود --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (مادة: {t.subject || 'لم تحدد'}) {t.class_id ? `[موزع حالياً: ${t.class_id}]` : '[غير موزع]'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssignTeacher}
                disabled={isSaving}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'جاري تثبيت التوزيع...' : 'تأكيد وحفظ التوزيع'}
              </button>
            </div>

            {/* تمثيل مرئي للفصول يطابق واجهة المدرسين المقترحة لتأكيد الربط الفوري */}
            <div className="mt-4 border-t pt-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-bold flex items-center gap-2">
                <Layers className="w-4 h-4" />
                المعرف النشط الذي سيتم حفظه وتمريره الآن في حقول قاعدة البيانات هو: 
                <span className="bg-blue-200 px-2 py-0.5 rounded text-blue-900 text-sm">
                  {selectedGrade}-{selectedYear}-{selectedSection}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}