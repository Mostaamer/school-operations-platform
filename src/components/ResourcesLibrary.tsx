import React, { useState, useEffect } from 'react';
import { Book, FileText, Upload, Download, Search, Filter, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  type: string;
  grade: string;
  subject: string;
  unit: string;
  lesson: string;
  format: string;
  size: string;
  date: string;
  url: string;
}

export default function ResourcesLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    type: 'كتاب الوزارة',
    grade: 'الأول الابتدائي',
    subject: 'العلوم',
    unit: '1',
    lesson: '1',
    format: 'PDF',
  });

  const fetchResources = () => {
    fetch('/api/resources')
      .then(res => res.json())
      .then(data => setResources(data))
      .catch(() => toast.error('فشل جلب الموارد'));
  };

  useEffect(() => {
    fetchResources();

    // Listen to real-time events
    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_RESOURCE') {
          toast.success(`إشعار: ${data.message}`, { icon: '📚' });
          fetchResources();
        }
      } catch (err) {
        // ignore
      }
    };

    return () => eventSource.close();
  }, []);

  const handleUploadClick = () => setIsUploadModalOpen(true);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error('الرجاء إدخال عنوان الملف');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          size: '2.5 MB' // Mocked file size
        })
      });

      if (!res.ok) throw new Error('فشل الرفع');
      
      toast.success('تم رفع الملف بنجاح');
      setIsUploadModalOpen(false);
      setForm({ ...form, title: '' }); // reset title
      fetchResources();
    } catch (err) {
      toast.error('حدث خطأ أثناء الرفع');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">مكتبة الموارد التعليمية</h1>
          <p className="text-[var(--text-secondary)] mt-1">المركز الشامل لجميع الملفات والكتب التعليمية</p>
        </div>
        
        <button 
          onClick={handleUploadClick}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium">
          <Upload className="w-5 h-5" />
          رفع ملف جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        {['الكل', 'كتاب الوزارة', 'ملزمة المدرسة', 'كتاب التقييم', 'دليل المعلم', 'أوراق عمل', 'مراجعات'].map((cat, i) => (
          <button 
            key={i} 
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              i === 0 
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' 
                : 'bg-surface border border-gray-200 dark:border-gray-700 text-[var(--text-secondary)] hover:border-brand-light hover:text-brand-light'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="البحث في الموارد..."
                className="w-full pr-9 pl-4 py-2 text-sm bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-brand-light text-[var(--text-primary)]"
              />
            </div>
            <button className="p-2 bg-[var(--bg-primary)] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-brand-light transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[var(--text-secondary)] text-sm">
                <th className="py-4 px-6 font-medium">الاسم</th>
                <th className="py-4 px-6 font-medium">النوع</th>
                <th className="py-4 px-6 font-medium">المادة / الصف / الوحدة</th>
                <th className="py-4 px-6 font-medium text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {resources.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-light/10 text-brand-light rounded-lg">
                        {item.type.includes('كتاب') || item.type.includes('ملزمة') || item.type.includes('دليل') ? <Book className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5" dir="ltr">{item.format} • {item.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)] rounded-md text-xs font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.subject} - {item.grade}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">وحدة {item.unit} • درس {item.lesson}</p>
                  </td>
                  <td className="py-4 px-6 text-left">
                    <div className="flex items-center justify-end gap-2">
                      {item.format === 'PDF' && item.url && (
                        <button 
                          onClick={() => setPreviewResource(item)}
                          className="p-2 text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors" 
                          title="معاينة"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors" title="تحميل">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">لا يوجد بيانات لعرضها</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">رفع ملف جديد</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">اسم الملف / العنوان</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-brand-light"
                  placeholder="مثال: كتاب العلوم الجزء الثاني..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">النوع</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option>كتاب الوزارة</option>
                    <option>ملزمة المدرسة</option>
                    <option>كتاب التقييم</option>
                    <option>دليل المعلم</option>
                    <option>أوراق عمل</option>
                    <option>مراجعات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصيغة</label>
                  <select 
                    value={form.format}
                    onChange={e => setForm({...form, format: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option>PDF</option>
                    <option>DOCX</option>
                    <option>PPTX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصف</label>
                  <select 
                    value={form.grade}
                    onChange={e => setForm({...form, grade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <optgroup label="المرحلة الابتدائية">
                      <option>الأول الابتدائي</option>
                      <option>الثاني الابتدائي</option>
                      <option>الثالث الابتدائي</option>
                      <option>الرابع الابتدائي</option>
                      <option>الخامس الابتدائي</option>
                      <option>السادس الابتدائي</option>
                    </optgroup>
                    <optgroup label="المرحلة المتوسطة">
                      <option>الأول المتوسط</option>
                      <option>الثاني المتوسط</option>
                      <option>الثالث المتوسط</option>
                    </optgroup>
                    <optgroup label="المرحلة الثانوية">
                      <option>الأول الثانوي</option>
                      <option>الثاني الثانوي</option>
                      <option>الثالث الثانوي</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المادة</label>
                  <select 
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  >
                    <option>العلوم</option>
                    <option>الرياضيات</option>
                    <option>اللغة العربية</option>
                    <option>التربية الإسلامية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">رقم الوحدة</label>
                  <input type="number" min="1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">رقم الدرس</label>
                  <input type="number" min="1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} />
                </div>
              </div>

              {/* Upload Drop Zone mock */}
              <div className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-brand-light transition-colors cursor-pointer bg-[var(--bg-primary)]">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-[var(--text-primary)]">اضغط هنا لاختيار الملف</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">أو قم بسحب وإسقاط الملف هنا</p>
              </div>

              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full mt-6 py-3 rounded-xl font-medium text-white bg-brand-light hover:bg-brand-dark transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isUploading ? 'جاري الرفع...' : 'تأكيد الرفع'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-5xl h-[90vh] rounded-3xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-light" />
                {previewResource.title}
              </h2>
              <button 
                onClick={() => setPreviewResource(null)} 
                className="p-2 text-gray-400 hover:text-[var(--text-primary)] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-2 md:p-4 overflow-hidden relative">
              {/* Dummy PDF viewer using an iframe */}
              <iframe 
                src={previewResource.url} 
                className="w-full h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white"
                title={previewResource.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
