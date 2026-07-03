import React, { useState, useEffect } from 'react';
import { 
  Database, Download, RefreshCw, Trash2, Clock, 
  CheckCircle2, AlertCircle, PlusCircle, Lock, X, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Backup {
  id: string;
  name: string;
  size: string;
  type: string;
  status: string;
  createdAt: string;
}

// تحديد أنواع الإجراءات التي تتطلب كلمة مرور
type ActionType = 'CREATE' | 'RESTORE' | 'DELETE' | null;

export default function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات نافذة كلمة المرور
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, action: ActionType, targetId?: string }>({
    isOpen: false, action: null
  });
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // حالة إعدادات النسخ التلقائي
  const [autoSchedule, setAutoSchedule] = useState('none');

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      setBackups(data);
      setLoading(false);
    } catch {
      toast.error('فشل جلب النسخ الاحتياطية');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // --- دوال تنفيذ الإجراءات بعد إدخال كلمة المرور الصحيحة ---

  const executeCreate = async () => {
    try {
      const res = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error();
      toast.success('تم أخذ نسخة احتياطية وتأمينها بنجاح');
      fetchBackups();
    } catch {
      toast.error('حدث خطأ أثناء أخذ النسخة');
    }
  };

  const executeRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/backups/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success('تم استعادة النظام بنجاح');
      window.location.reload(); 
    } catch {
      toast.error('فشل استعادة النظام');
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم حذف النسخة بنجاح');
      setBackups(backups.filter(b => b.id !== id));
    } catch {
      toast.error('فشل الحذف');
    }
  };

  // --- دالة التحقق من كلمة المرور (المحرك الرئيسي) ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // ملاحظة للمطور: حالياً نتحقق من الرقم '123' كمثال. 
    // لاحقاً يجب إرسال الباسورد للسيرفر للتحقق منه لمزيد من الأمان.
    if (password !== '123') {
      toast.error('كلمة المرور غير صحيحة، تم رفض الإجراء!');
      setIsProcessing(false);
      return;
    }

    // إذا كانت كلمة المرور صحيحة، نفذ الإجراء المطلوب
    if (authModal.action === 'CREATE') {
      await executeCreate();
    } else if (authModal.action === 'RESTORE' && authModal.targetId) {
      await executeRestore(authModal.targetId);
    } else if (authModal.action === 'DELETE' && authModal.targetId) {
      await executeDelete(authModal.targetId);
    }

    // إغلاق النافذة وتفريغ الحقل
    setIsProcessing(false);
    setPassword('');
    setAuthModal({ isOpen: false, action: null });
  };

  // دوال فتح نافذة التحقق
  const requestCreate = () => setAuthModal({ isOpen: true, action: 'CREATE' });
  const requestRestore = (id: string) => setAuthModal({ isOpen: true, action: 'RESTORE', targetId: id });
  const requestDelete = (id: string) => setAuthModal({ isOpen: true, action: 'DELETE', targetId: id });

  const handleDownload = (backup: Backup) => {
    toast.success(`جاري تحميل ${backup.name}...`);
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoSchedule(e.target.value);
    if (e.target.value !== 'none') {
      toast.success(`تم تفعيل النسخ التلقائي: ${e.target.options[e.target.selectedIndex].text}`);
      // هنا يمكنك لاحقاً ربطها بـ API لحفظ الإعداد في قاعدة البيانات
    } else {
      toast.error('تم إيقاف النسخ التلقائي');
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* --- نافذة كلمة المرور (Glassmorphism Style) --- */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" />
                إجراء محمي
              </h3>
              <button 
                onClick={() => { setAuthModal({ isOpen: false, action: null }); setPassword(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              برجاء إدخال كلمة مرور مدير النظام لتأكيد هذا الإجراء.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-brand-light outline-none mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isProcessing || !password}
                  className="flex-1 bg-brand-light text-white py-2.5 rounded-xl font-medium shadow-sm hover:bg-brand-dark transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'تأكيد الإجراء'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModal({ isOpen: false, action: null }); setPassword(''); }}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- شريط العنوان وإعدادات النسخ التلقائي --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-light" />
            النسخ الاحتياطي (Backups)
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">إدارة وحفظ بيانات النظام بأمان</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">النسخ التلقائي:</span>
            <select 
              value={autoSchedule}
              onChange={handleScheduleChange}
              className="bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="none">معطل</option>
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
            </select>
          </div>

          <button 
            onClick={requestCreate}
            className="flex items-center gap-2 py-2.5 px-4 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            إنشاء نسخة جديدة
          </button>
        </div>
      </div>

      {/* --- البطاقات العلوية --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">إجمالي النسخ الاحتياطية</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{backups.length}</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">حالة النظام</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">آمن ومستقر</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">آخر نسخة تم أخذها</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-1" dir="ltr">
              {backups.length > 0 ? new Date(backups[backups.length - 1].createdAt).toLocaleString('ar-EG') : 'لا يوجد'}
            </p>
          </div>
        </div>
      </div>

      {/* --- جدول البيانات --- */}
      <div className="bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-secondary)]">جاري التحميل...</div>
        ) : backups.length === 0 ? (
           <div className="p-12 text-center text-[var(--text-secondary)] bg-gray-50/50 dark:bg-gray-900/50">
             <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-300" />
             لا توجد نسخ احتياطية حتى الآن.
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-[var(--text-secondary)]">
                <tr>
                  <th className="font-medium p-4 whitespace-nowrap">الاسم</th>
                  <th className="font-medium p-4 whitespace-nowrap">تاريخ الإنشاء</th>
                  <th className="font-medium p-4 whitespace-nowrap">الحجم</th>
                  <th className="font-medium p-4 whitespace-nowrap">النوع</th>
                  <th className="font-medium p-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3 text-[var(--text-primary)] font-medium">
                        <Database className="w-4 h-4 text-brand-light" />
                        {backup.name}
                      </div>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-[var(--text-secondary)]">
                      {new Date(backup.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-[var(--text-secondary)] font-mono">
                      {backup.size}
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`}>
                        {backup.type === 'AUTOMATIC' ? 'تلقائي' : 'يدوي'}
                      </span>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
                        {/* أزرار الإجراءات تستدعي نافذة الباسورد بدلاً من التنفيذ المباشر */}
                        <button 
                          onClick={() => requestRestore(backup.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 transition-colors text-xs font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          استعادة
                        </button>
                        <button 
                          onClick={() => handleDownload(backup)}
                          className="p-1.5 text-gray-400 hover:text-brand-light hover:bg-brand-light/10 rounded-lg transition-colors"
                          title="تحميل"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => requestDelete(backup.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}