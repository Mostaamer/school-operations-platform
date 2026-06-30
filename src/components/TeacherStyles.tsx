import React, { useState } from 'react';
// استدعاء supabase و useAuth معاً وبشكل صحيح من auth-context
import { supabase, useAuth } from '../lib/auth-context';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const handleStatusUpdate = async (selectedStatus: StatusType) => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const monthYear = new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

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
          toast.error('لقد قمت بتسجيل حضورك مسبقاً لهذا اليوم');
        } else {
          console.error("Supabase Error:", error);
          toast.error('فشل الاتصال بقاعدة البيانات');
        }
      } else {
        toast.success(`تم تسجيل الحالة: ${selectedStatus}`);
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={teacherStyles.container}>
      <h2 className={teacherStyles.title}>تسجيل الحضور اليومي</h2>
      <div className={teacherStyles.grid}>
        
        <button 
          onClick={() => handleStatusUpdate('حاضر')}
          disabled={loading}
          className={`${teacherStyles.button} bg-green-500`}
        >
          <CheckCircle className={teacherStyles.icon} />
          <span className={teacherStyles.text}>حاضر</span>
        </button>

        <button 
          onClick={() => handleStatusUpdate('متأخر')}
          disabled={loading}
          className={`${teacherStyles.button} bg-amber-500`}
        >
          <Clock className={teacherStyles.icon} />
          <span className={teacherStyles.text}>متأخر</span>
        </button>

        <button 
          onClick={() => handleStatusUpdate('غائب')}
          disabled={loading}
          className={`${teacherStyles.button} bg-red-500`}
        >
          <XCircle className={teacherStyles.icon} />
          <span className={teacherStyles.text}>غائب</span>
        </button>

      </div>
    </div>
  );
}