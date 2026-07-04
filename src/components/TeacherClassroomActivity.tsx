import React, { useState, useEffect } from 'react';
import { supabase, useAuth } from '../lib/auth-context'; 
import { Gamepad2, Filter, Loader2, User, Trophy, Star, Plus, Minus, FileText, Trash2, ChevronDown, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==========================================
// 0. الثوابت والهياكل (School Structure & Helpers)
// ==========================================
export const schoolStructure = {
  'Primary': { code: 'PRI', years: ['1', '2', '3', '4', '5', '6'], label: 'الابتدائية' },
  'Preparatory': { code: 'PRE', years: ['1', '2', '3'], label: 'الإعدادية' },
  'Secondary': { code: 'SEC', years: ['1', '2', '3'], label: 'الثانوية' }
};

export const generateClassId = (st: string, gr: string, se: string) => {
  const stageObj = schoolStructure[st as keyof typeof schoolStructure];
  if (!stageObj) return '';
  return `${stageObj.code}-${gr}-${se}`;
};

// ==========================================
// 1. تعريف الأنواع (TypeScript Interfaces)
// ==========================================
interface Student {
  id: number;
  name: string; 
  class_id: string; 
  total_points: number;
}

const TeacherClassroomActivity: React.FC = () => {
  const { user } = useAuth();
  
  // حالات الفلتر
  const [selectedStage, setSelectedStage] = useState<string>('Secondary');
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  
  // حالات البيانات
  const [activeStageCode, setActiveStageCode] = useState<string>('SEC');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // حالات القوائم والتقييم
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [showReportMenu, setShowReportMenu] = useState<boolean>(false);
  const [showResetMenu, setShowResetMenu] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ==========================================
  // 2. المنطق (Logic & Data Fetching)
  // ==========================================
  
  const fetchStudents = async () => {
    if (!selectedStage || !selectedGrade || !selectedSection) return;
    
    setLoading(true);
    try {
      const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);
      const stageCode = schoolStructure[selectedStage as keyof typeof schoolStructure].code;
      setActiveStageCode(stageCode);

      const { data, error } = await supabase
        .from('students')
        .select('id, name, class_id, total_points') 
        .eq('class_id', targetClassId)
        .order('total_points', { ascending: false });

      if (error) throw error;
      setStudents((data as Student[]) || []);
    } catch (error: any) {
      console.error('خطأ في جلب الطلاب:', error);
      toast.error('حدث خطأ أثناء جلب بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedStage, selectedGrade, selectedSection]);

  const handleReasonChange = (studentId: number, value: string) => {
    setReasons(prev => ({ ...prev, [studentId]: value }));
  };

  const handlePointChange = async (studentId: number, change: number) => {
    if (!user?.id) {
      toast.error('يجب تسجيل الدخول لإضافة/خصم النقاط');
      return;
    }

    const currentTeacherId = Number(user.id);
    const studentToUpdate = students.find(s => s.id === studentId);
    const currentPoints = studentToUpdate?.total_points || 0;
    
    const newTotal = Math.max(0, currentPoints + change); 
    const actualChange = newTotal - currentPoints; 

    if (actualChange === 0 && change < 0) {
      toast.error('رصيد الطالب صفر بالفعل!');
      return;
    }

    const defaultReason = change > 0 ? 'مشاركة تفاعلية' : 'خصم نقاط';
    const reasonText = reasons[studentId]?.trim() || defaultReason;

    // تحديث فوري للواجهة
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, total_points: newTotal } : s);
      return updated.sort((a, b) => b.total_points - a.total_points);
    });

    try {
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert([{ student_id: studentId, teacher_id: currentTeacherId, points_added: actualChange, reason: reasonText }]);

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('students')
        .update({ total_points: newTotal })
        .eq('id', studentId);
        
      if (updateError) throw updateError;

      toast.success(change > 0 ? 'تمت إضافة النقطة' : 'تم خصم النقطة');
      setReasons(prev => ({ ...prev, [studentId]: '' }));
    } catch (error: any) {
      console.error('خطأ:', error);
      toast.error('حدث خطأ أثناء حفظ التقييم');
      fetchStudents(); 
    }
  };

  // ------------------------------------------
  // التقارير والتصفير 
  // ------------------------------------------

  const handleGenerateReport = async (periodLabel: string) => {
    if (!students.length) {
      toast.error('لا يوجد طلاب لتوليد تقرير لهم.');
      return;
    }
    
    setIsProcessing(true);
    setShowReportMenu(false);

    try {
      const doc = new jsPDF();
      
      // جلب خط عربي ودمجه في الـ PDF لتصحيح الرموز الغريبة
      const fontUrl = 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/fonts/ttf/Vazirmatn-Regular.ttf';
      const response = await fetch(fontUrl);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      const base64Font = window.btoa(binary);

      doc.addFileToVFS('ArabicFont.ttf', base64Font);
      doc.addFont('ArabicFont.ttf', 'ArabicFont', 'normal');
      doc.setFont('ArabicFont');
      
      // ترجمة اسم التقرير للعربية
      const periodNameAr = periodLabel === 'Weekly' ? 'الأسبوعي' : periodLabel === 'Monthly' ? 'الشهري' : 'السنوي';
      
      doc.setFontSize(18);
      doc.text(`تقرير أداء الطلاب - ${periodNameAr}`, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      const stageName = schoolStructure[selectedStage as keyof typeof schoolStructure].label;
      // توضيح اسم المرحلة والصف والفصل بدقة
      const headerText = `المرحلة: ${stageName} | الصف: ${selectedGrade} | الفصل: ${selectedSection}`;
      doc.text(headerText, 105, 30, { align: 'center' });

      autoTable(doc, {
        head: [['المركز', 'اسم الطالب', 'إجمالي النقاط']],
        body: students.map((student, index) => [
          (index + 1).toString(),
          student.name,
          `${student.total_points || 0}`
        ]),
        startY: 40,
        theme: 'grid',
        styles: { 
          font: 'ArabicFont', // استخدام الخط العربي
          fontSize: 12, 
          halign: 'right' // محاذاة النص لليمين
        },
        headStyles: { 
          fillColor: [79, 70, 229],
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'right' },
          2: { halign: 'center' }
        }
      });

      doc.save(`Class_${selectedSection}_${periodLabel}_Report.pdf`);
      toast.success(`تم استخراج التقرير ${periodNameAr} بنجاح!`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء ملف PDF. تأكد من اتصالك بالإنترنت لتحميل الخطوط.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPoints = async (periodLabel: string) => {
    if (!students.length) {
      toast.error('الفصل فارغ بالفعل.');
      return;
    }

    if (!window.confirm(`تنبيه هام! هل أنت متأكد أنك تريد تصفير جميع نقاط الطلاب لـ (${periodLabel})؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    setIsProcessing(true);
    setShowResetMenu(false);

    try {
      const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);
      const { error } = await supabase
        .from('students')
        .update({ total_points: 0 })
        .eq('class_id', targetClassId);

      if (error) throw error;

      toast.success(`تم تصفير النقاط لـ ${periodLabel} بنجاح للبدء من جديد.`);
      fetchStudents();
    } catch (error) {
      console.error('خطأ أثناء المسح:', error);
      toast.error('حدث خطأ أثناء تصفير النقاط.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 3. واجهات العرض (UI Render Functions)
  // ==========================================

  const renderPrimary = () => (
    <div className="p-8 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-slate-900 dark:to-slate-800 font-sans w-full rounded-3xl shadow-inner border border-white/50 dark:border-slate-700/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      <h2 className="text-4xl font-black text-amber-600 dark:text-amber-400 text-center mb-12 drop-shadow-md relative z-10 flex items-center justify-center gap-3">
        <Star className="w-10 h-10 text-amber-500 fill-amber-500 animate-pulse" />أبطال الفصل<Star className="w-10 h-10 text-amber-500 fill-amber-500 animate-pulse" />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto relative z-10">
        {students.map((student, index) => (
          <div key={student.id} className="flex flex-col items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lg border border-white/80 dark:border-white/10 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl relative group">
            {index === 0 && student.total_points > 0 && (
              <div className="absolute -top-5 bg-gradient-to-r from-yellow-400 to-amber-500 p-2 rounded-full shadow-lg border-2 border-white dark:border-slate-800 animate-bounce">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-600 dark:to-orange-700 mb-3 flex items-center justify-center text-4xl shadow-inner select-none border-4 border-white dark:border-slate-700">🧑‍🎓</div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white text-center mb-2 line-clamp-1">{student.name}</h3>
            
            <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-slate-900/50 backdrop-blur-sm w-full py-2 rounded-2xl shadow-sm border border-amber-100 dark:border-slate-700/50 mb-4">
              <span className="text-xl select-none group-hover:animate-spin">⭐</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{student.total_points || 0}</span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <input type="text" placeholder="سبب التقييم (اختياري)..." value={reasons[student.id] || ''} onChange={(e) => handleReasonChange(student.id, e.target.value)} className="w-full text-xs p-2 rounded-xl border border-amber-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"/>
              <div className="flex justify-between gap-2">
                <button onClick={() => handlePointChange(student.id, -1)} className="flex-1 bg-rose-100 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-600 py-2 rounded-xl flex justify-center items-center transition-colors border border-rose-200 dark:border-rose-800" title="خصم نقطة"><Minus className="w-5 h-5" /></button>
                <button onClick={() => handlePointChange(student.id, 1)} className="flex-[2] bg-emerald-100 hover:bg-emerald-500 text-emerald-700 hover:text-white dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-600 py-2 rounded-xl flex justify-center items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800 font-bold"><Plus className="w-5 h-5" /> إضافة</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdvancedBoard = (stage: 'PRE' | 'SEC') => {
    const theme = stage === 'SEC' ? { bg: 'from-slate-900 via-slate-800 to-slate-900', accent: 'emerald', danger: 'rose', icon: <Gamepad2 className="w-8 h-8 text-emerald-400" />, title: 'لوحة الإنجاز المهني (Secondary)' } : { bg: 'from-indigo-950 via-purple-900/80 to-indigo-950', accent: 'violet', danger: 'pink', icon: <Trophy className="w-8 h-8 text-violet-400" />, title: 'لوحة التحدي والصدارة (Preparatory)' };
    return (
      <div className={`p-8 bg-gradient-to-br ${theme.bg} w-full rounded-3xl text-white shadow-2xl relative overflow-hidden border border-white/10`}>
        <div className={`absolute top-0 right-0 w-96 h-96 bg-${theme.accent}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none`}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className={`text-3xl font-bold mb-10 tracking-wide border-b border-white/10 pb-5 flex items-center gap-4 text-white/90`}>{theme.icon}{theme.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student, index) => (
              <div key={student.id} className="relative p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:bg-white/15 hover:-translate-y-1 flex flex-col justify-between group">
                {index < 3 && student.total_points > 0 && (
                  <div className={`absolute -top-4 -right-4 w-10 h-10 flex items-center justify-center rounded-full font-black shadow-xl border-2 border-slate-900 text-base ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-slate-900' : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-slate-900' : 'bg-gradient-to-br from-orange-400 to-orange-700 text-white'}`}>
                    {index === 0 ? <Trophy className="w-5 h-5" /> : index + 1}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4 gap-2">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-wide text-white/95 line-clamp-1">{student.name}</h3>
                    <p className={`text-[10px] text-${theme.accent}-300/70 mt-1 uppercase tracking-widest font-semibold`}>Performance Credits</p>
                  </div>
                  
                  <div className={`flex flex-col items-center justify-center bg-${theme.accent}-500/20 border border-${theme.accent}-500/50 rounded-xl px-4 py-2 min-w-[70px]`}>
                    <span className="text-3xl font-black text-white drop-shadow-md">{student.total_points || 0}</span>
                    <span className={`text-[10px] text-${theme.accent}-200 font-bold`}>نقطة</span>
                  </div>
                </div>

                <div className="space-y-3 mt-2 border-t border-white/10 pt-4">
                  <input type="text" placeholder="سبب التقييم (اختياري)..." value={reasons[student.id] || ''} onChange={(e) => handleReasonChange(student.id, e.target.value)} className={`w-full text-xs p-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-white/50 focus:outline-none focus:border-${theme.accent}-400/50 focus:bg-black/50 transition-colors`}/>
                  <div className="flex gap-2">
                    <button onClick={() => handlePointChange(student.id, -1)} className={`py-2 px-3 rounded-lg bg-${theme.danger}-500/20 text-${theme.danger}-100 border border-${theme.danger}-500/50 hover:bg-${theme.danger}-500 hover:text-white transition-all shadow-sm flex items-center justify-center`} title="خصم"><Minus className="w-5 h-5" /></button>
                    <button onClick={() => handlePointChange(student.id, 1)} className={`flex-1 py-2 rounded-lg bg-${theme.accent}-500/30 text-white border border-${theme.accent}-500/50 hover:bg-${theme.accent}-500 transition-all font-bold tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_var(--tw-shadow-color)] shadow-${theme.accent}-500/30 flex justify-center items-center gap-2`}><Plus className="w-5 h-5" /> منح تقييم إيجابي</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 4. المتحكم الرئيسي (Main Render)
  // ==========================================
  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-20">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
            <Gamepad2 className="text-indigo-600 dark:text-indigo-400 w-8 h-8" />
            النشاط التفاعلي (Interactive Board)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">قم بإدارة سلوكيات الفصل، واستخراج التقارير، أو تصفير العدادات للفترات المختلفة.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => { setShowReportMenu(!showReportMenu); setShowResetMenu(false); }}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isProcessing && showReportMenu ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              استخراج التقرير PDF
              <ChevronDown className="w-4 h-4" />
            </button>

            {showReportMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                <div className="p-3 text-xs font-bold text-gray-400 border-b dark:border-slate-700">تحديد فترة التقرير</div>
                <button onClick={() => handleGenerateReport('Weekly')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                  <span className="flex items-center gap-2"><Download className="w-4 h-4 text-indigo-500" /> تقرير أسبوعي</span>
                </button>
                <button onClick={() => handleGenerateReport('Monthly')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                  <span className="flex items-center gap-2"><Download className="w-4 h-4 text-indigo-500" /> تقرير شهري</span>
                </button>
                <button onClick={() => handleGenerateReport('Yearly')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                  <span className="flex items-center gap-2"><Download className="w-4 h-4 text-indigo-500" /> تقرير سنوي</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => { setShowResetMenu(!showResetMenu); setShowReportMenu(false); }}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {isProcessing && showResetMenu ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              تصفير العدادات
              <ChevronDown className="w-4 h-4" />
            </button>

            {showResetMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/50 overflow-hidden z-50">
                <div className="p-3 text-xs font-bold text-red-400 border-b border-red-100 dark:border-red-900/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> مسح النقاط وبدء فترة جديدة
                </div>
                <button onClick={() => handleResetPoints('نهاية الأسبوع')} className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-right text-sm font-semibold text-red-600 dark:text-red-400 transition-colors">
                  <span>تصفير أسبوعي</span>
                </button>
                <button onClick={() => handleResetPoints('نهاية الشهر')} className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-right text-sm font-semibold text-red-600 dark:text-red-400 transition-colors">
                  <span>تصفير شهري</span>
                </button>
                <button onClick={() => handleResetPoints('نهاية العام')} className="w-full flex items-center justify-between p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-right text-sm font-semibold text-red-600 dark:text-red-400 transition-colors">
                  <span>تصفير سنوي</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center relative z-10">
        <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-black w-full md:w-auto ml-4">
          <Filter className="w-5 h-5" />
          <span>تحديد الفصل:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">المرحلة</label>
            <select 
              value={selectedStage} 
              onChange={(e) => {
                const newStage = e.target.value;
                setSelectedStage(newStage);
                setSelectedGrade(schoolStructure[newStage as keyof typeof schoolStructure].years[0]);
              }}
              className="py-3 px-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 bg-indigo-50 dark:bg-slate-700 text-indigo-900 dark:text-white font-bold outline-none cursor-pointer hover:border-indigo-300 dark:hover:border-slate-500 transition-colors"
            >
              {Object.keys(schoolStructure).map((s: string) => <option key={s} value={s}>{s === 'Primary' ? 'الابتدائية' : s === 'Preparatory' ? 'الإعدادية' : 'الثانوية'}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">الصف</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 bg-indigo-50 dark:bg-slate-700 text-indigo-900 dark:text-white font-bold outline-none cursor-pointer hover:border-indigo-300 dark:hover:border-slate-500 transition-colors"
            >
              {schoolStructure[selectedStage as keyof typeof schoolStructure]?.years.map((g: string) => (
                <option key={g} value={g}>
                  {selectedStage === 'Primary' ? 'الابتدائي' : selectedStage === 'Preparatory' ? 'الإعدادي' : 'الثانوي'} {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">الفصل (الشعبة)</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-indigo-100 dark:border-slate-600 bg-indigo-50 dark:bg-slate-700 text-indigo-900 dark:text-white font-bold outline-none cursor-pointer hover:border-indigo-300 dark:hover:border-slate-500 transition-colors"
            >
              {['A', 'B', 'C', 'D', 'E'].map((s: string) => <option key={s} value={s}>فصل {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 w-full bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400">جاري إعداد السبورة التفاعلية...</div>
          </div>
        ) : !students.length ? (
          <div className="flex flex-col justify-center items-center h-80 w-full bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <User className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-5" />
            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">لا يوجد طلاب مسجلين في هذا الفصل حتى الآن.</div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {activeStageCode === 'PRI' && renderPrimary()}
            {activeStageCode === 'PRE' && renderAdvancedBoard('PRE')}
            {activeStageCode === 'SEC' && renderAdvancedBoard('SEC')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClassroomActivity;