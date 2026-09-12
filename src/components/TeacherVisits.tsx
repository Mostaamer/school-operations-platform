import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/auth-context';
import { Eye, Loader2, UserCheck, ClipboardList, Clock, GraduationCap, DoorOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface VisitRecord {
  id: number;
  visit_date: string;
  lesson_topic: string;
  stage: string;
  grade: string;
  class_room: string;
  evaluation_data: { 
    clarity?: number; 
    engagement?: number; 
    method?: number; 
    environment?: number; 
    participation?: number;
    time_management?: number;
  };
  recommendations: string;
  users: { name: string } | null; 
}

export default function TeacherVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  const calculatePercentage = (data: VisitRecord['evaluation_data']) => {
    const values = Object.values(data || {}).filter(val => typeof val === 'number') as number[];
    const totalPoints = values.reduce((acc, curr) => acc + curr, 0);
    const maxPoints = values.length * 5; 
    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  };

  const fetchVisits = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('classroom_visits')
        .select(`
          *,
          users:supervisor_id (name)
        `)
        .eq('teacher_id', user.id)
        .order('visit_date', { ascending: false });
        
      if (error) throw error;
      setVisits((data as any) || []);
    } catch (error) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisits(); }, [user]);

  const getCriteriaLabel = (key: string) => {
    return t(`criteria_${key}`) || key;
  };

  return (
    <div className="space-y-8 p-4 md:p-8 text-start" dir={i18n.dir()}>
      <div className="border-b border-emerald-100 pb-6">
        <h1 className="text-4xl font-black text-gray-800 flex items-center gap-3">
          <Eye className="text-emerald-600 w-10 h-10" /> {t('visits_title')}
        </h1>
      </div>

      {loading ? (
        <div className="text-center p-20"><Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-600" /></div>
      ) : visits.length === 0 ? (
        <div className="text-center p-20 bg-gray-50 rounded-3xl font-bold text-gray-400">{t('no_visits')}</div>
      ) : (
        <div className="grid gap-8">
          {visits.map(visit => {
            const percentage = calculatePercentage(visit.evaluation_data);
            return (
              <div key={visit.id} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 w-2 h-full bg-emerald-600 ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'}`}></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{visit.lesson_topic}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-gray-500 font-bold mt-4">
                      <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"><Clock className="w-4 h-4" /> {new Date(visit.visit_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                      
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                        <UserCheck className="w-4 h-4" /> {t('supervisor')}: {visit.users?.name || '—'}
                      </span>
                      
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full"><GraduationCap className="w-4 h-4" /> {t('grade')}: {visit.grade}</span>
                      <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full"><DoorOpen className="w-4 h-4" /> {t('classroom')}: {visit.class_room}</span>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-lg text-center">
                    <span className="block text-xs opacity-80">{t('final_score')}</span>
                    <span className="text-4xl font-black">{percentage}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {Object.entries(visit.evaluation_data || {}).map(([key, val], idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                      <span className="text-gray-500 text-xs font-bold block mb-1">{getCriteriaLabel(key)}</span>
                      <span className="text-xl font-black text-emerald-700">{val as number || 0} <span className="text-xs text-gray-400">/ 5</span></span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <h4 className="flex items-center gap-2 font-black text-emerald-900 text-lg mb-3">
                    <ClipboardList className="w-5 h-5" /> {t('supervisor_notes')}
                  </h4>
                  <p className="text-gray-700 font-medium leading-relaxed italic">
                    {visit.recommendations || t('no_notes')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}