import React, { useState, useEffect } from 'react';
import { supabase, useAuth } from '../lib/auth-context'; 
import { Gamepad2, Filter, Loader2, Trophy, Star, Plus, Minus, Trash2, ChevronDown, AlertTriangle, Crown, Medal } from 'lucide-react';
import toast from 'react-hot-toast';

// ==========================================
// دالة تحديد الأفاتار (ولد أو بنت) بناءً على الاسم
// ==========================================
const getStudentAvatar = (name: string) => {
  if (!name) return '👦';
  const firstName = name.trim().split(' ')[0];
  
  // استثناءات لأسماء ذكور تنتهي بحروف مشابهة لأسماء الإناث
  const maleExceptions = ['مصطفى', 'يحيى', 'عيسى', 'موسى', 'زكريا', 'رضا', 'علا', 'بهاء', 'علاء', 'ضياء', 'طه', 'حمزة', 'أسامة', 'طلحة', 'عبيدة'];
  
  // قائمة بأسماء إناث شائعة لا تنتهي بعلامات التأنيث المعتادة
  const femaleNames = ['مريم', 'زينب', 'سعاد', 'عبير', 'نور', 'ياسمين', 'حبيبة', 'سلمى', 'ريناد', 'دارين', 'ناديا', 'بسملة', 'كنزي', 'فاطمة', 'ملك', 'فرح', 'شهد', 'جنى', 'رؤى', 'ريم', 'روان'];
  
  let isGirl = false;
  
  if (firstName.endsWith('ة')) {
    isGirl = true;
  } else if (femaleNames.includes(firstName)) {
    isGirl = true;
  } else if ((firstName.endsWith('اء') || firstName.endsWith('ى') || firstName.endsWith('ا')) && !maleExceptions.includes(firstName)) {
    isGirl = true;
  }

  // في حال أردت تغيير الـ Emojis لصور مسارها الحقيقي مستقبلاً، يمكنك تبديلها هنا
  return isGirl ? '👧' : '👦';
};

// ==========================================
// مكون الاحتفال
// ==========================================
const CustomConfetti = () => {
  const [pieces, setPieces] = useState<any[]>([]);
  useEffect(() => {
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#3b82f6', '#10b981'];
    setPieces(Array.from({ length: 150 }).map((_, i) => ({
      id: i, left: Math.random() * 100 + 'vw',
      animationDuration: Math.random() * 3 + 2 + 's', animationDelay: Math.random() * 1 + 's',
      backgroundColor: colors[Math.floor(Math.random() * colors.length)], rotate: Math.random() * 360 + 'deg',
    })));
  }, []);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute top-[-10%] w-3 h-6 rounded-sm opacity-90 shadow-sm"
          style={{ left: p.left, backgroundColor: p.backgroundColor, animation: `confetti-fall ${p.animationDuration} ease-in ${p.animationDelay} forwards`, transform: `rotate(${p.rotate})` }} />
      ))}
      <style dangerouslySetInnerHTML={{__html: `@keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}} />
    </div>
  );
};

// ==========================================
// الثوابت والأنواع
// ==========================================
export const schoolStructure = {
  'Primary': { code: 'PRI', years: ['1', '2', '3', '4', '5', '6'], label: 'الابتدائية' },
  'Preparatory': { code: 'PRE', years: ['1', '2', '3'], label: 'الإعدادية' },
  'Secondary': { code: 'SEC', years: ['1', '2', '3'], label: 'الثانوية' }
};

export const generateClassId = (st: string, gr: string, se: string) => schoolStructure[st as keyof typeof schoolStructure] ? `${schoolStructure[st as keyof typeof schoolStructure].code}-${gr}-${se}` : '';

interface Student { id: number; name: string; class_id: string; total_points: number; }

// ==========================================
// المكون الرئيسي
// ==========================================
const TeacherClassroomActivity: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ stage: 'Secondary', grade: '1', section: 'A' });
  const [students, setStudents] = useState<Student[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebration, setCelebration] = useState({ show: false, studentName: '' });

  const triggerCelebration = (name: string) => {
    setCelebration({ show: true, studentName: name });
    setTimeout(() => setCelebration({ show: false, studentName: '' }), 4000);
  };

  const fetchStudents = async () => {
    const { stage, grade, section } = filters;
    if (!stage || !grade || !section) return;
    try {
      const { data, error } = await supabase.from('students')
        .select('id, name, class_id, total_points')
        .eq('class_id', generateClassId(stage, grade, section))
        .order('total_points', { ascending: false });
      if (error) throw error;
      setStudents((data as Student[]) || []);
    } catch (error) { toast.error('حدث خطأ أثناء جلب بيانات الطلاب'); }
  };

  useEffect(() => {
    fetchStudents();
    const channel = supabase.channel('realtime_students_points').on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'students', filter: `class_id=eq.${generateClassId(filters.stage, filters.grade, filters.section)}` },
      (payload) => {
        const updated = payload.new as Student;
        setStudents(prev => {
          const old = prev.find(s => s.id === updated.id);
          if (old && updated.total_points > old.total_points) triggerCelebration(updated.name);
          return prev.map(s => s.id === updated.id ? { ...s, total_points: updated.total_points } : s).sort((a, b) => b.total_points - a.total_points);
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filters]);

  const handlePointChange = async (studentId: number, change: number) => {
    if (!user?.id) return toast.error('يجب تسجيل الدخول');
    const student = students.find(s => s.id === studentId);
    const currentPoints = student?.total_points || 0;
    const newTotal = Math.max(0, currentPoints + change);
    if (newTotal === currentPoints && change < 0) return toast.error('رصيد الطالب صفر بالفعل!');

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, total_points: newTotal } : s).sort((a, b) => b.total_points - a.total_points));
    if (change > 0 && student) triggerCelebration(student.name);

    try {
      await supabase.from('point_transactions').insert([{ student_id: studentId, teacher_id: Number(user.id), points_added: newTotal - currentPoints, reason: reasons[studentId]?.trim() || (change > 0 ? 'مشاركة تفاعلية' : 'خصم نقاط') }]);
      await supabase.from('students').update({ total_points: newTotal }).eq('id', studentId);
      toast.success(change > 0 ? 'تمت إضافة النقطة' : 'تم خصم النقطة');
      setReasons(prev => ({ ...prev, [studentId]: '' }));
    } catch (error) { toast.error('حدث خطأ أثناء التحديث'); fetchStudents(); }
  };

  const handleResetPoints = async (periodLabel: string) => {
    if (!students.length) return toast.error('الفصل فارغ بالفعل.');
    if (!window.confirm(`هل أنت متأكد من تصفير نقاط الطلاب لـ (${periodLabel})؟`)) return;
    setIsProcessing(true); setShowResetMenu(false);
    try {
      await supabase.from('students').update({ total_points: 0 }).eq('class_id', generateClassId(filters.stage, filters.grade, filters.section));
      toast.success(`تم تصفير النقاط لـ ${periodLabel} بنجاح.`);
      fetchStudents();
    } catch (error) { toast.error('حدث خطأ أثناء تصفير النقاط.'); } 
    finally { setIsProcessing(false); }
  };

  const renderPodium = () => {
    const top5 = [3, 1, 0, 2, 4].map(idx => ({ rank: idx + 1, student: students[idx] })).filter(item => item.student && item.student.total_points > 0);
    if (!top5.length) return null;

    const styles = [
      { height: 'h-48 md:h-64', bg: 'from-yellow-500 to-amber-600', border: 'border-yellow-400', text: 'text-yellow-900', icon: <Crown className="w-10 h-10 md:w-14 md:h-14 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)] animate-bounce" /> },
      { height: 'h-36 md:h-48', bg: 'from-slate-300 to-slate-500', border: 'border-slate-300', text: 'text-slate-800', icon: <Medal className="w-7 h-7 md:w-9 md:h-9 text-slate-200 drop-shadow-md" /> },
      { height: 'h-28 md:h-40', bg: 'from-amber-600 to-orange-800', border: 'border-amber-500', text: 'text-amber-950', icon: <Medal className="w-7 h-7 md:w-9 md:h-9 text-amber-300 drop-shadow-md" /> },
      { height: 'h-20 md:h-28', bg: 'from-emerald-400 to-emerald-600', border: 'border-emerald-400', text: 'text-emerald-900', icon: <Star className="w-6 h-6 md:w-7 md:h-7 text-emerald-200 drop-shadow-md" /> },
      { height: 'h-16 md:h-20', bg: 'from-blue-400 to-blue-600', border: 'border-blue-400', text: 'text-blue-900', icon: <Star className="w-6 h-6 md:w-7 md:h-7 text-blue-200 drop-shadow-md" /> }
    ];

    return (
      <div className="w-full flex justify-center items-end mt-10 mb-8 gap-2 md:gap-4 px-2">
        {top5.map(({ rank, student }) => {
          const style = styles[rank - 1];
          return (
            <div key={student.id} className="flex flex-col items-center justify-end w-[18%] max-w-[140px] relative animate-in slide-in-from-bottom-10 duration-700">
              
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center justify-end w-full pb-3 md:pb-5 z-20">
                <div className="flex flex-col items-center gap-2 w-full">
                  {style.icon}
                  
                  {/* حاوية صورة الطالب والنقاط */}
                  <div className="relative">
                    {/* الدائرة الزجاجية للأفاتار */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-t ${style.bg} border-[3px] md:border-4 ${style.border} flex items-center justify-center text-3xl md:text-4xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] z-10 overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/20"></div>
                      <span className="relative z-10 drop-shadow-md">{getStudentAvatar(student.name)}</span>
                    </div>
                    {/* شارة النقاط المتداخلة */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-black px-2.5 py-0.5 rounded-full text-[10px] md:text-xs border-2 border-gray-200 dark:border-slate-600 shadow-md z-30 min-w-[36px] text-center">
                      {student.total_points}
                    </div>
                  </div>
                  
                  {/* شارة الاسم (تدعم الالتفاف للأسماء الطويلة) */}
                  <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-1.5 md:px-2 py-1.5 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 w-[190%] sm:w-[170%] max-w-[150px] z-20 transition-transform hover:scale-105 min-h-[36px] flex items-center justify-center mt-1">
                    <p className="font-bold text-gray-800 dark:text-white text-center text-[10px] md:text-xs leading-tight whitespace-normal break-words">
                      {student.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* تصميم المنصة 3D */}
              <div className={`w-full rounded-t-xl md:rounded-t-2xl bg-gradient-to-t ${style.bg} shadow-[inset_0_2px_15px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.4)] flex items-start justify-center pt-3 md:pt-5 border-t border-x ${style.border} ${style.height} relative hover:brightness-110 transition-all duration-300`}>
                <span className={`font-black text-4xl md:text-6xl ${style.text} opacity-40 drop-shadow-lg`}>{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdvancedBoard = (stage: 'PRE' | 'SEC') => {
    const theme = stage === 'SEC' 
      ? { bg: 'from-slate-900 via-slate-800 to-slate-900', accent: 'emerald', danger: 'rose', icon: <Gamepad2 className="w-8 h-8 text-emerald-400" />, title: 'لوحة الطلاب الأوائل في النشاط (المرحلة الثانوية)' } 
      : { bg: 'from-indigo-950 via-purple-900/80 to-indigo-950', accent: 'violet', danger: 'pink', icon: <Trophy className="w-8 h-8 text-violet-400" />, title: 'لوحة الطلاب الأوائل في النشاط (المرحلة الإعدادية)' };
    
    return (
      <div className={`p-4 md:p-8 bg-gradient-to-br ${theme.bg} w-full rounded-3xl text-white shadow-2xl relative overflow-hidden border border-white/10`}>
        <div className={`absolute top-0 right-0 w-96 h-96 bg-${theme.accent}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3`} />
        <div className="max-w-[1400px] mx-auto relative z-10 pt-4">
          
          <h2 className="text-2xl md:text-3xl font-bold mb-36 md:mb-44 flex justify-center items-center gap-4 text-white/90">
            {theme.icon}{theme.title}
          </h2>
          
          {renderPodium()}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-12 border-t border-white/10 pt-10">
            {students.map(student => (
              <div key={student.id} className="relative p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 hover:-translate-y-1 transition-all flex flex-col justify-between">
                
                <div className="flex flex-col items-center mb-4 gap-2 w-full">
                  {/* صورة الطالب للبطاقات العادية */}
                  <div className="text-4xl drop-shadow-md mb-1">{getStudentAvatar(student.name)}</div>
                  <h3 className="text-sm font-bold text-center text-white/95 leading-tight whitespace-normal break-words w-full">{student.name}</h3>
                  <div className={`bg-${theme.accent}-500/20 border border-${theme.accent}-500/50 rounded-lg px-3 py-1 w-full text-center mt-1`}>
                    <span className="text-xl font-black">{student.total_points || 0} <span className="text-xs font-normal opacity-50">نقطة</span></span>
                  </div>
                </div>

                <div className="space-y-2 mt-auto">
                  <input type="text" placeholder="سبب التقييم..." value={reasons[student.id] || ''} onChange={(e) => setReasons(p => ({ ...p, [student.id]: e.target.value }))} className={`w-full text-[10px] p-2 rounded-md bg-black/30 border border-white/10 text-white text-center focus:border-${theme.accent}-400/50 outline-none transition-colors`}/>
                  <div className="flex gap-1">
                    <button onClick={() => handlePointChange(student.id, -1)} className={`py-1.5 px-2 rounded-md bg-${theme.danger}-500/20 text-${theme.danger}-100 hover:bg-${theme.danger}-500 transition-colors`}><Minus className="w-4 h-4" /></button>
                    <button onClick={() => handlePointChange(student.id, 1)} className={`flex-1 py-1.5 rounded-md bg-${theme.accent}-500/30 hover:bg-${theme.accent}-500 font-bold text-xs flex justify-center items-center gap-1 transition-colors`}><Plus className="w-4 h-4" /> تقييم إيجابي</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {celebration.show && (
        <>
          <CustomConfetti />
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-indigo-500 animate-in zoom-in-50 text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-300 to-orange-500 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">🎉</div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">تهانينا يا بطل!</h1>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{celebration.studentName}</h2>
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-20">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3"><Gamepad2 className="text-indigo-600 w-8 h-8" /> النشاط التفاعلي</h1>
        </div>
        <div className="relative">
          <button onClick={() => setShowResetMenu(!showResetMenu)} disabled={isProcessing} className="flex items-center gap-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 px-5 py-3 rounded-xl font-bold transition-colors">
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} تصفير العدادات <ChevronDown className="w-4 h-4" />
          </button>
          {showResetMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-100 overflow-hidden z-50">
              <div className="p-3 text-xs font-bold text-red-400 border-b flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> مسح النقاط</div>
              {['نهاية الأسبوع', 'نهاية الشهر', 'نهاية العام'].map(lbl => (
                <button key={lbl} onClick={() => handleResetPoints(lbl)} className="w-full text-right p-3 hover:bg-red-50 text-sm font-semibold text-red-600 transition-colors">تصفير {lbl.replace('نهاية ال', '')}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-indigo-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-indigo-800 font-black ml-4"><Filter className="w-5 h-5" /> تحديد الفصل:</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <select value={filters.stage} onChange={e => setFilters({ stage: e.target.value, grade: schoolStructure[e.target.value as keyof typeof schoolStructure].years[0], section: 'A' })} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 font-bold outline-none cursor-pointer transition-colors focus:border-indigo-400">
            {Object.entries(schoolStructure).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.grade} onChange={e => setFilters(p => ({ ...p, grade: e.target.value }))} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 font-bold outline-none cursor-pointer transition-colors focus:border-indigo-400">
            {schoolStructure[filters.stage as keyof typeof schoolStructure]?.years.map(g => <option key={g} value={g}>الصف {g}</option>)}
          </select>
          <select value={filters.section} onChange={e => setFilters(p => ({ ...p, section: e.target.value }))} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 font-bold outline-none cursor-pointer transition-colors focus:border-indigo-400">
             {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>شعبة {s}</option>)}
          </select>
        </div>
      </div>

      {filters.stage === 'Primary' ? (
        // تم تغيير الخلفية هنا لتصبح بتدرجات متناسقة مع التطبيق (سماوي وبنفسجي ونيلي)
        <div className="p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 rounded-3xl shadow-inner border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
          <h2 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 text-center flex justify-center gap-3 mt-8 mb-36 md:mb-44">
            <Star className="w-8 h-8 text-indigo-500 animate-pulse fill-indigo-500" /> لوحة الطلاب الأوائل في النشاط (المرحلة الابتدائية)
          </h2>
          {renderPodium()}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto mt-12 border-t-2 border-dashed border-indigo-200 dark:border-slate-700 pt-10">
            {students.map(student => (
              <div key={student.id} className="flex flex-col items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-[2rem] shadow-lg hover:-translate-y-1 transition-transform border border-white dark:border-slate-600">
                <div className="text-center w-full mb-3 flex flex-col items-center">
                  <div className="text-4xl mb-2 drop-shadow-sm">{getStudentAvatar(student.name)}</div>
                  <h3 className="text-sm font-black text-gray-800 dark:text-white leading-tight whitespace-normal break-words">{student.name}</h3>
                  <div className="mt-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-sm shadow-sm">{student.total_points || 0} نقطة</div>
                </div>
                <div className="w-full flex flex-col gap-2 mt-auto">
                  <input type="text" placeholder="سبب التقييم..." value={reasons[student.id] || ''} onChange={e => setReasons(p => ({ ...p, [student.id]: e.target.value }))} className="w-full text-[10px] p-2 rounded-xl border-2 border-transparent bg-white dark:bg-slate-900 dark:text-white shadow-sm text-center outline-none focus:border-indigo-200 transition-colors"/>
                  <div className="flex gap-1">
                    <button onClick={() => handlePointChange(student.id, -1)} className="flex-1 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 py-1.5 rounded-xl hover:bg-rose-100 transition-colors"><Minus className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => handlePointChange(student.id, 1)} className="flex-[2] bg-indigo-50 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 py-1.5 rounded-xl font-bold text-xs flex justify-center items-center gap-1 hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /> إضافة</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : renderAdvancedBoard(schoolStructure[filters.stage as keyof typeof schoolStructure].code as 'PRE' | 'SEC')}
    </div>
  );
};

export default TeacherClassroomActivity;