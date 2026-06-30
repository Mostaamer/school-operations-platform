import React, { useState, useEffect } from 'react';
import { User, RefreshCw, Search, ChevronDown, ChevronUp, Users, LayoutGrid, List, Filter, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const STAGES = ['الكل', 'ابتدائي', 'إعدادي', 'ثانوي'];

export default function SupervisorTeacherSchedule() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات الفلترة والعرض الجديدة
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('الكل');
  const [viewMode, setViewMode] = useState<'individual' | 'group'>('individual');
  const [selectedDay, setSelectedDay] = useState(DAYS[0]); // للنظرة المجمعة
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: tData } = await supabase.from('users').select('*').eq('role', 'TEACHER');
      const { data: sData } = await supabase.from('schedule').select('*');
      setTeachers(tData || []);
      setSchedules(sData || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const formatClassText = (classId: string) => {
    if (!classId) return '';
    const parts = classId.split('-'); 
    return `مرحلة ${parts[0] || ''} | صف ${parts[1] || ''} | فصل ${parts[2] || ''}`;
  };

  // معالجة البيانات بناءً على الفلاتر
  // 1. فلترة الجداول حسب المرحلة
  const filteredSchedules = schedules.filter(s => {
    if (stageFilter === 'الكل') return true;
    const stage = s.class_id?.split('-')[0];
    return stage === stageFilter;
  });

  // 2. معرفة المعلمين الذين لديهم حصص في المرحلة المحددة
  const activeTeacherIds = new Set(filteredSchedules.map(s => String(s.teacher_id)));

  // 3. فلترة المعلمين بناءً على المرحلة ومربع البحث
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name?.includes(searchTerm);
    const matchesStage = stageFilter === 'الكل' || activeTeacherIds.has(String(t.id));
    return matchesSearch && matchesStage;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <CalendarDays className="text-indigo-600 w-10 h-10" />
            سجل جداول المعلمين
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">إدارة ومتابعة الجداول بشكل فردي أو مجمع حسب المراحل</p>
        </div>
        <button 
          onClick={fetchAllData} 
          className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
        >
          <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Control Panel Section (Filters & Views) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Stage Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl w-full md:w-auto overflow-x-auto">
            <Filter size={20} className="text-slate-400 mx-2" />
            {STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stage)}
                className={`px-6 py-3 rounded-xl font-black text-sm md:text-base transition-all whitespace-nowrap ${
                  stageFilter === stage 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {stage === 'الكل' ? 'جميع المراحل' : `المرحلة ال${stage}`}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setViewMode('individual')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                viewMode === 'individual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50'
              }`}
            >
              <List size={20} />
              نظرة فردية
            </button>
            <button
              onClick={() => setViewMode('group')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                viewMode === 'group' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid size={20} />
              نظرة مجمعة
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-6 top-6 text-slate-400" size={24} />
          <input 
            placeholder="ابحث عن اسم المعلم..." 
            className="w-full p-6 pr-16 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl outline-none" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* --- Individual View (نظرة فردية) --- */}
      {viewMode === 'individual' && (
        <div className="grid gap-6 animate-in fade-in duration-500">
          {filteredTeachers.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-500 font-bold text-xl">
              لا يوجد معلمون في هذه المرحلة أو مطابقون للبحث.
            </div>
          ) : (
            filteredTeachers.map(teacher => (
              <div key={teacher.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl border border-indigo-100">
                      <User size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">{teacher.name}</h3>
                      <p className="text-slate-400 font-medium">عرض تفاصيل الجداول للفصول المسندة</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setExpandedTeacher(expandedTeacher === teacher.id ? null : teacher.id)}
                    className="w-full md:w-auto flex justify-center items-center gap-2 text-indigo-700 font-black text-lg bg-indigo-50 px-8 py-4 rounded-2xl hover:bg-indigo-100 transition-all"
                  >
                    {expandedTeacher === teacher.id ? 'إخفاء الجدول' : 'عرض الجدول الأسبوعي'}
                    {expandedTeacher === teacher.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>

                {/* Individual Matrix Table */}
                {expandedTeacher === teacher.id && (
                  <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/50">
                    <div className="overflow-x-auto mt-6 rounded-2xl border border-slate-200 bg-white">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="p-4 border-b border-l border-slate-200 font-black text-slate-700 w-32">اليوم</th>
                            {PERIODS.map(p => <th key={p} className="p-4 border-b border-slate-200 font-black text-slate-700">الحصة {p}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.map((day, idx) => (
                            <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-4 border-l border-t border-slate-200 font-black text-slate-800 text-lg shadow-sm">{day}</td>
                              {PERIODS.map(period => {
                                const lesson = filteredSchedules.find(s => 
                                  String(s.teacher_id) === String(teacher.id) && 
                                  s.day_of_week === day && s.period === period
                                );
                                return (
                                  <td key={period} className={`border-t border-slate-200 p-3 min-w-[150px] transition-colors ${lesson ? 'bg-indigo-50/40 hover:bg-indigo-100/60' : ''}`}>
                                    {lesson ? (
                                      <div className="space-y-2">
                                        <div className="font-black text-indigo-900 text-lg">{lesson.subject}</div>
                                        <div className="text-xs font-bold text-indigo-700 bg-white border border-indigo-100 p-2 rounded-xl shadow-sm inline-block">
                                          {formatClassText(lesson.class_id)}
                                        </div>
                                      </div>
                                    ) : <span className="text-slate-200 font-light">—</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* --- Group View (نظرة مجمعة) --- */}
      {viewMode === 'group' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Day Selector for Group View */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-600 ml-4">عرض جدول يوم:</span>
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-8 py-3 rounded-xl font-black transition-all ${
                  selectedDay === day 
                  ? 'bg-indigo-600 text-white shadow-md scale-105' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-5 border-l border-slate-700 font-black whitespace-nowrap sticky right-0 bg-slate-900 z-10 w-48">
                    المعلم
                  </th>
                  {PERIODS.map(p => (
                    <th key={p} className="p-5 border-slate-700 font-black text-indigo-100">
                      الحصة {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-slate-400 font-bold text-lg text-center">لا توجد بيانات للعرض</td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher.id} className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="p-4 border-l border-t border-slate-200 font-black text-slate-800 sticky right-0 z-10 shadow-[1px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap" style={{ backgroundColor: 'inherit' }}>
                        <div className="flex items-center gap-3">
                          <Users size={18} className="text-slate-400" />
                          {teacher.name}
                        </div>
                      </td>
                      {PERIODS.map(period => {
                        const lesson = filteredSchedules.find(s => 
                          String(s.teacher_id) === String(teacher.id) && 
                          s.day_of_week === selectedDay && 
                          s.period === period
                        );
                        return (
                          <td key={period} className={`border-t border-slate-200 p-2 min-w-[140px] ${lesson ? 'bg-indigo-50/50' : ''}`}>
                            {lesson ? (
                              <div className="space-y-1">
                                <div className="font-bold text-indigo-900">{lesson.subject}</div>
                                <div className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 p-1.5 rounded-lg shadow-sm">
                                  {formatClassText(lesson.class_id)}
                                </div>
                              </div>
                            ) : <span className="text-slate-200 font-light">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}