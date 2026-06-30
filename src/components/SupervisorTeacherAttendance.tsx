import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ClipboardList, 
  User, 
  Edit2, 
  Check, 
  X, 
  Save,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  FileText,
  Printer,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/auth-context';

export default function SupervisorTeacherAttendance() {
  // --- States ---
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // --- حالات التقرير الشهري والفلتر ---
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthDaysInfo, setMonthDaysInfo] = useState<{dateStr: string, dayName: string}[]>([]);
  
  // صيغة الشهر المختار YYYY-MM (تستخدم كقيمة افتراضية للشهر الحالي)
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7)); 

  // --- حالات الحذف وبدء العام الجديد ---
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Data Fetching للمكون الأساسي ---
  const fetchData = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: tData, error: tErr } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'TEACHER');
        
      const { data: aData, error: aErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today);
        
      if (tErr || aErr) throw new Error("Database error");
      
      setTeachers(tData || []);
      setAttendance(aData || []);
    } catch (error) {
      toast.error("فشل في استرجاع البيانات من الخادم");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- دالة توليد أيام الشهر بناءً على الفلتر المختار ---
  const generateMonthDays = (year: number, month: number) => {
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    const daysArray = Array.from({ length: daysCount }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const dateStr = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
      ].join('-');
      
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
      return { dateStr, dayName };
    });
    setMonthDaysInfo(daysArray);
  };

  // --- دالة جلب تقرير الحضور الشهري مدمجة مع الفلتر ---
  const fetchReportData = async (teacherId: number, monthString: string) => {
    setLoadingReport(true);
    
    const [year, month] = monthString.split('-').map(Number);
    generateMonthDays(year, month - 1);
    
    const d = new Date(year, month - 1, 1);
    const targetMonthYearAr = d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('month_year', targetMonthYearAr);

      if (error) throw error;
      setMonthlyReport(data || []);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل التقرير الشهري");
    } finally {
      setLoadingReport(false);
    }
  };

  // --- فتح نافذة التقرير ---
  const handleOpenReport = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    setReportMonth(currentMonthStr);
    fetchReportData(teacher.id, currentMonthStr);
  };

  // --- دالة الحذف وتصفير العام الدراسي ---
  const handleResetYear = async () => {
    if (!adminPassword || adminPassword.length < 4) {
      toast.error("الرجاء إدخال كلمة المرور الصحيحة أولاً");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .neq('id', 0); 

      if (error) throw error;
      
      toast.success('تم مسح كافة السجلات وبدء عام دراسي جديد بنجاح');
      setIsDeleteConfirmOpen(false);
      setAdminPassword('');
      fetchData(); 
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Logic ---
  const updateAttendance = async (teacherId: any, status: string) => {
    const today = new Date().toISOString().split('T')[0];
    const monthYear = new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({ 
          teacher_id: Number(teacherId), 
          status: status, 
          date: today, 
          month_year: monthYear,
          reason: reasons[teacherId] || ''
        }, { onConflict: 'teacher_id, date' });
      
      if (error) {
        toast.error('حدث خطأ أثناء الاتصال بقاعدة البيانات');
      } else {
        toast.success(`تم تحديث حالة المعلم بنجاح`);
        setEditMode(prev => ({ ...prev, [teacherId]: false }));
        setReasons(prev => ({ ...prev, [teacherId]: '' }));
        fetchData();
      }
    } catch (err) {
      toast.error('خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Helpers ---
  const getStatusStyles = (status: string) => {
    const base = "p-6 rounded-3xl border transition-all duration-300 ";
    switch(status) {
      case 'حاضر': 
        return base + "bg-green-50 border-green-200 shadow-[0_8px_30px_rgba(34,197,94,0.12)] ring-1 ring-green-100";
      case 'غائب': 
        return base + "bg-red-50 border-red-200 shadow-[0_8px_30px_rgba(239,68,68,0.12)] ring-1 ring-red-100";
      case 'متأخر': 
        return base + "bg-orange-50 border-orange-200 shadow-[0_8px_30px_rgba(249,115,22,0.12)] ring-1 ring-orange-100";
      default: 
        return base + "bg-white border-gray-100 shadow-sm hover:shadow-md";
    }
  };

  const getReportMonthArabicName = () => {
    const [year, month] = reportMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  return (
    <>
      {/* ستايل مخصص لضغط جدول الطباعة في ورقة A4 واحدة وعمل توازن للصفحة */}
      <style type="text/css">
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: A4 portrait;
              margin: 8mm; /* توازن في الهوامش العلوية والسفلية */
            }
            /* إجبار الجدول والخلايا على الضغط */
            #print-section table {
              width: 100% !important;
              margin-top: 5px !important;
            }
            #print-section th, #print-section td {
              padding: 2px 4px !important; /* تقليل المسافات الداخلية في الخلايا */
              font-size: 11px !important; /* تصغير حجم الخط */
              height: 23px !important; /* تحديد أقصى ارتفاع للصف */
              line-height: 1.2 !important;
            }
            #print-section tr {
              page-break-inside: avoid !important; /* منع انقسام الصف بين صفحتين */
            }
            /* توازن الترويسة والتذييل */
            #print-section .mb-4 { margin-bottom: 10px !important; }
            #print-section .pb-2 { padding-bottom: 5px !important; }
            #print-section .mt-6 { margin-top: 15px !important; }
            #print-section h1 { font-size: 18px !important; }
            #print-section p { font-size: 14px !important; margin: 2px 0 !important; }
          }
        `}
      </style>

      <div className="p-8 max-w-7xl mx-auto space-y-10 print:hidden" dir="rtl">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-3 flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-blue-600" /> 
              سجل الحضور والإشراف
            </h1>
            <p className="text-gray-500 font-medium">نظام مراقبة المعلمين وإدارة حالات الدوام اليومي</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold border border-red-100 hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 className="w-5 h-5" />
              بدء عام دراسي جديد
            </button>

            <button 
              onClick={fetchData} 
              disabled={refreshing}
              className="flex w-full sm:w-auto justify-center items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'تحديث...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map(teacher => {
            const record = attendance.find(a => Number(a.teacher_id) === Number(teacher.id));
            const status = record?.status || 'لم يسجل';
            const isEditing = editMode[teacher.id];
            
            return (
              <div key={teacher.id} className={getStatusStyles(status)}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl border flex items-center justify-center border-gray-100">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800">{teacher.name}</h3>
                      <span className="text-[11px] font-bold text-gray-400">معلم</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenReport(teacher)}
                      title="عرض التقرير الشهري"
                      className="p-2 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-100 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4" />
                    </button>
                    
                    {!isEditing && (
                      <button 
                        onClick={() => setEditMode(prev => ({ ...prev, [teacher.id]: true }))}
                        className="p-2 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-white/60 p-4 rounded-2xl border border-white/50 text-center font-bold text-gray-700">
                      {status}
                    </div>
                    {record?.reason && (
                      <div className="text-[11px] text-gray-500 flex items-center gap-2 bg-gray-100/50 p-3 rounded-xl italic">
                        <Clock className="w-3 h-3" /> ملاحظة: {record.reason}
                      </div>
                    )}
                    {record?.created_at && (
                      <div className="text-[10px] text-gray-400 text-left">
                        تم التسجيل: {new Date(record.created_at).toLocaleTimeString('ar-EG', {hour : '2-digit', minute : '2-digit'})}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => updateAttendance(teacher.id, 'حاضر')} className="bg-green-500 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-green-600">حاضر</button>
                      <button onClick={() => updateAttendance(teacher.id, 'متأخر')} className="bg-orange-500 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-orange-600">تأخير</button>
                      <button onClick={() => updateAttendance(teacher.id, 'غائب')} className="bg-red-500 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-red-600">غياب</button>
                    </div>
                    <input 
                      placeholder="سبب التعديل..." 
                      className="w-full p-3 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
                      onChange={(e) => setReasons(prev => ({ ...prev, [teacher.id]: e.target.value }))}
                    />
                    <button 
                      onClick={() => setEditMode(prev => ({ ...prev, [teacher.id]: false }))} 
                      className="w-full text-gray-400 text-xs flex items-center justify-center gap-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" /> إلغاء التعديل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- نافذة عرض التقرير وتصميم ورقة A4 للطباعة --- */}
      {isModalOpen && selectedTeacher && (
        <div id="print-section" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block" dir="rtl">
          
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 print:rounded-none print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:h-auto">
            
            {/* الترويسة المخصصة للطباعة (معدلة بدون الإدارات) */}
            <div className="hidden print:block mb-4 text-black border-b-2 border-black pb-2">
              <div className="flex justify-between items-end mb-2">
                <div className="text-right">
                  <h1 className="text-2xl font-black mb-1">سجل الحضور والانصراف الشهري</h1>
                  <p className="font-bold text-lg">شهر: {getReportMonthArabicName()}</p>
                </div>
                <div className="text-left space-y-1">
                  <p className="font-bold text-xl">اسم المعلم: {selectedTeacher.name}</p>
                </div>
              </div>
            </div>

            {/* رأس النافذة في المتصفح */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">تقرير الحضور</h2>
                  <p className="text-sm text-gray-500">المعلم: <span className="font-bold text-gray-700">{selectedTeacher.name}</span></p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 md:flex-none">
                  <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                  <input 
                    type="month" 
                    value={reportMonth}
                    onChange={(e) => {
                      setReportMonth(e.target.value);
                      fetchReportData(selectedTeacher.id, e.target.value);
                    }}
                    className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full"
                  />
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-900 hover:bg-black text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" /> طباعة
                </button>
                <button 
                  onClick={() => { setIsModalOpen(false); setSelectedTeacher(null); setMonthlyReport([]); }}
                  className="p-2.5 bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* محتوى جدول التقرير (مع تقليل الـ Padding للطباعة) */}
            <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 print:hidden">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-gray-500">جاري استرجاع سجلات {getReportMonthArabicName()}...</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden print:border-black print:rounded-none">
                  <table className="w-full text-right border-collapse print:border-black">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 text-sm font-bold print:bg-gray-200 print:text-black">
                        <th className="p-3 print:py-1 print:px-2 border-b border-gray-200 print:border-black print:border print:text-[12px]">اليوم</th>
                        <th className="p-3 print:py-1 print:px-2 border-b border-gray-200 print:border-black print:border print:text-[12px]">التاريخ</th>
                        <th className="p-3 print:py-1 print:px-2 border-b border-gray-200 print:border-black print:border print:text-[12px]">وقت الحضور</th>
                        <th className="p-3 print:py-1 print:px-2 border-b border-gray-200 print:border-black print:border print:text-[12px]">الحالة</th>
                        <th className="p-3 print:py-1 print:px-2 border-b border-gray-200 print:border-black print:border print:text-[12px]">التوقيع / ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm print:divide-black">
                      {monthDaysInfo.map((dayInfo, index) => {
                        const record = monthlyReport.find(r => r.date === dayInfo.dateStr);
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors print:text-black">
                            <td className="p-3 print:py-1 print:px-2 font-bold text-gray-700 print:border-black print:border w-32 print:text-[11px]">{dayInfo.dayName}</td>
                            <td className="p-3 print:py-1 print:px-2 text-gray-600 print:border-black print:border w-32 print:text-[11px]">{dayInfo.dateStr}</td>
                            
                            <td className="p-3 print:py-1 print:px-2 text-gray-600 print:border-black print:border font-medium w-32 print:text-[11px]">
                              {record?.created_at ? new Date(record.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) : ''}
                            </td>
                            
                            <td className="p-3 print:py-1 print:px-2 print:border-black print:border w-32 print:text-[12px]">
                              {record ? (
                                <span className={`print:hidden px-3 py-1 rounded-full text-xs font-black ${
                                  record.status === 'حاضر' ? 'bg-green-100 text-green-700' :
                                  record.status === 'متأخر' ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {record.status}
                                </span>
                              ) : null}
                              {record && <span className="hidden print:inline font-bold">{record.status}</span>}
                            </td>
                            
                            <td className="p-3 print:py-1 print:px-2 text-xs text-gray-600 italic print:border-black print:border print:text-[11px]">
                              {record?.reason ? record.reason : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* تذييل النافذة مخصص للطباعة فقط */}
            <div className="hidden print:flex justify-between items-center mt-6 pt-4 text-black font-bold text-base px-12">
              <div className="text-center">
                <p>توقيع المشرف المختص</p>
                <p className="mt-6">......................................</p>
              </div>
              <div className="text-center">
                <p>توقيع مدير المدرسة</p>
                <p className="mt-6">......................................</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- نافذة تأكيد حذف الأرشيف السنوي --- */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden animate-in fade-in" dir="rtl">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl border border-red-100">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">تحذير أمني خطير!</h2>
              <p className="text-sm font-bold text-red-600">أنت على وشك حذف أرشيف الحضور بالكامل وبدء عام دراسي جديد.</p>
              <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                هذا الإجراء سيقوم بمسح كافة سجلات الحضور والغياب لجميع المعلمين في جميع الأشهر السابقة. <span className="font-bold underline text-red-500">لا يمكن التراجع عن هذا الإجراء إطلاقاً.</span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">يرجى إدخال كلمة مرور مدير النظام للتأكيد:</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full p-4 border border-gray-200 rounded-xl text-left bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { setIsDeleteConfirmOpen(false); setAdminPassword(''); }} 
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
                disabled={isDeleting}
              >
                إلغاء الأمر
              </button>
              <button 
                onClick={handleResetYear} 
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 flex justify-center items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}