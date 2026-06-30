import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ClipboardCheck, Star, Trash2, RefreshCw, FileText, AlertTriangle, Layers, BookOpen, User, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/behaviorService';
import { schoolStructure } from '../lib/schoolConfig';

export default function SupervisorVisits() {
  const { t, i18n } = useTranslation();
  
  // تحديد اتجاه الصفحة بناءً على اللغة الحالية
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [isSaving, setIsSaving] = useState(false);
  const [visits, setVisits] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    teacher_id: '',
    supervisor_id: '',
    stage: '',
    grade: '',
    class_room: '',
    lesson_topic: '',
    recommendations: '',
    priority: 'MEDIUM', // تم إصلاح مشكلة اللغة هنا (استخدام Enums بدل نصوص عربية ثابتة)
    evaluation: { clarity: 3, participation: 3, time_management: 3, engagement: 3, environment: 3 }
  });

  const criteria = [
    { id: 'clarity', label: t('clarity') },
    { id: 'participation', label: t('participation') },
    { id: 'time_management', label: t('time_management') },
    { id: 'engagement', label: t('engagement') },
    { id: 'environment', label: t('environment') }
  ];

  const calculateScore = (evalData: any) => {
    if (!evalData || typeof evalData !== 'object') return "0";
    const values = Object.values(evalData);
    const totalStars = values.reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const score = (totalStars / 25) * 100;
    return Math.round(score).toString();
  };

  const fetchUsers = async () => {
    const { data: tData } = await supabase.from('users').select('id, name').eq('role', 'TEACHER');
    const { data: sData } = await supabase.from('users').select('id, name').eq('role', 'SUPERVISOR');
    if (tData) setTeachers(tData);
    if (sData) setSupervisors(sData);
  };

  const fetchRecentVisits = async () => {
    const { data, error } = await supabase
      .from('classroom_visits')
      .select('*, users!classroom_visits_teacher_id_fkey(name), supervisors:users!classroom_visits_supervisor_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) console.error('Error:', error);
    else setVisits(data || []);
  };

  const handlePrint = (visit: any) => {
    const score = calculateScore(visit.evaluation_data);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html dir="${direction}">
        <head>
          <title>${t('print_title')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0;
              padding: 0; 
              color: #2c3e50;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-container { 
              border: 2px solid #1e293b; 
              padding: 25px; 
              max-width: 100%;
              margin: 0 auto; 
              border-radius: 12px;
              box-sizing: border-box;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .header-table td {
              border: none !important;
              padding: 0 !important;
            }
            h1 { 
              font-size: 24px;
              margin: 0 0 5px 0;
              color: #1e3a8a; 
              font-weight: 800;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              font-weight: 500;
            }
            .score-box { 
              border: 2px dashed #1e3a8a; 
              padding: 10px 20px; 
              text-align: center; 
              font-size: 22px; 
              background: #f0f4f8; 
              border-radius: 8px;
              font-weight: bold;
              color: #1e3a8a;
              display: inline-block;
            }
            table.main-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
            }
            table.main-table th, table.main-table td { 
              border: 1px solid #cbd5e1; 
              padding: 12px 14px; 
              text-align: ${direction === 'rtl' ? 'right' : 'left'}; 
              font-size: 14px;
            }
            table.main-table th { 
              background-color: #f8fafc; 
              color: #334155;
              width: 25%; 
              font-weight: 700;
            }
            table.main-table td {
              color: #0f172a;
            }
            .recommendations-box {
              margin-top: 15px;
              padding: 15px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              background-color: #fafafa;
              min-height: 80px;
              font-size: 14px;
              line-height: 1.6;
            }
            .recommendations-title {
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 6px;
            }
            .footer-signatures { 
              margin-top: 40px; 
              display: flex; 
              justify-content: space-between; 
              padding: 0 10px;
            }
            .signature-item {
              font-size: 14px;
              font-weight: 600;
              color: #334155;
              text-align: center;
              width: 200px;
              border-top: 1px dashed #94a3b8;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <table class="header-table">
              <tr>
                <td>
                  <h1>${t('print_title')}</h1>
                  <p class="subtitle">${t('print_subtitle')}</p>
                </td>
                <td style="text-align: ${direction === 'rtl' ? 'left' : 'right'};">
                  <div class="score-box">${t('final_score')}: ${score}%</div>
                </td>
              </tr>
            </table>

            <table class="main-table">
              <tr>
                <th>${t('visit_date')}</th>
                <td>${new Date(visit.visit_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
              </tr>
              <tr>
                <th>${t('educational_supervisor')}</th>
                <td>${visit.supervisors?.name || '---'}</td>
              </tr>
              <tr>
                <th>${t('resident_teacher')}</th>
                <td>${visit.users?.name || '---'}</td>
              </tr>
              <tr>
                <th>${t('stage_and_grade')}</th>
                <td>${t(visit.stage)} - ${t('grade_prefix')} ${visit.grade} (${t('class')}: ${visit.class_room})</td>
              </tr>
              <tr>
                <th>${t('lesson_topic')}</th>
                <td>${visit.lesson_topic}</td>
              </tr>
              <tr>
                <th>${t('priority_level')}</th>
                <td><span style="font-weight: bold; color: ${visit.priority === 'HIGH' ? '#dc2626' : '#1e3a8a'}">${visit.priority === 'HIGH' ? t('high') : visit.priority === 'MEDIUM' ? t('medium') : t('low')}</span></td>
              </tr>
            </table>

            <div class="recommendations-box">
              <div class="recommendations-title">${t('technical_recommendations')}</div>
              <div>${visit.recommendations || t('no_recommendations')}</div>
            </div>

            <div class="footer-signatures">
              <div class="signature-item">${t('supervisor_signature')}</div>
              <div class="signature-item">${t('teacher_signature')}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      const { error } = await supabase.from('classroom_visits').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success(t('delete_success'));
      fetchRecentVisits();
    } catch (e: any) { 
      toast.error(t('save_error') + e.message); 
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  useEffect(() => { fetchUsers(); fetchRecentVisits(); }, []);

  const handleSave = async () => {
    if (!formData.teacher_id || !formData.supervisor_id || !formData.stage || !formData.grade || !formData.class_room || !formData.lesson_topic) {
      toast.error(t('fill_required'));
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('classroom_visits').insert([{
      teacher_id: parseInt(formData.teacher_id), supervisor_id: parseInt(formData.supervisor_id),
      stage: formData.stage, grade: formData.grade, class_room: formData.class_room,
      lesson_topic: formData.lesson_topic, evaluation_data: formData.evaluation,
      recommendations: formData.recommendations, priority: formData.priority, visit_date: new Date().toISOString()
    }]);
    if (error) toast.error(t('save_error') + error.message);
    else { 
      toast.success(t('save_success')); 
      fetchRecentVisits();
      setFormData({...formData, lesson_topic: '', recommendations: ''});
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8" dir={direction}>
      
      {/* Modal - نافذة تأكيد الحذف بتصميم زجاجي */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full mx-4 text-center space-y-4 border border-white/50 dark:border-gray-700/50">
            <div className="w-20 h-20 bg-red-50/80 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner backdrop-blur-sm border border-red-100 dark:border-red-800/50">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100">{t('delete_confirm_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t('delete_confirm_desc')}</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="flex-1 py-3.5 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200/50 transition-all border border-gray-200/50 dark:border-gray-700/50">{t('cancel')}</button>
              <button onClick={executeDelete} className="flex-1 py-3.5 bg-red-500/90 backdrop-blur-sm text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">{t('yes_delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* الهيدر الرئيسي للمكون */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] gap-4 transition-all">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/30 backdrop-blur-md text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner border border-white/60 dark:border-indigo-800/30">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('visits_title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* كارد النموذج الرئيسي */}
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] space-y-8">
        
        {/* قسم محددات الصف والمرحلة والمعلمين */}
        <div className="bg-white/30 dark:bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/60 dark:border-gray-700/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 shadow-inner">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Layers size={14}/> {t('stage')}</label>
            <select className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-sm" value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value, grade: ''})}>
              <option value="">{t('choose_stage')}</option>
              {Object.keys(schoolStructure).map(s => (
                <option key={s} value={s}>{t(s)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><BookOpen size={14}/> {t('grade')}</label>
            <select className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-sm disabled:opacity-50" value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} disabled={!formData.stage}>
              <option value="">{t('choose_grade')}</option>
              {formData.stage && schoolStructure[formData.stage as keyof typeof schoolStructure]?.years.map(g => (
                <option key={g} value={g}>{t('grade_prefix')} {g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Users size={14}/> {t('class')}</label>
            <select className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-sm" value={formData.class_room} onChange={(e) => setFormData({...formData, class_room: e.target.value})}>
              <option value="">{t('choose_class')}</option>
              {['A', 'B', 'C', 'D', 'E'].map(s => (
                <option key={s} value={s}>{t('class_prefix')} {s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><User size={14}/> {t('teacher')}</label>
            <select className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-sm" value={formData.teacher_id} onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}>
              <option value="">{t('choose_teacher')}</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Shield size={14}/> {t('supervisor')}</label>
            <select className="p-3.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-sm" value={formData.supervisor_id} onChange={(e) => setFormData({...formData, supervisor_id: e.target.value})}>
              <option value="">{t('choose_supervisor')}</option>
              {supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* حقل عنوان وموضوع الدرس */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('lesson_topic')}</label>
          <input className="w-full p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/60 dark:border-gray-700/50 rounded-2xl font-bold text-gray-800 dark:text-white focus:bg-white/90 dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400 shadow-inner" placeholder={t('lesson_placeholder')} value={formData.lesson_topic} onChange={(e) => setFormData({...formData, lesson_topic: e.target.value})} />
        </div>

        {/* قسم بنود التقييم الفني الخمسة (بستايل الأزرار الزجاجية المستديرة) */}
        <div className="space-y-5 pt-6 border-t border-white/30 dark:border-gray-700/30">
          <h3 className="font-black text-gray-800 dark:text-white text-lg flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl backdrop-blur-sm">
              <Star className="text-amber-500 fill-amber-500 w-5 h-5" />
            </div>
            {t('evaluation_title')}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {criteria.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-gray-800/40 backdrop-blur-md border border-white/50 dark:border-gray-700/50 rounded-[1.5rem] transition-all duration-300 gap-4 shadow-sm">
                <span className="font-bold text-gray-700 dark:text-gray-200 text-sm sm:text-base ms-2">{c.label}</span>
                <div className={`flex gap-1.5 bg-white/40 dark:bg-black/30 backdrop-blur-lg p-1.5 rounded-full border border-white/60 dark:border-gray-700/50 shadow-inner ${direction === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {[5, 4, 3, 2, 1].map((rate) => (
                    <button 
                      key={rate} 
                      type="button" 
                      onClick={() => setFormData({...formData, evaluation: {...formData.evaluation, [c.id]: rate}})} 
                      className={`w-11 h-11 rounded-full font-black text-sm transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                        formData.evaluation[c.id as keyof typeof formData.evaluation] === rate 
                          ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md scale-100' 
                          : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="relative z-10">{rate}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* قسم الملاحظات الفنية والأولويات */}
        <div className="space-y-6 pt-6 border-t border-white/30 dark:border-gray-700/30">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('recommendations')}</label>
            <textarea className="w-full p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/60 dark:border-gray-700/50 rounded-2xl h-32 font-medium text-gray-800 dark:text-white focus:bg-white/90 dark:focus:bg-gray-800 focus:border-indigo-400 outline-none resize-none transition-all placeholder:text-gray-400 shadow-inner" placeholder={t('recommendations_placeholder')} value={formData.recommendations} onChange={(e) => setFormData({...formData, recommendations: e.target.value})} />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('priority')}</label>
            <select className="w-full p-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/60 dark:border-gray-700/50 rounded-2xl font-black text-gray-800 dark:text-white focus:bg-white/90 dark:focus:bg-gray-800 focus:border-indigo-400 outline-none transition-all shadow-inner" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
              <option value="HIGH">{t('high')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="LOW">{t('low')}</option>
            </select>
          </div>
        </div>

        {/* زر الإرسال والحفظ الحركي */}
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600/90 hover:bg-indigo-600 dark:bg-indigo-500/90 dark:hover:bg-indigo-500 backdrop-blur-md text-white py-4 rounded-[1.5rem] font-black text-lg shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 border border-white/20">
          <Save size={22} />
          {isSaving ? t('saving_status') : t('save_button')}
        </button>
      </div>

      {/* قسم عرض أحدث 5 تقارير معتمدة */}
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] space-y-6 transition-all">
        <div className="flex justify-between items-center pb-5 border-b border-white/30 dark:border-gray-700/30">
          <h3 className="font-black text-xl text-gray-800 dark:text-white">{t('recent_visits_title')}</h3>
          <button onClick={fetchRecentVisits} className="text-indigo-600 dark:text-indigo-400 p-2.5 bg-white/40 dark:bg-black/20 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm border border-white/50 dark:border-gray-700/50"><RefreshCw size={20}/></button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {visits.length === 0 ? (
            <div className="text-center py-10 bg-white/30 dark:bg-black/10 rounded-[2rem] border border-white/40 dark:border-gray-800/50 backdrop-blur-sm">
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">{t('no_recent_visits')}</p>
            </div>
          ) : (
            visits.map((visit) => {
              return (
                <div key={visit.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-gray-700/50 rounded-3xl transition-all duration-300 gap-4 shadow-sm group">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-800 dark:text-gray-100 text-base">{visit.users?.name || t('unknown_teacher')}</span>
                      <span className="text-xs font-black px-2.5 py-1 bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-700/50 rounded-lg backdrop-blur-sm">
                        {t('performance_ratio')}: {calculateScore(visit.evaluation_data)}%
                      </span>
                    </div>
                    <p className="font-medium text-sm text-gray-600 dark:text-gray-400"><span className="text-gray-400 dark:text-gray-500">{t('lesson_label')}</span> {visit.lesson_topic}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-bold">{t(visit.stage)} - {t('grade_prefix')} {visit.grade} ({t('class')}: {visit.class_room})</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-white/30 dark:border-gray-700/30 sm:border-0 pt-4 sm:pt-0">
                    <button onClick={() => handlePrint(visit)} className="text-blue-600 dark:text-blue-400 p-3 bg-white/40 dark:bg-black/30 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all border border-white/50 dark:border-gray-700/50 shadow-sm"><FileText size={20} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: visit.id })} className="text-red-500 dark:text-red-400 p-3 bg-white/40 dark:bg-black/30 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all border border-white/50 dark:border-gray-700/50 shadow-sm"><Trash2 size={20} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}