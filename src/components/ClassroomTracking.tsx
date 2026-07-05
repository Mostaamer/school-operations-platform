import React, { useState, useEffect } from 'react';
import { Save, QrCode, CheckSquare, Filter, X, CheckCircle, XCircle, Clock, User, FileText, Printer, Scan, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';
import { schoolStructure, generateClassId } from '../lib/schoolConfig';

export default function ClassroomTracking() {
  const { user } = useAuth();
  
  const [selectedStage, setSelectedStage] = useState<string>('Primary');
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [trackingData, setTrackingData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // حالات ماسح الـ QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanMode, setScanMode] = useState<'STUDENT' | 'CLASS' | null>(null);

  // حالات التقرير الشهري
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [reportGrid, setReportGrid] = useState<{
    studentsList: any[];
    daysArray: number[];
    attendanceMap: Record<string, Record<number, string>>;
  }>({ studentsList: [], daysArray: [], attendanceMap: {} });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', targetClassId);

      if (sError) throw sError;

      const { data: lData } = await supabase
        .from('student_tracking')
        .select('*')
        .eq('date', selectedDate);
      
      setStudents(sData || []);
      const newData: any = {};
      (sData || []).forEach(s => {
        // التعديل هنا: الحالة الافتراضية أصبحت 'ABSENT' بدلاً من 'PRESENT'
        newData[s.id] = lData?.find((l: any) => l.student_id === s.id) || { 
          student_id: s.id, 
          date: selectedDate, 
          attendance: 'ABSENT' 
        };
      });
      setTrackingData(newData);
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب البيانات من قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReportGrid = async (targetMonth: string) => {
    try {
      const targetClassId = generateClassId(selectedStage, selectedGrade, selectedSection);
      const { data: studs, error: sError } = await supabase
        .from('students')
        .select('id, name')
        .eq('class_id', targetClassId);

      if (sError) throw sError;
      if (!studs || studs.length === 0) {
        toast.error('لا يوجد طلاب في هذا الفصل لعرض تقريرهم');
        return;
      }

      const [yearStr, monthStr] = targetMonth.split('-');
      const yearNum = parseInt(yearStr);
      const monthNum = parseInt(monthStr);
      const totalDays = new Date(yearNum, monthNum, 0).getDate();
      const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);

      const firstDayStr = `${targetMonth}-01`;
      const lastDayStr = `${targetMonth}-${String(totalDays).padStart(2, '0')}`;

      const studentIds = studs.map(s => s.id);
      const { data: tracking, error: tError } = await supabase
        .from('student_tracking')
        .select('student_id, date, attendance')
        .in('student_id', studentIds)
        .gte('date', firstDayStr)
        .lte('date', lastDayStr);

      if (tError) throw tError;

      const amap: Record<string, Record<number, string>> = {};
      studs.forEach(s => { amap[s.id] = {}; });

      tracking?.forEach(record => {
        if (record.date) {
          const dayNum = parseInt(record.date.split('-')[2], 10);
          if (amap[record.student_id]) {
            amap[record.student_id][dayNum] = record.attendance;
          }
        }
      });

      setReportGrid({ studentsList: studs, daysArray: daysArr, attendanceMap: amap });
      setShowReportModal(true);

    } catch (error: any) {
      console.error(error);
      toast.error('خطأ أثناء بناء كشف الحضور الشهري');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStage, selectedGrade, selectedSection, selectedDate, user]);

  const handleBulkAttendance = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (students.length === 0) {
      toast.error('لا يوجد طلاب في هذا الفصل');
      return;
    }
    const newData = { ...trackingData };
    students.forEach(s => {
      if (newData[s.id]) {
        newData[s.id].attendance = status;
      }
    });
    setTrackingData(newData);
    toast.success('تم تحديث حالة الحضور للجميع مؤقتاً، اضغط حفظ للاعتماد');
  };

  // معالجة القراءة الذكية للـ QR بناءً على نوعه
  const handleScanResult = async (result: any) => {
    if (!result) return;
    try {
      const text = Array.isArray(result) ? result[0]?.rawValue : result?.text || result;
      const data = JSON.parse(text);
      const currentClassId = generateClassId(selectedStage, selectedGrade, selectedSection);

      // التحقق من نوع المسح المطلوب والتوافق
      if (scanMode === 'STUDENT' && data.type !== 'STUDENT') {
        toast.error('يرجى مسح بطاقة طالب فردي وليس كود الفصل');
        return;
      }
      if (scanMode === 'CLASS' && data.type !== 'CLASS') {
        toast.error('يرجى مسح كود الفصل المجمع وليس بطاقة طالب');
        return;
      }

      if (data.type === 'CLASS') {
        if (data.class_id !== currentClassId) {
          toast.error('كود الفصل الممسوح لا يطابق الفصل المحدد حالياً!');
          return;
        }
        handleBulkAttendance('PRESENT');
        setShowQRModal(false);
        toast.success('تم تحضير جميع طلاب الفصل! لا تنس الضغط على حفظ.');
      } 
      else if (data.type === 'STUDENT') {
        const studentExists = students.some(s => s.id === data.id);
        if (!studentExists) {
          toast.error('هذا الطالب غير مسجل في الفصل المحدد حالياً!');
          return;
        }

        const { error } = await supabase.from('student_tracking').upsert({
          student_id: data.id,
          date: selectedDate,
          attendance: 'PRESENT',
          updated_by: user?.name || 'معلم'
        }, { onConflict: 'student_id,date' });
        
        if (error) throw error;
        
        setTrackingData(prev => ({
          ...prev, [data.id]: { ...prev[data.id], attendance: 'PRESENT' }
        }));
        toast.success(`تم تحضير الطالب بنجاح`);
        setShowQRModal(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('كود QR غير صالح أو غير مدعوم');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const logsToSave = Object.values(trackingData).map((log: any) => ({
      student_id: log.student_id,
      date: selectedDate,
      attendance: log.attendance,
      updated_by: user?.name || 'معلم',
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase.from('student_tracking').upsert(logsToSave, { onConflict: 'student_id,date' });
    error ? toast.error('خطأ في الحفظ') : toast.success('تم إرسال سجل الحضور لقاعدة البيانات بنجاح');
    setIsSaving(false);
  };

  const getStatusCount = (studentId: string, status: string) => {
    const studentRecords = reportGrid.attendanceMap[studentId] || {};
    return Object.values(studentRecords).filter(s => s === status).length;
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          html, body { overflow: visible !important; height: auto !important; }
          #print-report-area, #print-report-area * { visibility: visible; }
          #print-report-area {
            position: absolute; left: 0; top: 0; width: 100%; height: auto !important;
            max-height: none !important; overflow: visible !important;
            background: white; color: black; padding: 0px; margin: 0px; box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { size: landscape; margin: 5mm; }
          table { width: 100% !important; border-collapse: collapse !important; min-width: 0 !important; table-layout: auto !important; }
          th, td { border: 1px solid #1e293b !important; padding: 2px 1px !important; font-size: 10px !important; color: black !important; }
          th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th.sticky, td.sticky { position: static !important; box-shadow: none !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
      
      {/* الرأس */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <CheckSquare className="text-blue-600 w-8 h-8" />
            سجل الحضور والغياب اليومي
          </h1>
          <p className="text-gray-500 mt-2 font-medium">نظام الربط المباشر مع قاعدة البيانات والتحضير الذكي.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="p-3 border-2 border-blue-100 rounded-xl font-bold text-blue-900"
          />
          <button 
            onClick={() => fetchMonthlyReportGrid(reportMonth)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <FileText size={20} /> كشف شهري
          </button>
          
          {/* أزرار مسح الـ QR المنفصلة */}
          <button onClick={() => { setScanMode('CLASS'); setShowQRModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">
            <Users size={20} /> تحضير الفصل QR
          </button>
          <button onClick={() => { setScanMode('STUDENT'); setShowQRModal(true); }} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-md transition-all">
            <Scan size={20} /> تحضير فردي QR
          </button>
          
          <button onClick={handleSaveAll} disabled={isSaving || students.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-70">
            <Save size={20} /> {isSaving ? 'جاري...' : 'حفظ'}
          </button>
        </div>
      </div>

      {/* منطقة الفلاتر */}
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
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none"
            >
              {Object.keys(schoolStructure).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">الصف</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none"
            >
              {schoolStructure[selectedStage as keyof typeof schoolStructure]?.years.map((g: string) => (
                <option key={g} value={g}>{selectedStage} {g}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">الفصل (الشعبة)</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              className="py-3 px-4 rounded-xl border-2 border-blue-100 bg-blue-50 text-blue-900 font-bold outline-none"
            >
              {['A', 'B', 'C', 'D', 'E'].map((s: string) => <option key={s} value={s}>فصل {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* أدوات التحضير الجماعي */}
      {students.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <span className="font-bold text-blue-800 text-sm flex items-center gap-2">إجراء سريع:</span>
          <button onClick={() => handleBulkAttendance('PRESENT')} className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-xl hover:bg-green-200 font-bold transition-colors">
            <CheckCircle size={16} /> الكل حاضر
          </button>
          <button onClick={() => handleBulkAttendance('ABSENT')} className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 font-bold transition-colors">
            <XCircle size={16} /> الكل غائب
          </button>
        </div>
      )}

      {/* جدول الحضور اليومي */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center">
            <Clock className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <span className="text-gray-500 font-bold">جاري تحميل البيانات...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="p-5 font-black w-1/2 text-gray-700">اسم الطالب</th>
                  <th className="p-5 font-black w-1/2 text-gray-700 text-center">حالة الحضور</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-bold text-lg">لا يوجد طلاب مسجلين في هذا الفصل.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((s, index) => (
                    <tr key={s.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0">
                            {s.name?.charAt(0) || '-'}
                          </div>
                          <span className="font-bold text-gray-800 text-lg">{s.name}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-2 bg-gray-50 p-2 rounded-xl w-max mx-auto border border-gray-200">
                          <button onClick={() => setTrackingData({...trackingData, [s.id]: {...trackingData[s.id], attendance: 'PRESENT'}})} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${trackingData[s.id]?.attendance === 'PRESENT' ? 'bg-green-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-200'}`}>حاضر</button>
                          <button onClick={() => setTrackingData({...trackingData, [s.id]: {...trackingData[s.id], attendance: 'LATE'}})} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${trackingData[s.id]?.attendance === 'LATE' ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-200'}`}>متأخر</button>
                          <button onClick={() => setTrackingData({...trackingData, [s.id]: {...trackingData[s.id], attendance: 'ABSENT'}})} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${trackingData[s.id]?.attendance === 'ABSENT' ? 'bg-red-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-200'}`}>غائب</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة التقرير الشهري */}
      {showReportModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div id="print-report-area" className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] print:max-h-none overflow-hidden print:overflow-visible shadow-2xl print:shadow-none flex flex-col print:block">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
              <div>
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <FileText className="text-emerald-600" /> كشف الحضور والغياب الشهري
                </h2>
                <p className="text-gray-500 font-bold mt-1 text-sm">المرحلة: {selectedStage} | الصف: {selectedGrade} | شعبة: {selectedSection}</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center justify-end">
                <input 
                  type="month" value={reportMonth}
                  onChange={(e) => { setReportMonth(e.target.value); fetchMonthlyReportGrid(e.target.value); }}
                  className="outline-none text-sm font-black text-gray-800 bg-transparent cursor-pointer border-2 border-emerald-100 px-3 py-2 rounded-xl"
                />
                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-md"><Printer size={18} /> طباعة الكشف</button>
                <button onClick={() => setShowReportModal(false)} className="p-2.5 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-xl"><X size={20} /></button>
              </div>
            </div>

            <div className="hidden print:block text-center mb-4 p-2 border-b-2 border-black">
              <h1 className="text-2xl font-bold">كشف حضور وغياب الطلاب الشهري</h1>
              <p className="text-sm font-medium mt-1">الشهر: {reportMonth} | المرحلة: {selectedStage} | الصف: {selectedGrade} | الفصل: {selectedSection}</p>
            </div>

            <div className="p-4 md:p-6 overflow-auto print:overflow-visible flex-1 print:flex-none">
              <table className="w-full border-collapse text-center text-xs min-w-[1000px] print:min-w-0">
                <thead>
                  <tr className="bg-slate-100 border border-slate-300">
                    <th className="border border-slate-300 p-3 font-black text-slate-800 text-right sticky right-0 bg-slate-100 min-w-[180px] print:min-w-0 print:static print:shadow-none z-10">اسم الطالب</th>
                    {reportGrid.daysArray.map(day => <th key={day} className="border border-slate-300 p-1 font-bold text-slate-700 min-w-[28px] print:min-w-0">{day}</th>)}
                    <th className="border border-slate-300 p-1 font-black text-green-700 bg-green-50 min-w-[35px] print:min-w-0">ح</th>
                    <th className="border border-slate-300 p-1 font-black text-orange-700 bg-orange-50 min-w-[35px] print:min-w-0">م</th>
                    <th className="border border-slate-300 p-1 font-black text-red-700 bg-red-50 min-w-[35px] print:min-w-0">غ</th>
                  </tr>
                </thead>
                <tbody>
                  {reportGrid.studentsList.map((st, idx) => (
                    <tr key={st.id} className={`border border-slate-200 hover:bg-slate-50/80 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="border border-slate-300 p-2.5 font-bold text-slate-800 text-right sticky right-0 bg-inherit shadow-[1px_0_0_0_#cbd5e1] print:static print:shadow-none z-10">{st.name}</td>
                      {reportGrid.daysArray.map(day => {
                        const status = reportGrid.attendanceMap[st.id]?.[day];
                        return (
                          <td key={day} className="border border-slate-200 p-1 font-black text-sm">
                            {status === 'PRESENT' && <span className="text-green-600 font-bold">✓</span>}
                            {status === 'ABSENT' && <span className="text-red-600 font-bold">×</span>}
                            {status === 'LATE' && <span className="text-orange-500 font-bold">م</span>}
                            {!status && <span className="text-slate-300 text-[10px]">-</span>}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 p-1 font-black text-green-700 bg-green-50/60">{getStatusCount(st.id, 'PRESENT')}</td>
                      <td className="border border-slate-300 p-1 font-black text-orange-700 bg-orange-50/60">{getStatusCount(st.id, 'LATE')}</td>
                      <td className="border border-slate-300 p-1 font-black text-red-700 bg-red-50/60">{getStatusCount(st.id, 'ABSENT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* نافذة ماسح الـ QR (مكبرة ومحسنة) */}
      {showQRModal && (
        <div className="fixed inset-0 z-[600] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-6 rounded-3xl w-full max-w-2xl shadow-2xl relative">
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 left-4 p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors z-10">
              <X size={24} />
            </button>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-gray-800 flex items-center justify-center gap-2">
                {scanMode === 'CLASS' ? <Users className="text-indigo-600"/> : <Scan className="text-blue-600"/>}
                {scanMode === 'CLASS' ? 'مسح كود الفصل المجمع' : 'مسح كود الطالب الفردي'}
              </h2>
              <p className="text-gray-500 font-bold mt-2">قم بتوجيه الكاميرا نحو المربع لالتقاط الكود</p>
            </div>
            {/* تكبير حاوية الماسح لتصبح أوضح */}
            <div className="w-full h-[400px] sm:h-[450px] bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden border-8 border-gray-100 shadow-inner relative">
              <Scanner
                onScan={(result: any) => result && handleScanResult(result)}
                onError={(error: any) => console.error(error)}
              />
              {/* تراكب بصري للإرشاد */}
              <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-white/40 m-8 rounded-xl rounded-tl-[40px] rounded-br-[40px]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}