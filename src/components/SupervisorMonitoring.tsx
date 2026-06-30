import React, { useState, useEffect } from 'react';
import { RefreshCw, User, Clock, AlertCircle, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient("https://wwgchgvykykeapbnivmr.supabase.co", "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv");

export default function SupervisorMonitoring() {
  const [data, setData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'URGENT' | 'ALL'>('URGENT');

  const fetchData = async () => {
    const { data: logs } = await supabase.from('student_tracking')
      .select('*, students(fullName, grade, classSection)')
      .order('updated_at', { ascending: false });
    setData(logs || []);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex justify-between items-center pb-4 border-b">
        <h1 className="text-2xl font-bold">لوحة المتابعة الإشرافية</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'URGENT' ? 'ALL' : 'URGENT')} 
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
          >
            <Filter size={18}/> {viewMode === 'URGENT' ? 'العاجل فقط' : 'عرض الكل'}
          </button>
          <button onClick={fetchData} className="p-2 bg-blue-100 text-blue-600 rounded-lg"><RefreshCw size={20}/></button>
        </div>
      </div>

      {data
        .filter(l => viewMode === 'URGENT' ? l.behavior === 'NEEDS_ATTENTION' : true)
        .map((log: any) => (
          <div key={log.id} className={`p-4 rounded-xl border shadow-sm ${log.behavior === 'NEEDS_ATTENTION' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {log.behavior === 'NEEDS_ATTENTION' && <span className="animate-ping h-2 w-2 rounded-full bg-red-500"></span>}
                  {log.students?.fullName}
                </h3>
                <p className="text-sm text-gray-600">{log.students?.grade} - {log.students?.classSection}</p>
              </div>
              <div className="text-left text-xs text-gray-400">
                <p className="flex items-center gap-1"><User size={12}/> {log.updated_by}</p>
                <p className="flex items-center gap-1"><Clock size={12}/> {new Date(log.updated_at).toLocaleTimeString('ar-EG')}</p>
              </div>
            </div>
            <div className={`mt-3 p-3 rounded border text-sm ${log.behavior === 'NEEDS_ATTENTION' ? 'bg-white border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <span className="font-bold">ملاحظة: </span> {log.teacherNotes || 'لا توجد ملاحظة'}
            </div>
          </div>
      ))}
    </div>
  );
}