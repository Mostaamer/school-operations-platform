import React, { useState, useEffect } from 'react';

import { useAuth } from '../lib/auth-context';

import toast from 'react-hot-toast';

import { createClient } from '@supabase/supabase-js';

import { Users, GraduationCap, CalendarDays, BarChart3, FileSpreadsheet } from 'lucide-react';



// استيراد المكونات الأساسية للسيستم

import TeacherManagement from './TeacherManagement';

import ClassroomTracking from './ClassroomTracking';

import SupervisorMonitoring from './SupervisorMonitoring';



const supabase = createClient(

  "https://wwgchgvykykeapbnivmr.supabase.co",

  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"

);



export default function Dashboard() {

  const { user } = useAuth();

  const [teacherAttStatus, setTeacherAttStatus] = useState<string | null>(null);

  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'ar');

  const [activeTab, setActiveTab] = useState('reports'); // الافتراضي تبويب التقارير



  const [stats, setStats] = useState({

    teachersCount: 0,

    classesCount: 0,

    schedulesCount: 0

  });

  const [loadingStats, setLoadingStats] = useState(false);



  useEffect(() => {

    async function fetchSchoolStats() {

      if (user?.role !== 'ADMIN') return;

      setLoadingStats(true);

      try {

        const { count: teachers } = await supabase

          .from('users')

          .select('*', { count: 'exact', head: true })

          .eq('role', 'TEACHER');



        const { count: classes } = await supabase

          .from('classes')

          .select('*', { count: 'exact', head: true });



        const { count: schedules } = await supabase

          .from('schedules')

          .select('*', { count: 'exact', head: true });



        setStats({

          teachersCount: teachers || 0,

          classesCount: classes || 0,

          schedulesCount: schedules || 0

        });

      } catch (err) {

        console.error("Error fetching stats:", err);

      } finally {

        setLoadingStats(false);

      }

    }

    fetchSchoolStats();

  }, [user]);



  useEffect(() => {

    const handleStorageChange = () => {

      setLanguage(localStorage.getItem('app_lang') || 'ar');

    };

    window.addEventListener('storage', handleStorageChange);

   

    const interval = setInterval(() => {

      const currentLang = localStorage.getItem('app_lang') || 'ar';

      if (currentLang !== language) {

        setLanguage(currentLang);

      }

    }, 300);



    return () => {

      window.removeEventListener('storage', handleStorageChange);

      clearInterval(interval);

    };

  }, [language]);



  const translate = (key: string) => {

    const translations: Record<string, { ar: string, en: string }> = {

      'لوحة التحكم - وضع المطور': { ar: 'لوحة التحكم - وضع المطور', en: 'Control Panel - Developer Mode' },

      'لوحة إدارة المدرسة': { ar: 'لوحة إدارة المدرسة', en: 'School Management Dashboard' },

      'أهلاً أستاذ': { ar: 'أهلاً أستاذ', en: 'Welcome Teacher' },

      'تسجيل الحضور اليومي': { ar: 'تسجيل الحضور اليومي', en: 'Daily Attendance Registration' },

      'حاضر': { ar: 'حاضر', en: 'Present' },

      'غائب': { ar: 'غائب', en: 'Absent' },

      'لوحة مراقبة المشرف': { ar: 'لوحة مراقبة المشرف', en: 'Supervisor Monitoring Dashboard' },

      'التقارير': { ar: 'التقارير', en: 'Reports' },

      'الإحصائيات': { ar: 'الإحصائيات', en: 'Statistics' },

      'إحصائيات المنصة الحالية': { ar: 'إحصائيات المنصة الحالية', en: 'Current Platform Statistics' },

      'عدد المدرسين المسجلين': { ar: 'عدد المدرسين المسجلين', en: 'Registered Teachers' },

      'جاري تحميل البيانات...': { ar: 'جاري تحميل البيانات...', en: 'Loading data...' },

      'محتوى التقارير قيد التطوير...': { ar: 'محتوى التقارير قيد التطوير...', en: 'Reports content under development...' },

      'تم تسجيل الحضور': { ar: 'تم تسجيل الحضور', en: 'Attendance registered successfully' },

      'خطأ في تسجيل الحضور': { ar: 'خطأ في تسجيل الحضور', en: 'Error registering attendance' }

    };

    return translations[key]?.[language as 'ar' | 'en'] || key;

  };



  const handleTeacherAttendance = async (status: string) => {

    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase

      .from('teacher_attendance')

      .upsert({ teacherId: user.id, date: today, status });

   

    if (!error) {

      setTeacherAttStatus(status);

      toast.success(translate('تم تسجيل الحضور'));

    } else {

      toast.error(translate('خطأ في تسجيل الحضور'));

    }

  };



  return (

    <div className="p-6 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">

     

      {/* 1. لوحة المطور */}

      {user?.role === 'DEVELOPER' && (

        <div className="space-y-6">

          <h1 className="text-2xl font-bold">{translate('لوحة التحكم - وضع المطور')}</h1>

          <TeacherManagement />

        </div>

      )}



      {/* 2. لوحة الإدارة (ADMIN) */}

      {user?.role === 'ADMIN' && (

        <div className="space-y-6">

          <h1 className="text-2xl font-bold text-center sm:text-initial">

            {translate('لوحة إدارة المدرسة')}

          </h1>



          <div className="flex justify-center mb-6">

            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200 dark:border-slate-700">

              {['reports', 'stats'].map((tab) => (

                <button

                  key={tab}

                  onClick={() => setActiveTab(tab)}

                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${

                    activeTab === tab

                      ? 'bg-blue-600 text-white shadow-sm'

                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'

                  }`}

                >

                  {translate(tab === 'reports' ? 'التقارير' : 'الإحصائيات')}

                </button>

              ))}

            </div>

          </div>



          {activeTab === 'reports' && (

            <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center text-[var(--text-secondary)] shadow-sm">

              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />

              {translate('محتوى التقارير قيد التطوير...')}

            </div>

          )}



          {activeTab === 'stats' && (

            <div className="space-y-6">

              <div className="bg-[var(--bg-surface)] border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

                <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">

                  <BarChart3 className="w-5 h-5 text-blue-600" />

                  <h2 className="text-lg font-bold">{translate('إحصائيات المنصة الحالية')}</h2>

                </div>

                {loadingStats ? (

                  <p className="text-center text-[var(--text-secondary)] py-4">{translate('جاري تحميل البيانات...')}</p>

                ) : (

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                    <div className="bg-[var(--bg-primary)] border border-gray-100 dark:border-slate-800 p-5 rounded-xl flex items-center gap-4 shadow-sm">

                      <GraduationCap className="w-8 h-8 text-blue-600" />

                      <div>

                        <p className="text-xs text-[var(--text-secondary)]">{translate('عدد المدرسين المسجلين')}</p>

                        <h4 className="text-xl font-bold">{stats.teachersCount}</h4>

                      </div>

                    </div>

                  </div>

                )}

              </div>

            </div>

          )}



          <div className="mt-8">

            <SupervisorMonitoring />

          </div>

        </div>

      )}



      {/* 3. لوحة المعلم */}

      {user?.role === 'TEACHER' && (

        <div className="space-y-6">

           <h1 className="text-2xl font-bold">{translate('أهلاً أستاذ')} {user?.name?.split(' ')[0]}</h1>

           <div className="bg-[var(--bg-surface)] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">

             <h2 className="text-lg font-bold mb-4">{translate('تسجيل الحضور اليومي')}</h2>

             <div className="flex gap-4">

               <button onClick={() => handleTeacherAttendance('PRESENT')} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">{translate('حاضر')}</button>

               <button onClick={() => handleTeacherAttendance('ABSENT')} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">{translate('غائب')}</button>

             </div>

           </div>

           <ClassroomTracking />

        </div>

      )}



      {/* 4. لوحة المشرف */}

      {user?.role === 'SUPERVISOR' && (

        <div className="space-y-6">

          <h1 className="text-2xl font-bold">{translate('لوحة مراقبة المشرف')}</h1>

          <SupervisorMonitoring />

        </div>

      )}

    </div>

  );

} 