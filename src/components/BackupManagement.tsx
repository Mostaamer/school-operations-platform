import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, Trash2, Clock, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Backup {
  id: string;
  name: string;
  size: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

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

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `نسخة يدوية - ${new Date().toLocaleDateString('ar-EG')}` })
      });
      if (!res.ok) throw new Error();
      
      toast.success('تم أخذ نسخة احتياطية بنجاح');
      fetchBackups();
    } catch {
      toast.error('حدث خطأ أثناء أخذ النسخة');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.')) return;
    setRestoringId(id);
    try {
      const res = await fetch(`/api/backups/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success('تم استعادة النظام بنجاح من النسخة المحددة');
    } catch {
      toast.error('فشل استعادة النظام');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) return;
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم حذف النسخة بنجاح');
      setBackups(backups.filter(b => b.id !== id));
    } catch {
      toast.error('فشل الحذف');
    }
  };

  const handleDownload = (backup: Backup) => {
    toast.success(`جاري تحميل ${backup.name}...`);
    // Placeholder download logic
    setTimeout(() => {
      const blob = new Blob(['Mock backup data'], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.id}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-light" />
            النسخ الاحتياطي (Backups)
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">إدارة وحفظ بيانات النظام بأمان</p>
        </div>
        
        <button 
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="flex items-center gap-2 py-2.5 px-4 bg-brand-light text-white rounded-xl shadow-sm hover:bg-brand-dark transition-colors font-medium disabled:opacity-70"
        >
          {isCreating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          إنشاء نسخة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">إجمالي النسخ الاحتياطية</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{backups.length}</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">حالة النظام</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">آمن ومستقر</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">آخر نسخة تم أخذها</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-1" dir="ltr">
              {backups.length > 0 ? new Date(backups[0].createdAt).toLocaleString('ar-EG') : 'لا يوجد'}
            </p>
          </div>
        </div>
      </div>

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
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${backup.type === 'AUTOMATIC' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {backup.type === 'AUTOMATIC' ? 'تلقائي' : 'يدوي'}
                      </span>
                    </td>
                    <td className="p-4 align-middle whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRestore(backup.id)}
                          disabled={restoringId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 transition-colors text-xs font-medium disabled:opacity-50"
                        >
                          {restoringId === backup.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
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
                          onClick={() => handleDelete(backup.id)}
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
