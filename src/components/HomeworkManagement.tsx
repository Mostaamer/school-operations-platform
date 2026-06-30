import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { BookOpen, Upload, File, Image as ImageIcon, Calendar, Users, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface Homework {
  id: string;
  teacherId: string;
  grade: string;
  classSection: string;
  subject: string;
  unit?: string;
  lesson?: string;
  title: string;
  dueDate: string;
  attachments: Attachment[];
  studentsCompleted: number;
  totalStudents: number;
  createdAt: string;
}

export default function HomeworkManagement() {
  const { user } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    grade: 'الصف 7',
    classSection: 'أ',
    subject: 'الرياضيات',
    unit: '',
    lesson: '',
    dueDate: '',
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const fetchHomework = () => {
    let url = '/api/homework';
    if (user?.role === 'TEACHER') {
      url += `?teacherId=${user.employeeCode}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setHomeworkList(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('فشل جلب الواجبات');
      });
  };

  useEffect(() => {
    fetchHomework();

    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_HOMEWORK') {
           // We might only want to toast if it's relevant, but keeping it simple
           toast.success(data.message, { icon: '📝' });
           fetchHomework();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => eventSource.close();
  }, [user]);

  const handleFileUpload = (type: 'PDF' | 'IMAGE' | 'DOC') => {
    // Mock file upload
    const mockFiles: Record<string, Attachment> = {
      'PDF': { name: 'document.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', type: 'PDF' },
      'IMAGE': { name: 'photo.jpg', url: 'https://picsum.photos/400/300', type: 'IMAGE' },
      'DOC': { name: 'worksheet.docx', url: '#', type: 'DOC' }
    };

    setAttachments([...attachments, mockFiles[type]]);
    toast.success(`تم إرفاق ملف ${type}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          teacherId: user?.employeeCode,
          attachments
        })
      });

      if (!res.ok) throw new Error();

      toast.success('تم تعيين الواجب بنجاح');
      setIsCreating(false);
      // تم حل المشكلة هنا: تم إضافة unit و lesson لتفريغ كل الخانات بشكل صحيح
      setForm({ title: '', grade: 'الصف 7', classSection: 'أ', subject: 'الرياضيات', unit: '', lesson: '', dueDate: '' });
      setAttachments([]);
      fetchHomework();
    } catch {
      toast.error('حدث خطأ أثناء تعيين الواجب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--text-secondary)]">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">إدارة الواجبات المدرسية</h1>
          <p className="text-[var(--text-secondary)] mt-1">تعيين ومتابعة وأرشفة الواجبات المدرسية</p>
        </div>
        
        {!isCreating && (user?.role === 'TEACHER' || user?.role === 'DEVELOPER') && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 py-2.5 px-4 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium">
            <Upload className="w-5 h-5" />
            تعيين واجب جديد
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-surface p-6 rounded-2xl border border-brand-light shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">تعيين واجب جديد</h2>
            <button type="button" onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-medium">إلغاء</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">عنوان الواجب (الوصف أو التفاصيل)</label>
              <input 
                type="text" 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="مثال: حل مسائل صفحة 45 من كتاب الطالب..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصف</label>
              <input 
                type="text" 
                value={form.grade}
                onChange={e => setForm({...form, grade: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الفصل</label>
              <input 
                type="text" 
                value={form.classSection}
                onChange={e => setForm({...form, classSection: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المادة</label>
              <input 
                type="text" 
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الرقم/الوحدة (اختياري)</label>
              <input 
                type="text" 
                value={form.unit}
                onChange={e => setForm({...form, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">رقم الدرس (اختياري)</label>
              <input 
                type="text" 
                value={form.lesson}
                onChange={e => setForm({...form, lesson: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">تاريخ التسليم (آخر موعد)</label>
              <input 
                type="date" 
                value={form.dueDate}
                onChange={e => setForm({...form, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">المرفقات</label>
            <div className="flex gap-4 flex-wrap mb-4">
              <button type="button" onClick={() => handleFileUpload('PDF')} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-light transition-colors text-sm font-medium text-[var(--text-primary)]">
                <FileText className="w-4 h-4 text-red-500" /> إرفاق PDF
              </button>
              <button type="button" onClick={() => handleFileUpload('IMAGE')} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-light transition-colors text-sm font-medium text-[var(--text-primary)]">
                <ImageIcon className="w-4 h-4 text-blue-500" /> إرفاق صورة
              </button>
              <button type="button" onClick={() => handleFileUpload('DOC')} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-light transition-colors text-sm font-medium text-[var(--text-primary)]">
                <File className="w-4 h-4 text-brand-light" /> إرفاق ملف Word
              </button>
            </div>
            
            {attachments.length > 0 && (
              <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                {attachments.map((att, index) => (
                  <div key={index} className="flex flex-row justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                      {att.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                      {att.type === 'IMAGE' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                      {att.type === 'DOC' && <File className="w-4 h-4 text-brand-light" />}
                      {att.name}
                    </div>
                    <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700 text-xs font-medium">حذف</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium disabled:opacity-70"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ وتعيين الواجب'}
            </button>
          </div>
        </form>
      )}

      {/* Homework Archive List */}
      <div className="grid gap-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mt-4">أرشيف الواجبات</h3>
        {homeworkList.map((hw) => (
          <div key={hw.id} className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-6 hover:border-brand-light/20 transition-colors">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-brand-light/10 text-brand-light rounded-md text-xs font-bold">
                  {hw.subject}
                </span>
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)] rounded-md text-xs font-medium">
                  {hw.grade} - {hw.classSection}
                </span>
                <span className="px-2.5 py-1 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)] rounded-md text-xs font-medium" title="تاريخ التسليم">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(hw.dueDate).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-3">{hw.title}</h4>
              
              {hw.attachments && hw.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {hw.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:border-brand-light transition-colors">
                      {att.type === 'PDF' && <FileText className="w-3.5 h-3.5 text-red-500" />}
                      {att.type === 'IMAGE' && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
                      {att.type === 'DOC' && <File className="w-3.5 h-3.5 text-brand-light" />}
                      {att.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            <div className="md:w-48 bg-[var(--bg-primary)] rounded-xl border border-gray-100 dark:border-gray-800 p-4 shrink-0 flex flex-col justify-center items-center text-center">
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Users className="w-3.5 h-3.5"/> التسليمات</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{hw.studentsCompleted} / {hw.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                <div className={`h-1.5 rounded-full ${hw.studentsCompleted === hw.totalStudents ? 'bg-success' : 'bg-brand-light'}`} style={{ width: `${(hw.studentsCompleted / hw.totalStudents) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">تاريخ الإضافة: {new Date(hw.createdAt).toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
        ))}
        {homeworkList.length === 0 && !loading && (
          <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">لا يوجد واجبات</h3>
            <p className="text-[var(--text-secondary)] mt-1">لم يتم تعيين أي واجبات حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}