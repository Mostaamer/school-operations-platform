import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/auth-context'; 
import { 
  Loader2, Plus, Edit2, Trash2, Search, User, 
  ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, X, Filter,
  Clock, ShieldAlert, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
// إدراج نفس الإعدادات المستخدمة في صفحة المدير
import { schoolStructure, generateClassId } from '../lib/schoolConfig';

// --- الواجهات (Interfaces) ---
interface Student {
  id: number;
  name: string;
  class_id: string; 
}

interface BehaviorRecord {
  id: number;
  student_id: number;
  teacher_id: number;
  teacher_name: string;
  behavior_type: 'إيجابي' | 'سلبي';
  category: string;
  points: number;
  note: string;
  class_name: string;
  status: string;
  created_at: string;
  grade?: string;
  stage?: string;
  section?: string;
}

const CATEGORIES = [
  'المشاركة والتفاعل',
  'الالتزام بالواجبات',
  'احترام الزملاء والمعلمين',
  'التأخر عن الحصة',
  'الغياب المتكرر',
  'إثارة الفوضى',
  'أخرى'
];

export default function TeacherBehavior() {
  const { user } = useAuth();
  
  const [dbTeacher, setDbTeacher] = useState<{ id: number, name: string } | null>(null);

  // استخدام نفس القيم الافتراضية للمدير
  const [selectedStage, setSelectedStage] = useState<string>('Primary');
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [todayRecords, setTodayRecords] = useState<BehaviorRecord[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingRecord, setEditingRecord] = useState<BehaviorRecord | null>(null);
  
  const [formData, setFormData] = useState({
    behavior_type: 'إيجابي',
    category: CATEGORIES[0],
    points: 5,
    note: ''
  });

  // دالة لترجمة حالة السجل من المشرف
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black"><Clock size={10}/> معلق</span>;
      case 'investigating':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black"><ShieldAlert size={10}/> جاري التحقيق</span>;
      case 'resolved':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black"><CheckCircle2 size={10}/> تم الحل</span>;
      default:
        return null;
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let currentTeacherId = 1; 
      let currentTeacherName = user.name || 'معلم';

      const { data: teacherData, error: teacherError } = await supabase
        .from('users')
        .select('id, name') 
        .eq('employeeCode', user.employeeCode)
        .maybeSingle();
        
      if (teacherError) throw teacherError;
        
      if (teacherData) {
        currentTeacherId = teacherData.id;
        if (teacherData.name) currentTeacherName = teacherData.name;
      }
      
      setDbTeacher({ id: currentTeacherId, name: currentTeacherName });

      // استخدام نفس دالة التوليد المستخدمة عند المدير
      const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', targetClassId);
        
      if (studentsError) throw studentsError;
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const { data: recordsData, error: recordsError } = await supabase
        .from('behavior_records')
        .select('*')
        .eq('teacher_id', currentTeacherId)
        .gte('created_at', startOfToday.toISOString());
        
      if (recordsError && recordsError.code !== '42P01') throw recordsError;

      setStudents(studentsData || []);
      setTodayRecords(recordsData || []);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStage, selectedGrade, selectedSection, user]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const openModal = (student: Student, record?: BehaviorRecord, defaultType: 'إيجابي' | 'سلبي' = 'إيجابي') => {
    setSelectedStudent(student);
    if (record) {
      setFormData({
        behavior_type: record.behavior_type as 'إيجابي' | 'سلبي',
        category: record.category,
        points: Math.abs(record.points),
        note: record.note || ''
      });
      setEditingRecord(record);
    } else {
      setEditingRecord(null);
      setFormData({
        behavior_type: defaultType,
        category: CATEGORIES[0],
        points: 5,
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !user) return;
    
    setIsSubmitting(true);
    
    // استخدام نفس دالة التوليد
    const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);

    const payload = {
      student_id: selectedStudent.id,
      teacher_id: dbTeacher?.id || 1,
      teacher_name: dbTeacher?.name || user.name || 'معلم',
      behavior_type: formData.behavior_type,
      category: formData.category,
      points: formData.behavior_type === 'سلبي' ? -Math.abs(formData.points) : Math.abs(formData.points),
      note: formData.note,
      class_name: targetClassId,
      stage: selectedStage,   
      grade: selectedGrade,    
      section: selectedSection, 
      status: editingRecord ? editingRecord.status : 'active' 
    };

    try {
      if (editingRecord) {
        if (editingRecord.status !== 'active') {
          toast.error('لا يمكن تعديل هذا السجل نظراً لاتخاذ إجراء فيه من قبل المشرف');
          return;
        }
        const { error } = await supabase.from('behavior_records').update(payload).eq('id', editingRecord.id);
        if (error) throw error;
        toast.success('تم تعديل السلوك بنجاح');
      } else {
        const { error } = await supabase.from('behavior_records').insert([payload]);
        if (error) throw error;
        toast.success('تم تسجيل السلوك بنجاح');
      }
      closeModal();
      fetchData(); 
    } catch (error: any) {
      console.error("Supabase Error:", error);
      toast.error(`خطأ: ${error.message || 'فشل الحفظ'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (record: BehaviorRecord) => {
    if (record.status !== 'active') {
      toast.error('لا يمكن حذف هذا السجل لأن المشرف بدأ في مراجعته أو حله');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      const { error } = await supabase.from('behavior_records').delete().eq('id', record.id);
      if (error) throw error;
      toast.success('تم حذف السجل بنجاح');
      fetchData();
    } catch (error: any) {
      toast.error(`خطأ أثناء الحذف: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* الرأس */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <User className="text-blue-600 w-8 h-8" />
            سجل السلوك اليومي
          </h1>
          <p className="text-gray-500 mt-2 font-medium">اختر المرحلة والصف والفصل لعرض الطلاب وتقييمهم.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ابحث عن اسم طالب..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-medium bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      {/* منطقة الفلاتر - موحدة مع المدير بالكامل */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-blue-800 font-black w-full md:w-auto ml-4">
          <Filter className="w-5 h-5" />
          <span>تحديد الفصل:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">المرحلة</label>
            <select 
              value={selectedStage} 
              onChange={(e) => {
                const newStage = e.target.value;
                setSelectedStage(newStage);
                setSelectedGrade(schoolStructure[newStage as keyof typeof schoolStructure].years[0]);
              }}
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none cursor-pointer hover:border-blue-300 transition-colors"
            >
              {Object.keys(schoolStructure).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">الصف</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none cursor-pointer hover:border-blue-300 transition-colors"
            >
              {schoolStructure[selectedStage as keyof typeof schoolStructure]?.years.map((g: string) => (
                <option key={g} value={g}>
                  {selectedStage === 'Primary' ? 'Primary' : selectedStage === 'Preparatory' ? 'Prep' : 'Secondary'} {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">الفصل (الشعبة)</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none cursor-pointer hover:border-blue-300 transition-colors"
            >
              {['A', 'B', 'C', 'D', 'E'].map((s: string) => <option key={s} value={s}>فصل {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* جدول الطلاب (مقسم إيجابي وسلبي) */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <span className="text-gray-500 font-bold">جاري تحميل بيانات الطلاب...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-5 font-black w-1/4 text-gray-700 border-l border-gray-100">اسم الطالب</th>
                  <th className="p-5 font-black w-1/3 text-green-700 bg-green-50/50 border-l border-green-100">🌟 السجل الإيجابي اليوم</th>
                  <th className="p-5 font-black w-1/3 text-red-700 bg-red-50/50">⚠️ السجل السلبي اليوم</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-bold text-lg">لا يوجد طلاب مسجلين في هذا الفصل.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentRecords = todayRecords.filter(r => r.student_id === student.id);
                    const positiveRecords = studentRecords.filter(r => r.behavior_type === 'إيجابي');
                    const negativeRecords = studentRecords.filter(r => r.behavior_type === 'سلبي');

                    return (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        
                        {/* عمود الطالب */}
                        <td className="p-4 border-l border-gray-100 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-800">{student.name}</span>
                          </div>
                        </td>
                        
                        {/* عمود السلوك الإيجابي (الناحية الأولى) */}
                        <td className="p-4 border-l border-green-100 bg-green-50/20 align-top relative group">
                          <div className="flex flex-col gap-2">
                            {positiveRecords.map(record => {
                              const isLocked = record.status && record.status !== 'active';
                              return (
                                <div key={record.id} className="flex justify-between items-start bg-white border border-green-200 p-2 rounded-xl shadow-sm">
                                  <div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 mb-1">
                                      <ThumbsUp className="w-3 h-3" /> {record.category}
                                    </span>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md font-black">+{record.points} نقطة</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {!isLocked ? (
                                      <>
                                        <button onClick={() => openModal(student, record, 'إيجابي')} className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 rounded"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={() => handleDelete(record)} className="p-1 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                      </>
                                    ) : (
                                      <span className="p-1 text-amber-600 bg-amber-50 rounded" title="مغلق من قبل المشرف"><Lock className="w-3 h-3" /></span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            <button 
                              onClick={() => openModal(student, undefined, 'إيجابي')} 
                              className="mt-2 w-full py-2 border-2 border-dashed border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" /> إضافة سلوك إيجابي
                            </button>
                          </div>
                        </td>

                        {/* عمود السلوك السلبي (الناحية الثانية) */}
                        <td className="p-4 bg-red-50/20 align-top relative group">
                          <div className="flex flex-col gap-2">
                            {negativeRecords.map(record => {
                              const isLocked = record.status && record.status !== 'active';
                              return (
                                <div key={record.id} className="flex flex-col gap-2 bg-white border border-red-200 p-2 rounded-xl shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="flex items-center gap-1 text-xs font-bold text-red-700 mb-1">
                                        <ThumbsDown className="w-3 h-3" /> {record.category}
                                      </span>
                                      <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-black">{record.points} نقطة</span>
                                    </div>
                                    <div className="flex gap-1">
                                      {!isLocked ? (
                                        <>
                                          <button onClick={() => openModal(student, record, 'سلبي')} className="p-1 text-gray-400 hover:text-blue-600 bg-gray-50 rounded"><Edit2 className="w-3 h-3" /></button>
                                          <button onClick={() => handleDelete(record)} className="p-1 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                        </>
                                      ) : (
                                        <span className="p-1 text-amber-600 bg-amber-50 rounded" title="مغلق من قبل المشرف"><Lock className="w-3 h-3" /></span>
                                      )}
                                    </div>
                                  </div>
                                  {/* إظهار حالة المشرف */}
                                  <div className="mt-1 pt-1 border-t border-red-50">
                                    {getStatusBadge(record.status || 'active')}
                                  </div>
                                </div>
                              );
                            })}
                            <button 
                              onClick={() => openModal(student, undefined, 'سلبي')} 
                              className="mt-2 w-full py-2 border-2 border-dashed border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" /> إضافة سلوك سلبي
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة الإضافة/التعديل */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`p-5 flex justify-between items-center ${formData.behavior_type === 'إيجابي' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {formData.behavior_type === 'إيجابي' ? <ThumbsUp /> : <ThumbsDown />}
                {editingRecord ? 'تعديل السلوك' : 'تسجيل سلوك جديد'} - {selectedStudent.name}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">النوع</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormData({...formData, behavior_type: 'إيجابي'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.behavior_type === 'إيجابي' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>إيجابي</button>
                  <button type="button" onClick={() => setFormData({...formData, behavior_type: 'سلبي'})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.behavior_type === 'سلبي' ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-gray-50 text-gray-500 border-2 border-transparent'}`}>سلبي</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none bg-gray-50">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">النقاط ({formData.behavior_type === 'سلبي' ? 'سيتم خصمها' : 'سيتم إضافتها'})</label>
                <input type="number" min="1" max="100" value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea rows={3} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none bg-gray-50 resize-none" placeholder="اكتب أي تفاصيل إضافية هنا..."></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all ${formData.behavior_type === 'إيجابي' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}