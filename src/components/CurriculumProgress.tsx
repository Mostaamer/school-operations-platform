import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { BookOpen, CheckCircle2, ChevronDown, Save, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Curriculum {
  id: string;
  teacherId: string;
  teacherName: string;
  grade: string;
  classSection: string;
  subject: string;
  unit: string;
  lesson: string;
  plannedUnit?: string;
  plannedLesson?: string;
  lastCompletedPage: number;
  activitiesCompleted: boolean;
  homeworkAssigned: boolean;
  lastUpdated: string;
}

export default function CurriculumProgress() {
  const { user } = useAuth();
  const [curriculumData, setCurriculumData] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Curriculum>>({});
  
  const [isAdding, setIsAdding] = useState(false);

  const fetchCurriculum = () => {
    fetch('/api/curriculum')
      .then(res => res.json())
      .then(data => {
        // Teacher sees only their own or all?
        // Let's filter client side for now just for simplicity, or show all to supervisor and developer
        if (user?.role === 'TEACHER') {
          setCurriculumData(data.filter((c: Curriculum) => c.teacherId === user.employeeCode));
        } else {
          setCurriculumData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('حدث خطأ أثناء جلب تقدم المنهج');
      });
  };

  useEffect(() => {
    fetchCurriculum();

    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CURRICULUM_UPDATE') {
          if (user?.role !== 'TEACHER') {
             toast.success(`إشعار: ${data.message}`, { icon: '📖' });
          }
          fetchCurriculum();
        }
      } catch (err) {
        // ignore
      }
    };
    return () => eventSource.close();
  }, [user]);

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/curriculum/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error();
      
      toast.success('تم تحديث سير المنهج بنجاح');
      setEditingId(null);
      fetchCurriculum();
    } catch {
      toast.error('فشل في التحديث');
    }
  };

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          teacherId: user?.employeeCode,
          teacherName: user?.name,
          lastCompletedPage: Number(editForm.lastCompletedPage) || 0,
          activitiesCompleted: Boolean(editForm.activitiesCompleted),
          homeworkAssigned: Boolean(editForm.homeworkAssigned)
        })
      });
      if (!res.ok) throw new Error();
      toast.success('تمت إضافة المتابعة بنجاح');
      setIsAdding(false);
      setEditForm({});
      fetchCurriculum();
    } catch {
      toast.error('فشل في الإضافة');
    }
  };

  const isEditable = user?.role === 'TEACHER' || user?.role === 'DEVELOPER' || user?.role === 'SUPERVISOR';

  if (loading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-light" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">متابعة المناهج الدراسية</h1>
          <p className="text-[var(--text-secondary)] mt-1">تتبع خط سير المناهج، الأنشطة والواجبات المنجزة</p>
        </div>
        
        {isEditable && !isAdding && (
          <button 
            onClick={() => {
              setEditForm({
                subject: 'العلوم',
                grade: 'الصف 7',
                classSection: 'أ',
                unit: '1',
                lesson: '1',
                lastCompletedPage: 0,
                activitiesCompleted: false,
                homeworkAssigned: false
              });
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium">
            <Plus className="w-5 h-5" />
            إضافة تحديث جديد
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-surface p-6 rounded-2xl border border-brand-light shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">تسجيل تقدم جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">المادة</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصف</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.grade} onChange={e => setEditForm({...editForm, grade: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الفصل</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.classSection} onChange={e => setEditForm({...editForm, classSection: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">رقم الوحدة</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">رقم الدرس</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.lesson} onChange={e => setEditForm({...editForm, lesson: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الصفحة المتوقفة عندها</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)]" value={editForm.lastCompletedPage || ''} onChange={e => setEditForm({...editForm, lastCompletedPage: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="add-act" checked={editForm.activitiesCompleted} onChange={e => setEditForm({...editForm, activitiesCompleted: e.target.checked})} className="w-4 h-4 text-brand-light rounded border-gray-300" />
              <label htmlFor="add-act" className="text-sm font-medium text-[var(--text-primary)]">تم إنجاز الأنشطة</label>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="add-hw" checked={editForm.homeworkAssigned} onChange={e => setEditForm({...editForm, homeworkAssigned: e.target.checked})} className="w-4 h-4 text-brand-light rounded border-gray-300" />
              <label htmlFor="add-hw" className="text-sm font-medium text-[var(--text-primary)]">تم تعيين الواجب</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 font-medium bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)] rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">إلغاء</button>
            <button onClick={handleAdd} className="px-4 py-2 font-medium bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" /> حفظ التقدم
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {curriculumData.map((item) => (
          <div key={item.id} className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-6 hover:border-brand-light/50 transition-colors">
            
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-brand-light/10 p-2 rounded-lg text-brand-light">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{item.subject}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)] rounded-md text-xs font-medium">
                          {item.grade} - فصل {item.classSection}
                        </span>
                        {item.plannedUnit && item.plannedLesson && (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                            parseInt(item.unit) > parseInt(item.plannedUnit) || (parseInt(item.unit) === parseInt(item.plannedUnit) && parseInt(item.lesson) > parseInt(item.plannedLesson)) ? 'bg-success/20 text-success' :
                            parseInt(item.unit) === parseInt(item.plannedUnit) && parseInt(item.lesson) === parseInt(item.plannedLesson) ? 'bg-brand-light/20 text-brand-light' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {parseInt(item.unit) > parseInt(item.plannedUnit) || (parseInt(item.unit) === parseInt(item.plannedUnit) && parseInt(item.lesson) > parseInt(item.plannedLesson)) ? 'متقدم على الخطة' :
                             parseInt(item.unit) === parseInt(item.plannedUnit) && parseInt(item.lesson) === parseInt(item.plannedLesson) ? 'حسب الخطة' :
                             'متأخر عن الخطة'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {user?.role !== 'TEACHER' && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2">المعلم: <span className="font-medium text-[var(--text-primary)]">{item.teacherName}</span></p>
                  )}
                </div>
                
                {isEditable && editingId !== item.id && (
                  <button 
                    onClick={() => {
                      setEditingId(item.id);
                      setEditForm(item);
                    }}
                    className="text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-brand-light font-medium rounded-lg hover:bg-brand-light/10 transition-colors"
                  >
                    تحديث
                  </button>
                )}
              </div>

              {editingId === item.id ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">رقم الوحدة</label>
                      <input type="text" className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[var(--text-primary)]" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">الدرس المنتهي</label>
                      <input type="text" className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[var(--text-primary)]" value={editForm.lesson} onChange={e => setEditForm({...editForm, lesson: e.target.value})} />
                    </div>
                    {user?.role !== 'TEACHER' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">الوحدة المقررة (الخطة)</label>
                          <input type="text" className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[var(--text-primary)]" value={editForm.plannedUnit || ''} onChange={e => setEditForm({...editForm, plannedUnit: e.target.value})} placeholder="الخطة" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">الدرس المقرر (الخطة)</label>
                          <input type="text" className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[var(--text-primary)]" value={editForm.plannedLesson || ''} onChange={e => setEditForm({...editForm, plannedLesson: e.target.value})} placeholder="الخطة" />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">الصفحة المنتهية</label>
                      <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-[var(--text-primary)]" value={editForm.lastCompletedPage} onChange={e => setEditForm({...editForm, lastCompletedPage: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mb-4">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <input type="checkbox" checked={editForm.activitiesCompleted} onChange={e => setEditForm({...editForm, activitiesCompleted: e.target.checked})} className="rounded text-brand-light border-gray-300" />
                      إتمام الأنشطة
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <input type="checkbox" checked={editForm.homeworkAssigned} onChange={e => setEditForm({...editForm, homeworkAssigned: e.target.checked})} className="rounded text-brand-light border-gray-300" />
                      الواجب المعين
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0 rounded-lg">إلغاء</button>
                    <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 text-sm font-medium text-white bg-success hover:bg-success/90 shrink-0 rounded-lg">حفظ التحديث</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">الوحدة المنتهية</p>
                    <p className="font-bold text-[var(--text-primary)]">{item.unit}</p>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">الدرس المنتهي</p>
                    <p className="font-bold text-[var(--text-primary)]">{item.lesson}</p>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">آخر صفحة تم شرحها</p>
                    <p className="font-bold text-brand-light">{item.lastCompletedPage}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 justify-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${item.activitiesCompleted ? 'text-success' : 'text-gray-300 dark:text-gray-700'}`} />
                      <span className={`text-sm ${item.activitiesCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>الأنشطة المنجزة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${item.homeworkAssigned ? 'text-success' : 'text-gray-300 dark:text-gray-700'}`} />
                      <span className={`text-sm ${item.homeworkAssigned ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>الواجب المعين</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:w-48 flex flex-col justify-end text-left shrink-0">
              <p className="text-xs text-[var(--text-secondary)] font-mono" dir="ltr">آخر تحديث: {new Date(item.lastUpdated).toLocaleDateString('ar-EG')}</p>
            </div>

          </div>
        ))}

        {curriculumData.length === 0 && !loading && !isAdding && (
          <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">لا يوجد سجلات تقدم</h3>
            <p className="text-[var(--text-secondary)] mt-1">لم يتم تسجيل أي تقدم في المناهج حتى الآن.</p>
          </div>
        )}
      </div>
    </div>
  );
}
