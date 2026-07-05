import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/auth-context';
import { useAuth } from '../lib/auth-context';
import { Calendar, Clock, BookOpen, Loader2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (user) fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedule') 
        .select('*')
        .eq('teacher_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setScheduleData(data || []);
    } catch (err) {
      toast.error(t('teacher_schedule.fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-sm text-gray-400 font-medium animate-pulse">{t('teacher_schedule.loading_data')}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500" dir={i18n.dir()}>
      <div className="flex items-center justify-between mb-8 border-b pb-4 border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('teacher_schedule.title')}</h2>
          <p className="text-sm text-gray-500">{t('teacher_schedule.subtitle')}</p>
        </div>
        <div className="bg-blue-600/10 text-blue-600 px-4 py-2 rounded-lg font-bold">
          {scheduleData.length} {t('teacher_schedule.lessons_count')}
        </div>
      </div>
      
      {scheduleData.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-600">{t('teacher_schedule.no_data')}</h3>
          <p className="text-gray-400">{t('teacher_schedule.no_lessons_assigned')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {scheduleData.map((item, index) => (
            <div key={index} className="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-blue-500 transition-all flex items-center justify-between overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-5">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-800 dark:text-white">{item.subject_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <GraduationCap className="w-4 h-4" />
                    <span>{t('teacher_schedule.grade_level')}: {item.grade_level}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 px-5 py-3 rounded-xl border border-gray-100 dark:border-slate-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                  {item.start_time} - {item.end_time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}