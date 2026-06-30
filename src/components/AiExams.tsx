import React, { useState, useEffect, useMemo } from 'react';
import { Bot, FileText, Check, Loader2, Download, Search, Save, ListChecks, FileSpreadsheet, Trash2, Copy, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { EDUCATIONAL_STAGES } from '../lib/constants';

interface Question {
  type: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
}

interface Exam {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  isSaved?: boolean;
}

export default function AiExams() {
  const [activeTab, setActiveTab] = useState<'generate' | 'bank'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]); 
  const [bankExams, setBankExams] = useState<Exam[]>([]); 
  const [showAnswerKeys, setShowAnswerKeys] = useState<{ [key: string]: boolean }>({});
  
  // Bank Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [editFormText, setEditFormText] = useState<string>('');

  const [form, setForm] = useState({
    stage: 'المرحلة الابتدائية',
    grade: 'الصف الأول الابتدائي',
    subject: 'العلوم',
    sourceResourceId: '', // <--- NEW property
    unit: '1',
    lesson: '1',
    difficulty: 'متوسط',
    numQuestions: 5
  });

  const [resources, setResources] = useState<any[]>([]);

  const fetchBankExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      setBankExams(data);
    } catch {
      toast.error('حدث خطأ أثناء جلب بنك الأسئلة');
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      setResources(data);
    } catch {
      // It's okay if it fails
    }
  };

  useEffect(() => {
    if (activeTab === 'bank') {
      fetchBankExams();
    }
    fetchResources();
  }, [activeTab]);

  const generateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل التوليد');
      }
      setExams([data, ...exams]);
      setShowAnswerKeys({ ...showAnswerKeys, [data.id]: true });
      toast.success('تم توليد الامتحان بنجاح!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const saveToBank = async (exam: Exam) => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam.title,
          questions: exam.questions
        })
      });
      if (!res.ok) throw new Error();
      
      const newSaved = await res.json();
      const updatedExams = exams.map(e => e.id === exam.id ? { ...e, isSaved: true } : e);
      setExams(updatedExams);
      setBankExams([newSaved, ...bankExams]);
      toast.success('تم حفظ الامتحان في بنك الأسئلة بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const deleteFromBank = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBankExams(bankExams.filter(e => e.id !== id));
      toast.success('تم الحذف بنجاح');
    } catch {
      toast.error('فشل عملية الحذف');
    }
  };

  const reuseExam = (exam: Exam) => {
    const duplicated = {
      ...exam,
      id: `EXAM-DUPLICATE-${Date.now()}`,
      title: `${exam.title} (نسخة)`,
      createdAt: new Date().toISOString(),
      isSaved: false
    };
    setExams([duplicated, ...exams]);
    setActiveTab('generate');
    toast.success('تم استنساخ الامتحان، يمكنك تعديله الآن');
  };

  const startEditing = (exam: Exam) => {
    setEditingExamId(exam.id);
    setEditFormText(JSON.stringify(exam.questions, null, 2));
  };

  const saveEditedExam = async (exam: Exam) => {
    try {
      const parsed = JSON.parse(editFormText);
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed })
      });
      if (!res.ok) throw new Error();
      toast.success('تم حفظ التعديلات');
      setEditingExamId(null);
      fetchBankExams();
    } catch {
      toast.error('صيغة JSON غير صحيحة أو حدث خطأ أثناء الحفظ');
    }
  };

  const copyForGoogleForms = (exam: Exam) => {
    const text = exam.questions.map((q, idx) => {
      let qText = `${idx + 1}. ${q.questionText}\n`;
      if (q.options) {
        q.options.forEach(opt => { qText += `- ${opt}\n`; });
      }
      qText += `الجواب: ${q.correctAnswer}\n`;
      return qText;
    }).join('\n\n');

    navigator.clipboard.writeText(`امتحان: ${exam.title}\n\n${text}`);
    toast.success('تم نسخ الامتحان بتنسيق نصي متوافق، يمكنك لصقه بسهولة');
  };

  const toggleAnswerKey = (examId: string) => {
    setShowAnswerKeys(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  const filteredBank = useMemo(() => {
    if (!searchQuery) return bankExams;
    return bankExams.filter(e => 
      e.title.includes(searchQuery) || 
      e.questions.some(q => q.questionText.includes(searchQuery))
    );
  }, [bankExams, searchQuery]);

  const availableResources = useMemo(() => {
    return resources.filter(r => r.grade === form.grade && r.subject === form.subject);
  }, [resources, form.grade, form.subject]);

  const renderExamList = (list: Exam[], isBank: boolean = false) => (
    list.map((exam) => (
      <div key={exam.id} className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm print:shadow-none print:border-none relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{exam.title}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">تاريخ النشر: {new Date(exam.createdAt).toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden fill-current">
            <button 
              onClick={() => toggleAnswerKey(exam.id)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAnswerKeys[exam.id] ? 'bg-brand-light text-white' : 'bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <ListChecks className="w-4 h-4" />
              {showAnswerKeys[exam.id] ? 'إخفاء الإجابات' : 'إظهار الإجابات'}
            </button>
            <button onClick={() => copyForGoogleForms(exam)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[var(--text-primary)] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Google Forms
            </button>
            <button onClick={handlePrint} className="p-2 text-[var(--text-secondary)] hover:bg-brand-light/10 hover:text-brand-light rounded-lg transition-colors" title="طباعة/PDF">
              <Download className="w-5 h-5" />
            </button>
            
            {isBank && (
              <>
                <button onClick={() => reuseExam(exam)} className="p-2 text-[var(--text-secondary)] hover:bg-brand-light/10 hover:text-brand-light rounded-lg transition-colors" title="استخدام مرة أخرى">
                  <Copy className="w-5 h-5" />
                </button>
                <button onClick={() => startEditing(exam)} className="p-2 text-[var(--text-secondary)] hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors" title="تعديل">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => deleteFromBank(exam.id)} className="p-2 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors" title="حذف">
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}

            {!isBank && !exam.isSaved && (
              <button onClick={() => saveToBank(exam)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-light/10 text-brand-light hover:bg-brand-light/20 transition-colors text-sm font-medium">
                <Save className="w-4 h-4" /> حفظ في البنك
              </button>
            )}
            {!isBank && exam.isSaved && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium">
                <Check className="w-4 h-4" /> محفوظ
              </span>
            )}
          </div>
        </div>

        {editingExamId === exam.id ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <span className="font-medium text-sm text-[var(--text-primary)]">تعديل بنية الأسئلة (JSON)</span>
              <button onClick={() => setEditingExamId(null)} className="text-gray-500 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            <textarea
              className="w-full h-64 p-4 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]"
              value={editFormText}
              onChange={e => setEditFormText(e.target.value)}
              dir="ltr"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingExamId(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[var(--text-primary)] rounded-lg text-sm font-medium">إلغاء</button>
              <button onClick={() => saveEditedExam(exam)} className="px-4 py-2 bg-brand-light text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Save className="w-4 h-4"/> حفظ التعديلات
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {exam.questions.map((q, idx) => (
              <div key={idx} className="space-y-3 print:break-inside-avoid">
                <h4 className="font-semibold text-[var(--text-primary)] flex gap-2 text-lg">
                  <span className="text-brand-light">{idx + 1}.</span> {q.questionText}
                </h4>
                
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-[var(--bg-primary)]">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                        <span className="text-sm text-[var(--text-primary)]">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {showAnswerKeys[exam.id] && (
                  <div className="mt-4 p-3 bg-success/10 rounded-xl flex items-start gap-2 !mt-3">
                    <Check className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-success block">الإجابة النموذجية:</span>
                      <span className="text-sm font-medium text-success">{q.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-light" />
            مولد الاختبارات بالذكاء الاصطناعي
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">توليد تقييمات دقيقة ومخصصة للطلاب بضغطة زر</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-light' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            توليد امتحان
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bank' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-light' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            بنك الأسئلة
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm self-start print:hidden">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">إعدادات الامتحان</h2>
            <form onSubmit={generateExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المرحلة الدراسية</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.stage} onChange={e => {
                    const stage = e.target.value;
                    setForm({...form, stage, grade: EDUCATIONAL_STAGES[stage as keyof typeof EDUCATIONAL_STAGES][0]});
                  }}>
                    {Object.keys(EDUCATIONAL_STAGES).map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصف الدراسي</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                    {EDUCATIONAL_STAGES[form.stage as keyof typeof EDUCATIONAL_STAGES].map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المادة</label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                  <option>العلوم</option>
                  <option>الرياضيات</option>
                  <option>اللغة العربية</option>
                  <option>التربية الإسلامية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المصدر (الكتاب المدرسي/المذكرة)</label>
                <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.sourceResourceId} onChange={e => setForm({...form, sourceResourceId: e.target.value})}>
                  <option value="">-- بدون تحديد (توليد عام) --</option>
                  {availableResources.map(res => (
                    <option key={res.id} value={res.id}>{res.title} ({res.type})</option>
                  ))}
                </select>
                {availableResources.length === 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">لا يوجد ملفات PDF مرتبطة بهذه المادة والصف في مكتبة الموارد.</p>
                )}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">مستوى الصعوبة</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                    <option>سهل</option>
                    <option>متوسط</option>
                    <option>صعب</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">عدد الأسئلة</label>
                  <input type="number" min="1" max="20" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={form.numQuestions} onChange={e => setForm({...form, numQuestions: parseInt(e.target.value)})} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-white bg-brand-light hover:bg-brand-dark transition-colors disabled:opacity-70 mt-6"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                {isGenerating ? 'جاري التوليد الذكي...' : 'توليد الامتحان الآن'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {exams.length === 0 ? (
              <div className="bg-surface border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center flex flex-col items-center justify-center print:hidden">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">لم يتم توليد امتحانات بعد</h3>
                <p className="text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                  استخدم النموذج الجانبي لتوليد أسئلة مخصصة لطلابك باستخدام نموذج الذكاء الاصطناعي المتقدم.
                </p>
              </div>
            ) : renderExamList(exams, false)}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="البحث في بنك الأسئلة برقم الدرس أو كلمة مفتاحية..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-[var(--text-primary)] text-sm"
            />
          </div>

          {filteredBank.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-primary)]">بنك الأسئلة فارغ أو لا توجد نتائج للبحث</h3>
              <p className="text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                قم بتوليد الامتحانات وحفظها إلى البنك للرجوع إليها مستقبلاً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {renderExamList(filteredBank, true)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
