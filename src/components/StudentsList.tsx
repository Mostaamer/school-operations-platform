import React, { useState, useEffect } from 'react';
import { Search, QrCode, Filter, UserX, UserPlus, Activity, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { Student, StudentTrackingLog } from '../lib/types';
import { EDUCATIONAL_STAGES, CLASSES } from '../lib/constants';
import toast from 'react-hot-toast';

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [trackingLogs, setTrackingLogs] = useState<StudentTrackingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [selectedStage, setSelectedStage] = useState('المرحلة الابتدائية');
  const [selectedGrade, setSelectedGrade] = useState('الصف الأول الابتدائي');
  const [selectedClass, setSelectedClass] = useState('أ');
  const [activeClasses, setActiveClasses] = useState<string[]>(['أ', 'ب', 'ج']);

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(res => res.json()),
      fetch('/api/tracking').then(res => res.json()),
      fetch('/api/settings').then(res => res.json()).catch(() => ({ activeClasses: ['أ', 'ب', 'ج'] }))
    ]).then(([studentsData, logsData, settingsData]) => {
      setStudents(studentsData);
      setTrackingLogs(logsData);
      if (settingsData && settingsData.activeClasses) {
        setActiveClasses(settingsData.activeClasses);
        if (!settingsData.activeClasses.includes(selectedClass) && settingsData.activeClasses.length > 0) {
          setSelectedClass(settingsData.activeClasses[0]);
        }
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrintQRSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Quick CSS for printable sheet format (A4 grid)
    const styles = `
      @page { size: A4; margin: 1cm; }
      body { font-family: 'Inter', system-ui, sans-serif; direction: rtl; }
      h1 { text-align: center; font-size: 20px; margin-bottom: 20px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
      .card { border: 1px dashed #ccc; padding: 15px; text-align: center; border-radius: 8px; page-break-inside: avoid; }
      .qr-container { display: flex; justify-content: center; margin: 15px 0; }
      .name { font-weight: bold; font-size: 16px; margin: 5px 0; }
      .meta { font-size: 12px; color: #555; margin: 2px 0; font-family: monospace; }
      .school-title { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    `;

    // Render the HTML for each barcode
    // We cannot use ReactDOMServer here easily without imports, so we dynamically generate the SVG using string manipulation
    // Since we can't render QRCodeSVG directly to string easily here, we'll draw it on canvas or use a simpler approach.
    // Let's use a pure JS QR code approach or just let the print window render empty and we fill it. 
    // Actually, we can render a React component inside a portal or just render the print content directly in the current page hidden, then window.print().
  };

  const [printingSheet, setPrintingSheet] = useState(false);

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage);
    setSelectedGrade(EDUCATIONAL_STAGES[stage as keyof typeof EDUCATIONAL_STAGES][0]);
  };

  const handlePrint = () => {
    setPrintingSheet(true);
    setTimeout(() => {
      window.print();
      setPrintingSheet(false);
    }, 500);
  };

  const filteredStudents = students.filter(s => 
    s.grade === selectedGrade &&
    s.classSection === selectedClass &&
    (s.fullName.includes(searchTerm) || s.studentId.includes(searchTerm))
  );

  const getStudentStats = (studentId: string) => {
    const logs = trackingLogs.filter(l => l.studentId === studentId);
    const absences = logs.filter(l => l.attendance === 'ABSENT').length;
    const lates = logs.filter(l => l.attendance === 'LATE').length;
    const missingHW = logs.filter(l => l.homework === 'INCOMPLETE').length;
    
    // Sort logs by newest first
    const sortedLogs = [...logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { absences, lates, missingHW, logs: sortedLogs };
  };

  const handleDownloadReport = () => {
    toast.success('تم إنشاء التقرير (محاكاة). الميزة قيد التطوير.');
  };

  return (
    <div className="space-y-6">
      {printingSheet && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto print-block">
           <div className="p-8">
              <h1 className="text-center text-2xl font-bold mb-8">بطاقات حضور الطلاب - {selectedGrade} (فصل {selectedClass})</h1>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                 {filteredStudents.map(student => (
                    <div key={student.id} className="border-2 border-dashed border-gray-300 p-6 rounded-xl flex flex-col items-center text-center page-break-inside-avoid">
                       <span className="text-[10px] text-gray-500 font-bold tracking-wider mb-2">بطاقة هوية الطالب</span>
                       <div className="my-4 bg-white p-2 rounded-lg inline-block border border-gray-200">
                         <QRCodeSVG value={`STUDENT:${student.id}`} size={120} level="H" />
                       </div>
                       <h3 className="font-bold text-lg text-gray-900 mt-2">{student.fullName}</h3>
                       <p className="text-sm font-mono text-gray-600 mt-1" dir="ltr">{student.studentId}</p>
                       <p className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full mt-3">{selectedGrade} - فصل {selectedClass}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Main UI wraps in hidden class on print */}
      <div className={printingSheet ? 'hidden' : ''}>
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">إدارة شؤون الطلاب</h1>
            <p className="text-[var(--text-secondary)] mt-1">البحث والوصول السريع لملفات وتفاصيل الطلاب المحدثة</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
               <QrCode className="w-5 h-5" />
               طباعة QR للفصل
             </button>
             <Link to="/admin/students/enroll" className="flex items-center gap-2 px-6 py-2.5 bg-brand-light text-white rounded-xl hover:bg-brand-dark transition-all duration-300 font-medium whitespace-nowrap">
               <UserPlus className="w-5 h-5" />
               تسجيل طلاب جدد
             </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <select value={selectedStage} onChange={e => handleStageChange(e.target.value)} className="px-4 py-2 bg-surface border border-gray-200 dark:border-gray-700 rounded-xl text-[var(--text-primary)] text-sm">
             {Object.keys(EDUCATIONAL_STAGES).map(stage => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="px-4 py-2 bg-surface border border-gray-200 dark:border-gray-700 rounded-xl text-[var(--text-primary)] text-sm">
            {EDUCATIONAL_STAGES[selectedStage as keyof typeof EDUCATIONAL_STAGES].map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 bg-surface border border-gray-200 dark:border-gray-700 rounded-xl text-[var(--text-primary)] text-sm">
            {CLASSES.map(cls => <option key={cls} value={cls}>فصل {cls}</option>)}
          </select>

          <div className="relative w-full md:w-64">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="البحث بالاسم أو الهوية..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-surface border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-brand-light text-[var(--text-primary)]"
            />
          </div>
          <Link to="/admin/students/enroll" className="p-2.5 bg-brand-light text-white rounded-xl hover:bg-brand-dark transition-colors flex items-center justify-center" title="إضافة طالب جديد">
            <UserPlus className="w-5 h-5" />
          </Link>
        </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">جاري تحميل البيانات...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">لا يوجد نتائج</h3>
          <p className="text-[var(--text-secondary)] mt-1">لم نتمكن من العثور على أي طالب يطابق بحثك</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map(student => {
            const stats = getStudentStats(student.id);
            return (
            <div 
              key={student.id} 
              onClick={() => setSelectedStudent(student)}
              className="group bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-brand-light hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-light/5 rounded-bl-[64px] transition-transform group-hover:scale-110" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="w-12 h-12 rounded-full bg-brand-light/10 text-brand-light flex items-center justify-center font-bold text-lg mb-4">
                  {student.fullName.charAt(0)}
                </div>
                <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-brand-light transition-colors">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>

              <h3 className="font-bold text-[var(--text-primary)] text-lg mb-1 truncate">{student.fullName}</h3>
              
              <div className="space-y-1.5 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">الغياب</span>
                  <span className={`font-medium ${stats.absences > 0 ? 'text-red-500' : 'text-green-500'}`}>{stats.absences} غياب, {stats.lates} تأخير</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">نقص الواجبات</span>
                  <span className={`font-medium ${stats.missingHW > 0 ? 'text-red-500' : 'text-green-500'}`}>{stats.missingHW}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[var(--text-secondary)]">الصف والفصل</span>
                  <span className="font-medium text-[var(--text-primary)]">{student.grade} - {student.classSection}</span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* QR Code Modal Profile */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-light/10 text-brand-light flex items-center justify-center font-bold text-3xl mb-4">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedStudent.fullName}</h2>
              <p className="text-[var(--text-secondary)] mt-1">{selectedStudent.grade} - فصل {selectedStudent.classSection}</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-[var(--bg-primary)]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <QRCodeSVG 
                      value={`sop://student/${selectedStudent.studentId}`} 
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm font-mono text-[var(--text-secondary)] tracking-widest">{selectedStudent.studentId}</p>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-brand-light"/> إحصائيات عامة</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-[var(--text-secondary)] text-xs mb-1">الغياب والتأخير</span><span className="font-bold text-red-500">{getStudentStats(selectedStudent.id).absences} غياب, {getStudentStats(selectedStudent.id).lates} تأخير</span></div>
                      <div className="flex flex-col p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-[var(--text-secondary)] text-xs mb-1">الواجبات الناقصة</span><span className="font-bold text-orange-500">{getStudentStats(selectedStudent.id).missingHW}</span></div>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-brand-light"/> سجل المتابعة والملاحظات</h4>
                    <div className="space-y-3">
                      {getStudentStats(selectedStudent.id).logs.length > 0 ? (
                        getStudentStats(selectedStudent.id).logs.map(log => (
                          <div key={log.id} className="text-sm border-r-2 border-brand-light/30 pr-3 py-1">
                            <p className="text-xs text-[var(--text-secondary)] font-mono" dir="ltr">{log.date}</p>
                            <div className="flex flex-wrap gap-2 mt-1 mb-1">
                              {log.behavior === 'NEEDS_ATTENTION' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">سلوك يحتاج متابعة</span>}
                              {log.participation === 'WEAK' && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">مشاركة ضعيفة</span>}
                              {log.behavior === 'EXCELLENT' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">سلوك ممتاز</span>}
                              {log.participation === 'EXCELLENT' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">مشاركة ممتازة</span>}
                            </div>
                            {log.teacherNotes && (
                              <p className="text-[var(--text-primary)] text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg mt-1 border border-gray-100 dark:border-gray-700">"{log.teacherNotes}"</p>
                            )}
                          </div>
                        ))
                      ) : (
                         <p className="text-sm text-[var(--text-secondary)]">لا يوجد سجلات متابعة بعد.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 shrink-0 border-t border-gray-100 dark:border-gray-800">
              <button onClick={handleDownloadReport} className="w-full py-3 rounded-xl font-medium text-[var(--text-secondary)] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                تقرير الأداء
              </button>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-full py-3 rounded-xl font-medium text-white bg-brand-light hover:bg-brand-dark transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
