import React, { useState } from 'react';
import { supabase, useAuth } from '../lib/auth-context';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const teacherStyles = {
  container: "bg-[var(--bg-surface)] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800",
  title: "text-xl font-bold mb-6 text-center text-[var(--text-primary)]",
  grid: "grid grid-cols-1 md:grid-cols-3 gap-4",
  button: "flex flex-col items-center p-6 rounded-2xl hover:opacity-90 transition-all text-white",
  icon: "w-10 h-10 mb-2",
  text: "font-bold text-lg",
  input: "w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
};

type StatusType = 'حاضر' | 'غائب' | 'متأخر';

export default function TeacherStyles() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const handleStatusUpdate = async (selectedStatus: StatusType) => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const monthYear = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });

      const { error } = await supabase
        .from('attendance')
        .insert({
          teacher_id: user.id,
          status: selectedStatus,
          date: today,
          month_year: monthYear
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(i18n.language === 'ar' ? 'لقد قمت بتسجيل حضورك مسبقاً لهذا اليوم' : 'You have already registered your attendance today.');
        } else {
          console.error("Supabase Error:", error);
          toast.error('Database connection failed');
        }
      } else {
        toast.success(i18n.language === 'ar' ? `تم تسجيل الحالة: ${selectedStatus}` : `Status registered: ${selectedStatus}`);
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      toast.error('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={teacherStyles.container} dir={i18n.dir()}>
      <h2 className={teacherStyles.title}>{t('attendance_title')}</h2>
      <div className={teacherStyles.grid}>
        
        <button 
          onClick={() => handleStatusUpdate('حاضر')}
          disabled={loading}
          className={`${teacherStyles.button} bg-green-500`}
        >
          <CheckCircle className={teacherStyles.icon} />
          <span className={teacherStyles.text}>{t('status_present')}</span>
        </button>

        <button 
          onClick={() => handleStatusUpdate('متأخر')}
          disabled={loading}
          className={`${teacherStyles.button} bg-amber-500`}
        >
          <Clock className={teacherStyles.icon} />
          <span className={teacherStyles.text}>{t('status_late')}</span>
        </button>

        <button 
          onClick={() => handleStatusUpdate('غائب')}
          disabled={loading}
          className={`${teacherStyles.button} bg-red-500`}
        >
          <XCircle className={teacherStyles.icon} />
          <span className={teacherStyles.text}>{t('status_absent')}</span>
        </button>

      </div>
    </div>
  );
}