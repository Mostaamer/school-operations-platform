import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Trash2, Edit2, AlertTriangle, Trash, FileText, Grid, X 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { schoolStructure, generateClassId } from '../lib/schoolConfig';
import { QRCodeSVG } from 'qrcode.react';

// إعداد قاعدة البيانات
const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co", 
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // الفلاتر
  const [selectedStage, setSelectedStage] = useState<string>('Primary');
  const [selectedGrade, setSelectedGrade] = useState<string>('1');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  // حالات النوافذ المنبثقة
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', stage: 'Primary', grade: '1', section: 'A' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // حالات الطباعة
  const [printMode, setPrintMode] = useState<'none' | 'list' | 'qr-class'>('none');

  // جلب الطلاب
  const fetchStudents = async () => {
    setLoading(true);
    const classId = generateClassId(selectedStage, selectedGrade, selectedSection);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('name');

    if (error) toast.error('خطأ في جلب البيانات');
    else setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { 
    fetchStudents(); 
  }, [selectedStage, selectedGrade, selectedSection]);

  // تعديل طالب
  const handleUpdate = async (id: string) => {
    const newClassId = generateClassId(editData.stage, editData.grade, editData.section);
    const { error } = await supabase
      .from('students')
      .update({ name: editData.name, class_id: newClassId })
      .eq('id', id);
    
    if (error) toast.error('فشل التعديل');
    else {
      toast.success('تم تحديث البيانات ونقل الطالب بنجاح');
      setEditingId(null);
      fetchStudents();
    }
  };

  // حذف طالب
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('students').delete().eq('id', deleteId);
    if (error) toast.error('فشل الحذف');
    else {
      toast.success('تم الحذف بنجاح');
      setDeleteId(null);
      fetchStudents();
    }
  };

  // مسح الفصل
  const handleClearClass = async () => {
    const classId = generateClassId(selectedStage, selectedGrade, selectedSection);
    const { error } = await supabase.from('students').delete().eq('class_id', classId);
    if (error) toast.error('فشل مسح الفصل');
    else {
      toast.success('تم مسح جميع طلاب الفصل');
      setShowClearConfirm(false);
      fetchStudents();
    }
  };

  // دالة تشغيل الطباعة
  const triggerPrint = (mode: 'list' | 'qr-class') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setPrintMode('none');
    }, 400); // إعطاء المتصفح وقتاً كافياً لتقسيم الصفحات قبل الطباعة
  };

  // دالة لتقسيم المصفوفة إلى مجموعات (Chunks) للطباعة التلقائية المتعددة
  const chunkStudents = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // تقسيم قائمة الأسماء لـ 35 طالب في الصفحة
  const listChunks = chunkStudents(students, 35);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* ستايل الطباعة الاحترافي المخصص لصفحة إدارة الطلاب وحل مشكلة القص */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto !important;
            padding: 0;
            margin: 0;
          }
          @page { size: A4 portrait; margin: 10mm; }
          .page-break { page-break-after: always; clear: both; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ----------------- واجهة المستخدم العادية (تُخفى عند الطباعة) ----------------- */}
      <div className={printMode !== 'none' ? 'hidden' : 'block space-y-6'}>
        
        {/* الرأس وأزرار التحكم */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
              <Users className="text-blue-600 w-8 h-8" />
              إدارة الطلاب والبطاقات
            </h1>
            <p className="text-gray-500 mt-2 font-medium">تحكم في بيانات الطلاب واستخرج كشوف الأسماء والـ QR.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {students.length > 0 && (
              <>
                {/* تم استبدال القائمة المنسدلة بالطباعة المباشرة لـ QR الفصل المجمع */}
                <button onClick={() => triggerPrint('qr-class')} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-100 font-bold transition">
                  <Grid size={18} /> طباعة QR الفصل
                </button>
                <button onClick={() => triggerPrint('list')} className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl hover:bg-green-100 font-bold transition">
                  <FileText size={18} /> طباعة القائمة
                </button>
                <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-100 font-bold transition">
                  <Trash size={18} /> مسح الفصل
                </button>
              </>
            )}
          </div>
        </div>

        {/* الفلاتر */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
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
                  <option key={g} value={g}>{selectedStage} {g}</option>
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

        {/* الجدول المبسط */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-right table-fixed">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="p-5 font-black text-gray-700 w-1/2">اسم الطالب</th>
                <th className="p-5 font-black text-gray-700 text-center w-1/4">QR Code الاستحضار</th>
                <th className="p-5 font-black text-gray-700 text-center w-1/4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-500 font-bold">جاري التحميل...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-500 font-bold">لا يوجد طلاب مسجلين في هذا الفصل.</td></tr>
              ) : (
                students.map((s: any) => {
                  const qrData = JSON.stringify({ type: 'STUDENT', id: s.id, qr_id: s.student_qr_id || s.id, class_id: s.class_id });
                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-800 text-lg">{s.name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-center flex justify-center">
                        <div className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm inline-block">
                          <QRCodeSVG value={qrData} size={64} level="M" />
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setEditingId(s.id); setEditData({ name: s.name, stage: selectedStage, grade: selectedGrade, section: selectedSection }); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="تعديل ونقل"><Edit2 size={20} /></button>
                          <button onClick={() => setDeleteId(s.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="حذف"><Trash2 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- قوالب الطباعة (تظهر فقط عند الطباعة) ----------------- */}
      <div className={`print-area ${printMode === 'none' ? 'hidden' : 'block'}`}>
        
        {/* 1. طباعة قائمة الفصل مقسمة لـ 35 طالب بالصفحة */}
        {printMode === 'list' && listChunks.map((chunk, pageIndex) => (
          <div key={pageIndex} className="page-break bg-white p-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black border-b-2 inline-block pb-2">كشف أسماء الطلاب</h2>
              <p className="text-lg mt-2 font-bold text-gray-600">المرحلة: {selectedStage} | الصف: {selectedGrade} | الفصل: {selectedSection}</p>
            </div>
            <table className="w-full text-right border-collapse border border-gray-500">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border border-gray-500 font-bold w-12 text-center text-sm">م</th>
                  <th className="p-2 border border-gray-500 font-bold w-1/2 text-sm">اسم الطالب</th>
                  <th className="p-2 border border-gray-500"></th>
                  <th className="p-2 border border-gray-500"></th>
                  <th className="p-2 border border-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((s, index) => (
                  <tr key={s.id}>
                    <td className="p-1.5 border border-gray-500 text-center font-bold text-sm">{pageIndex * 35 + index + 1}</td>
                    <td className="p-1.5 border border-gray-500 font-bold text-sm">{s.name}</td>
                    <td className="p-1.5 border border-gray-500"></td>
                    <td className="p-1.5 border border-gray-500"></td>
                    <td className="p-1.5 border border-gray-500"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* 2. طباعة QR مجمع للفصل بالكامل */}
        {printMode === 'qr-class' && (
          <div className="h-screen w-full flex flex-col items-center justify-center text-center p-8 bg-white">
             <h1 className="text-5xl font-black mb-6">الباركود الذكي للفصل</h1>
             <h2 className="text-3xl text-gray-600 font-bold mb-12">{generateClassId(selectedStage, selectedGrade, selectedSection)}</h2>
             <div className="p-8 border-4 border-gray-800 rounded-3xl">
               <QRCodeSVG value={JSON.stringify({ type: 'CLASS', class_id: generateClassId(selectedStage, selectedGrade, selectedSection) })} size={400} level="H" />
             </div>
             <p className="mt-8 text-xl text-gray-500 font-bold">يستخدم هذا الكود لتحضير جميع طلاب الفصل دفعة واحدة</p>
          </div>
        )}
      </div>

      {/* ----------------- النوافذ المنبثقة (Modals) ----------------- */}

      {/* مودال التعديل */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md border">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Edit2 className="text-blue-600"/> تعديل بيانات الطالب ونقله</h3>
            <label className="block text-sm font-bold text-gray-600 mb-1">اسم الطالب</label>
            <input className="w-full p-3 border-2 border-gray-100 rounded-xl mb-4 bg-gray-50 font-bold outline-none focus:border-blue-500" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">نقل لمرحلة</label>
                <select className="w-full p-2 border-2 border-gray-100 rounded-lg bg-gray-50 font-bold" value={editData.stage} onChange={(e) => { const st = e.target.value; setEditData({...editData, stage: st, grade: schoolStructure[st as keyof typeof schoolStructure].years[0]}); }}>
                  {Object.keys(schoolStructure).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">الصف</label>
                <select className="w-full p-2 border-2 border-gray-100 rounded-lg bg-gray-50 font-bold" value={editData.grade} onChange={(e) => setEditData({...editData, grade: e.target.value})}>
                  {schoolStructure[editData.stage as keyof typeof schoolStructure]?.years.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-600 mb-1">الشعبة (الفصل)</label>
                <select className="w-full p-2 border-2 border-gray-100 rounded-lg bg-gray-50 font-bold" value={editData.section} onChange={(e) => setEditData({...editData, section: e.target.value})}>
                  {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>فصل {s}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => handleUpdate(editingId)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-2 hover:bg-blue-700 transition">حفظ التغييرات ونقل</button>
            <button onClick={() => setEditingId(null)} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">إلغاء</button>
          </div>
        </div>
      )}

      {/* مودال الحذف */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={56} />
            <h3 className="text-xl font-black text-gray-800 mb-2">هل أنت متأكد؟</h3>
            <p className="text-gray-500 mb-6 font-bold">لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">نعم، احذف</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال مسح الفصل */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center border-2 border-red-100">
            <Trash className="mx-auto text-red-600 mb-4" size={56} />
            <h3 className="text-xl font-black text-red-600 mb-2">مسح الفصل بالكامل؟</h3>
            <p className="text-gray-500 mb-6 font-bold">سيتم حذف جميع طلاب هذا الفصل بلا رجعة.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">إلغاء</button>
              <button onClick={handleClearClass} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">مسح الكل</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}