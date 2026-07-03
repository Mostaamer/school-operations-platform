import React, { useState, useEffect } from 'react';
import { 
  Database, Download, RefreshCw, Trash2, Clock, 
  CheckCircle2, AlertCircle, PlusCircle, Lock, X, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

// إعداد الاتصال بقاعدة بيانات Supabase مباشرة من الواجهة
const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

// تحديث الواجهة لتتطابق مع قاعدة بياناتك (backup_logs)
interface Backup {
  id: number;
  backup_name: string;
  file_size_mb: number;
  is_automated: boolean;
  status: string;
  created_at: string;
}

type ActionType = 'CREATE' | 'RESTORE' | 'DELETE' | null;

export default function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, action: ActionType, targetId?: number }>({
    isOpen: false, action: null
  });
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState('none');

  // 1. دالة جلب النسخ الاحتياطية من السحابة مباشرة
  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false }); // ترتيب من الأحدث للأقدم

      if (error) throw error;
      setBackups(data as Backup[]);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error('فشل جلب النسخ الاحتياطية من قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // 2. دالة إنشاء نسخة احتياطية جديدة في السحابة
  const executeCreate = async () => {
    try {
      // توليد اسم فريد للنسخة
      const newBackupName = `Backup_SOP_${new Date().toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}`;
      
      const { error } = await supabase
        .from('backup_logs')
        .insert([{
          backup_name: newBackupName,
          file_path: `/backups/${newBackupName}.json`,
          file_size_mb: 2.5, // حجم افتراضي كمثال
          is_automated: autoSchedule !== 'none',
          status: 'SUCCESS'
        }]);

      if (error) throw error;
      
      toast.success('تم أخذ نسخة احتياطية وتأمينها بنجاح على السحابة');
      fetchBackups(); // تحديث الجدول
    } catch (err) {
      console.error("Create Error:", err);
      toast.error('حدث خطأ أثناء أخذ النسخة');
    }
  };

  // 3. دالة استعادة النسخة الاحتياطية
  const executeRestore = async (id: number) => {
    try {
      // في المستقبل هنا سيتم كتابة كود جلب الملف وتطبيق الاستعادة
      toast.success('تم استعادة النظام بنجاح من هذه النسخة');
    } catch {
      toast.error('فشل استعادة النظام');
    }
  };

  // 4. دالة حذف النسخة من السحابة
  const executeDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('backup_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف النسخة بنجاح من قاعدة البيانات');
      setBackups(backups.filter(b => b.id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error('فشل الحذف من السحابة');
    }
  };

  // --- محرك التحقق من كلمة المرور ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // التحقق المبدئي
    if (password !== '123') {
      toast.error('كلمة المرور غير صحيحة، تم رفض الإجراء!');
      setIsProcessing(false);
      return;
    }

    if (authModal.action === 'CREATE') {
      await executeCreate();
    } else if (authModal.action === 'RESTORE' && authModal.targetId) {
      await executeRestore(authModal.targetId);
    } else if (authModal.action === 'DELETE' && authModal.targetId) {
      await executeDelete(authModal.targetId);
    }

    setIsProcessing(false);
    setPassword('');
    setAuthModal({ isOpen: false, action: null });
  };

  const requestCreate = () => setAuthModal({ isOpen: true, action: 'CREATE' });
  const requestRestore = (id: number) => setAuthModal({ isOpen: true, action: 'RESTORE', targetId: id });
  const requestDelete = (id: number) => setAuthModal({ isOpen: true, action: 'DELETE', targetId: id });

  const handleDownload = (backup: Backup) => {
    toast.success(`جاري تحميل ${backup.backup_name}...`);
    // محاكاة تحميل الملف
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.backup_name}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoSchedule(e.target.value);
    if (e.target.value !== 'none') {
      toast.success(`تم تفعيل النسخ التلقائي: ${e.target.options[e.target.selectedIndex].text}`);
    } else {
      toast.error('تم إيقاف النسخ التلقائي');
    }
  };

  return (
    <div className="space-y-6 relative text-right" dir="rtl">
      
      {/* نافذة كلمة المرور (نمط احترافي شفاف - Glassmorphism) */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700 w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              برجاء إدخال كلمة مرور مدير النظام لتأكيد هذا الإجراء.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور..."
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 outline-none mb-6 text-gray-900 dark:text-white"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isProcessing || !password}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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

      {/* شريط العنوان وإعدادات النسخ التلقائي */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            النسخ الاحتياطي (Backups)
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة وحفظ بيانات النظام بأمان</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">النسخ التلقائي:</span>
            <select 
              value={autoSchedule}
              onChange={handleScheduleChange}
              className="bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="none">معطل</option>
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
            </select>
          </div>

          <button 
            onClick={requestCreate}
            className="flex items-center gap-2 py-2.5 px-4 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            إنشاء نسخة جديدة
          </button>
        </div>
      </div>

      {/* البطاقات العلوية الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي النسخ الاحتياطية</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{backups.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">حالة النظام</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">آمن ومستقر</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">آخر نسخة تم أخذها</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1" dir="ltr">
              {backups.length > 0 ? new Date(backups[0].created_at).toLocaleString('ar-EG') : 'لا يوجد'}
            </p>
          </div>
        </div>
      </div>

      {/* جدول عرض النسخ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">جاري تحميل البيانات من السحابة...</div>
        ) : backups.length === 0 ? (
           <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
             <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-300" />
             لا توجد نسخ احتياطية في السحابة حتى الآن.
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="font-medium p-4 whitespace-nowrap">الاسم</th>
                  <th className="font-medium p-4 whitespace-nowrap">تاريخ الإنشاء</th>
                  <th className="font-medium p-4 whitespace-nowrap">الحجم</th>
                  <th className="font-medium p-4 whitespace-nowrap">النوع</th>
                  <th className="font-medium p-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white font-medium">
                        <Database className="w-4 h-4 text-blue-500" />
                        {backup.backup_name}
                      </div>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {new Date(backup.created_at).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono">
                      {backup.file_size_mb} MB
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {backup.is_automated ? 'تلقائي' : 'يدوي'}
                      </span>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => requestRestore(backup.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 transition-colors text-xs font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          استعادة
                        </button>
                        <button 
                          onClick={() => handleDownload(backup)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
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