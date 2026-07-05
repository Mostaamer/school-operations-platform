import React, { useState, useEffect } from 'react';
import { supabase, useAuth } from '../lib/auth-context';
import { CheckCircle, XCircle, Clock, Send, CalendarDays, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type StatusType = 'حاضر' | 'غائب' | 'متأخر';

export default function TeacherStatus() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    // تحويل لغة التاريخ تلقائياً حسب لغة السيستم الحالية
    const currentLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    setCurrentDate(new Date().toLocaleDateString(currentLocale, options));
  }, [i18n.language]);

  // دالة عرض التنبيه الاحترافي
  const showCustomError = (message: string) => {
    toast.custom((tToast) => (
      <div className={`${tToast.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl border border-red-100 flex p-4 pointer-events-auto`} dir={i18n.dir()}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{t('alert_title')}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    ), { duration: 4000 });
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error(t('err_select_status'));
      return;
    }

    if ((selectedStatus === 'غائب' || selectedStatus === 'متأخر') && !reason.trim()) {
      toast.error(t('err_write_reason'));
      return;
    }

    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
      const monthYear = new Date().toLocaleDateString(currentLocale, { month: 'long', year: 'numeric' });

      // التحقق مما إذا كان المعلم قد سجل بالفعل اليوم
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (checkError) throw checkError;

      // منع الإرسال إذا وجد سجل مسبق
      if (existingRecord) {
        showCustomError(t('err_already_registered'));
        setLoading(false);
        return;
      }

      // إضافة السجل الجديد (مع الحفاظ على القيم الأساسية لقاعدة البيانات)
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          teacher_id: user.id,
          status: selectedStatus,
          reason: selectedStatus === 'حاضر' ? null : reason.trim(),
          date: today,
          month_year: monthYear
        });

      if (insertError) throw insertError;

      toast.success(t('success_registered'), { icon: '✅' });
      setSelectedStatus(null);
      setReason('');
    } catch (err) {
      console.error("Error:", err);
      toast.error(t('err_server'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 text-start" dir={i18n.dir()}>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t('attendance_title')}</h2>
          <p className="text-blue-100 opacity-90">{t('attendance_subtitle')}</p>
        </div>
        <div className="hidden md:flex flex-col items-end bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <CalendarDays className="w-6 h-6 mb-1" />
          <span className="text-sm font-medium">{currentDate}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-b-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          {t('step_1')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <button
            type="button"
            onClick={() => { setSelectedStatus('حاضر'); setReason(''); }}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedStatus === 'حاضر'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md transform scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <CheckCircle className={`w-12 h-12 mb-3 ${selectedStatus === 'حاضر' ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={`text-xl font-bold ${selectedStatus === 'حاضر' ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>{t('status_present')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('متأخر')}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedStatus === 'متأخر'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md transform scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 hover:border-amber-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Clock className={`w-12 h-12 mb-3 ${selectedStatus === 'متأخر' ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className={`text-xl font-bold ${selectedStatus === 'متأخر' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'}`}>{t('status_late')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('غائب')}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedStatus === 'غائب'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md transform scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <XCircle className={`w-12 h-12 mb-3 ${selectedStatus === 'غائب' ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`text-xl font-bold ${selectedStatus === 'غائب' ? 'text-red-700 dark:text-red-400' : 'text-gray-500'}`}>{t('status_absent')}</span>
          </button>
        </div>

        {(selectedStatus === 'متأخر' || selectedStatus === 'غائب') && (
          <div className="mb-8 animate-in fade-in zoom-in duration-300">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {t('step_2')} <span className="text-red-500 text-sm">{t('required')}</span>
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={selectedStatus === 'متأخر' ? t('placeholder_reason_late') : t('placeholder_reason_absent')}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none min-h-[120px]"
            ></textarea>
          </div>
        )}

        <div className="flex justify-end mt-4 border-t border-gray-100 dark:border-gray-700 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedStatus || loading}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              !selectedStatus || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
            }`}
          >
            {loading ? (
              <span className="animate-pulse">{t('sending')}</span>
            ) : (
              <>
                <span>{t('confirm_register')}</span>
                <Send className={`w-5 h-5 ${i18n.dir() === 'rtl' ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}