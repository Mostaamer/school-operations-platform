import React, { useState, useEffect, useRef } from 'react';
import { supabase, useAuth } from '../lib/auth-context'; 
import { 
  Gamepad2, Filter, Loader2, Trophy, Star, Plus, Minus, Trash2, ChevronDown, 
  AlertTriangle, Crown, Medal, Users, RefreshCw, RotateCcw, Eraser, Dices, 
  Aperture, ListOrdered, Focus, X, Timer, Play, Pause, RotateCcw as ResetIcon, 
  Flag, Award, Maximize2, Minimize2, Code, Copy, GripHorizontal, 
  Gift, Zap, Shield, ArrowRightLeft, Clock, Music, Armchair, Flame, CheckCircle2,
  Save, BookmarkPlus, Shuffle, HelpCircle, Bot, Check, XCircle, Eye, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const playSound = (type: 'win' | 'tick' | 'magic' | 'error') => {
  try {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {});
  } catch (error) {
    console.log('Audio file not found yet');
  }
};

const getStudentAvatar = (name: string) => {
  if (!name) return '👦';
  const firstName = name.trim().split(' ')[0];
  const maleExceptions = ['مصطفى', 'يحيى', 'عيسى', 'موسى', 'زكريا', 'رضا', 'علا', 'بهاء', 'علاء', 'ضياء', 'طه', 'حمزة', 'أسامة', 'طلحة', 'عبيدة'];
  const femaleNames = ['مريم', 'زينب', 'سعاد', 'عبير', 'نور', 'ياسمين', 'حبيبة', 'سلمى', 'ريناد', 'دارين', 'ناديا', 'بسملة', 'كنزي', 'فاطمة', 'ملك', 'فرح', 'شهد', 'جنى', 'رؤى', 'ريم', 'روان'];
  let isGirl = false;
  if (firstName.endsWith('ة')) {
    isGirl = true;
  } else if (femaleNames.includes(firstName)) {
    isGirl = true;
  } else if ((firstName.endsWith('اء') || firstName.endsWith('ى') || firstName.endsWith('ا')) && !maleExceptions.includes(firstName)) {
    isGirl = true;
  }
  return isGirl ? '👧' : '👦';
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const CustomConfetti = () => {
  const [pieces, setPieces] = useState<any[]>([]);
  useEffect(() => {
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#3b82f6', '#10b981'];
    setPieces(Array.from({ length: 150 }).map((_, i) => ({
      id: i, left: Math.random() * 100 + 'vw',
      animationDuration: Math.random() * 1.5 + 1 + 's', 
      animationDelay: Math.random() * 0.5 + 's',
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

export const schoolStructure = {
  'Primary': { code: 'PRI', years: ['1', '2', '3', '4', '5', '6'], label: 'الابتدائية' },
  'Preparatory': { code: 'PRE', years: ['1', '2', '3'], label: 'الإعدادية' },
  'Secondary': { code: 'SEC', years: ['1', '2', '3'], label: 'الثانوية' }
};

export const generateClassId = (st: string, gr: string, se: string) => schoolStructure[st as keyof typeof schoolStructure] ? `${schoolStructure[st as keyof typeof schoolStructure].code}-${gr}-${se}` : '';

interface Student { id: number; name: string; class_id: string; total_points: number; badge?: string; }
interface Group { id: string; letter: string; students: Student[]; points: number; isSaved?: boolean; }
interface SavedQuestion { id?: string; question_text: string; question_type?: string; options?: string[]; correct_answer?: string; class_id?: string; }

const MYSTERY_PRIZES = [
  { id: 'immunity', title: 'بطاقة الحصانة', desc: 'تلغي أول خصم نقاط يتعرض له الطالب', icon: <Shield className="w-12 h-12" />, color: 'from-blue-400 to-blue-600', textColor: 'text-blue-900' },
  { id: 'pass', title: 'بطاقة التمرير', desc: 'إمكانية تمرير سؤال صعب لمساعد أو زميل', icon: <ArrowRightLeft className="w-12 h-12" />, color: 'from-purple-400 to-purple-600', textColor: 'text-purple-900' },
  { id: 'leader', title: 'قائد الفريق', desc: 'أولوية اختيار أعضاء فريقه في النشاط القادم', icon: <Crown className="w-12 h-12" />, color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-900' },
  { id: 'extra_time', title: 'وقت إضافي', desc: 'إضافة 30 ثانية له أو لفريقه في التحدي السريع', icon: <Clock className="w-12 h-12" />, color: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-900' },
  { id: 'music', title: 'DJ الفصل', desc: 'اختيار موسيقى/أنشودة العمل الجماعي', icon: <Music className="w-12 h-12" />, color: 'from-pink-400 to-pink-600', textColor: 'text-pink-900' },
  { id: 'seat', title: 'تبديل المقعد', desc: 'اختيار مكان الجلوس ليوم كامل', icon: <Armchair className="w-12 h-12" />, color: 'from-orange-400 to-orange-600', textColor: 'text-orange-900' },
  { id: 'points_10', title: '+10 نقاط', desc: 'إضافة 10 نقاط فورية إلى رصيدك', icon: <Star className="w-12 h-12" />, color: 'from-cyan-400 to-cyan-600', textColor: 'text-cyan-900', points: 10 },
];

const TeacherClassroomActivity: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ stage: 'Secondary', grade: '1', section: 'A' });
  const [students, setStudents] = useState<Student[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebration, setCelebration] = useState({ show: false, studentName: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // المؤقت العائم
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerMinutesInput, setTimerMinutesInput] = useState<number | ''>(1);
  const [timerSecondsInput, setTimerSecondsInput] = useState<number | ''>(0);
  const [timerSeconds, setTimerSeconds] = useState(60); 
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPosition, setTimerPosition] = useState({ x: 100, y: 100 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // تحدي النقاط المضاعفة والأسئلة
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [speedActiveTab, setSpeedActiveTab] = useState<'bank' | 'manual' | 'manage'>('bank');
  
  // مسودة السؤال والإدخال
  const [draftQuestionText, setDraftQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'mcq' | 'true_false' | 'complete'>('text');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [manualCorrectAnswer, setManualCorrectAnswer] = useState('');
  
  // السؤال النشط المعروض للطلاب
  const [activeQuestion, setActiveQuestion] = useState<SavedQuestion | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  
  // حالات تفاعل الطلاب مع السؤال
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showDirectAnswer, setShowDirectAnswer] = useState(false);
  
  const [speedSeconds, setSpeedSeconds] = useState(30);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(30);
  const [isSpeedRunning, setIsSpeedRunning] = useState(false);
  const [pointsMultiplier, setPointsMultiplier] = useState(2);
  const [isDoublePoints, setIsDoublePoints] = useState(false);

  // المجموعات التفاعلية
  const [showGrouping, setShowGrouping] = useState(false);
  const [groupCount, setGroupCount] = useState(2);
  const [groupType, setGroupType] = useState<'mixed' | 'boys' | 'girls'>('mixed');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [hasUnsavedGroups, setHasUnsavedGroups] = useState(false);

  // العشوائي
  const [showRandomMenu, setShowRandomMenu] = useState(false);
  const [activeRandomizer, setActiveRandomizer] = useState<'wheel' | 'slot' | 'spotlight' | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [randomWinner, setRandomWinner] = useState<Student | null>(null);

  // صندوق المفاجآت
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [isBoxOpening, setIsBoxOpening] = useState(false);
  const [drawnPrize, setDrawnPrize] = useState<typeof MYSTERY_PRIZES[0] | null>(null);
  const [mysteryStudentId, setMysteryStudentId] = useState<number | ''>('');

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeMode, setCodeMode] = useState<'editor' | 'preview'>('editor');
  const [runnerKey, setRunnerKey] = useState(0);
  const [customCode, setCustomCode] = useState(`function App() {\n  const [score, setScore] = React.useState(0);\n  return (\n    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">\n      <h1 className="text-4xl font-black mb-8">🎮 اللعبة التفاعلية</h1>\n      <button onClick={() => setScore(s => s + 10)} className="px-8 py-3 bg-emerald-500 rounded-xl font-bold">النقاط: {score}</button>\n    </div>\n  );\n}`);

  const triggerCelebration = (name: string) => {
    playSound('win');
    setCelebration({ show: true, studentName: name });
    setTimeout(() => setCelebration({ show: false, studentName: '' }), 2000);
  };

  const fetchStudents = async () => {
    const { stage, grade, section } = filters;
    const classId = generateClassId(stage, grade, section);
    if (!classId) return;
    try {
      const { data, error } = await supabase.from('students')
        .select('id, name, class_id, total_points')
        .eq('class_id', classId)
        .order('total_points', { ascending: false });
      if (error) throw error;
      setStudents((data as Student[]) || []);
    } catch (error) { toast.error('حدث خطأ أثناء جلب بيانات الطلاب'); }
  };

  const fetchGroupsFromDB = async () => {
    if (!user?.id) return;
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    if (!classId) return;

    try {
      const { data: dbGroups, error: groupErr } = await supabase
        .from('interactive_groups')
        .select('id, letter, points')
        .eq('class_id', classId)
        .eq('teacher_id', Number(user.id))
        .order('letter', { ascending: true });

      if (groupErr) throw groupErr;

      if (dbGroups && dbGroups.length > 0) {
        const groupIds = dbGroups.map(g => g.id);
        const { data: dbMembers, error: memErr } = await supabase
          .from('group_members')
          .select('group_id, student_id')
          .in('group_id', groupIds);

        if (memErr) throw memErr;

        const studentIds = (dbMembers || []).map(m => m.student_id);
        let studentMap: Record<number, Student> = {};
        if (studentIds.length > 0) {
          const { data: studentRecords } = await supabase
            .from('students')
            .select('id, name, class_id, total_points')
            .in('id', studentIds);
          (studentRecords || []).forEach(s => { studentMap[s.id] = s as Student; });
        }

        const loadedGroups: Group[] = dbGroups.map(g => {
          const memberStudentIds = (dbMembers || []).filter(m => m.group_id === g.id).map(m => m.student_id);
          return {
            id: g.id,
            letter: g.letter,
            points: g.points || 0,
            students: memberStudentIds.map(id => studentMap[id]).filter(Boolean),
            isSaved: true
          };
        });

        setGroups(loadedGroups);
        setHasUnsavedGroups(false);
      } else {
        setGroups([]);
        setHasUnsavedGroups(false);
      }
    } catch (error) { console.error('Error fetching groups:', error); }
  };

  const fetchQuestionsFromDB = async () => {
    if (!user?.id) return;
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    if (!classId) return;

    try {
      const { data, error } = await supabase
        .from('saved_questions')
        .select('*')
        .eq('teacher_id', Number(user.id))
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (data) setSavedQuestions(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if(user?.id) {
       fetchQuestionsFromDB();
    }
  }, [user?.id, filters]);

  useEffect(() => {
    let interval: any = null;
    let speedInterval: any = null;

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      if (timeLeft <= 5) playSound('tick');
    } else if (timeLeft === 0 && isTimerRunning) {
      playSound('error');
      setIsTimerRunning(false);
      toast.success('انتهى الوقت الحر!');
    }

    if (isSpeedRunning && speedTimeLeft > 0) {
      speedInterval = setInterval(() => setSpeedTimeLeft(prev => prev - 1), 1000);
      if (speedTimeLeft <= 5) playSound('tick');
    } else if (speedTimeLeft === 0 && isSpeedRunning) {
      playSound('error');
      setIsSpeedRunning(false);
      setIsDoublePoints(false);
      toast.error('انتهى وقت التحدي! ⏰', { duration: 3000 });
      // إظهار الإجابة التلقائي عند انتهاء الوقت إذا لم يجاوب أحد
      if (!selectedAnswer && activeQuestion?.correct_answer) {
        setShowDirectAnswer(true);
      }
    }

    return () => {
      clearInterval(interval);
      clearInterval(speedInterval);
    };
  }, [isTimerRunning, timeLeft, isSpeedRunning, speedTimeLeft]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        setTimerPosition({
          x: Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffsetRef.current.x)),
          y: Math.max(10, Math.min(window.innerHeight - 250, e.clientY - dragOffsetRef.current.y))
        });
      }
    };
    const handleMouseUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDownTimer = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = { x: e.clientX - timerPosition.x, y: e.clientY - timerPosition.y };
  };

  useEffect(() => {
    fetchStudents();
    fetchGroupsFromDB();

    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    const channel = supabase.channel(`realtime_points_${classId}`).on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'students', filter: `class_id=eq.${classId}` },
      (payload) => {
        const updated = payload.new as Student;
        setStudents(prev => {
          const old = prev.find(s => s.id === updated.id);
          if (old && updated.total_points > old.total_points) triggerCelebration(updated.name);
          return prev.map(s => s.id === updated.id ? { ...s, total_points: updated.total_points } : s).sort((a, b) => b.total_points - a.total_points);
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filters, user?.id]);

  const handlePointChange = async (studentId: number, change: number) => {
    if (!user?.id) return toast.error('يجب تسجيل الدخول');
    const student = students.find(s => s.id === studentId);
    
    const actualChange = (isDoublePoints && change > 0) ? change * pointsMultiplier : change;
    const currentPoints = student?.total_points || 0;
    const newTotal = Math.max(0, currentPoints + actualChange);
    
    if (newTotal === currentPoints && actualChange < 0) return toast.error('رصيد الطالب صفر بالفعل!');

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, total_points: newTotal } : s).sort((a, b) => b.total_points - a.total_points));
    if (actualChange > 0 && student) {
      if (isDoublePoints) toast.success(`النقاط المضاعفة تعمل! (×${pointsMultiplier}) 🔥`, { duration: 1500 });
      triggerCelebration(student.name);
    }

    try {
      await supabase.from('point_transactions').insert([{ student_id: studentId, teacher_id: Number(user.id), points_added: newTotal - currentPoints, reason: reasons[studentId]?.trim() || (actualChange > 0 ? 'مشاركة تفاعلية' : 'خصم نقاط') }]);
      await supabase.from('students').update({ total_points: newTotal }).eq('id', studentId);
      toast.success(actualChange > 0 ? `تم إضافة ${actualChange} نقطة` : 'تم خصم النقطة', { duration: 2000 });
      setReasons(prev => ({ ...prev, [studentId]: '' }));
    } catch (error) { toast.error('حدث خطأ أثناء التحديث'); fetchStudents(); }
  };

  const handleGroupPointChange = async (groupId: string, change: number) => {
    const currentGroup = groups.find(g => g.id === groupId);
    if (!currentGroup) return;
    
    const actualChange = (isDoublePoints && change > 0) ? change * pointsMultiplier : change;
    const newPoints = Math.max(0, currentGroup.points + actualChange);
    
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        if (actualChange > 0) {
           triggerCelebration(`مجموعة ${g.letter}`);
           if (isDoublePoints) toast.success(`نقاط مضاعفة! (×${pointsMultiplier}) 🔥`, { duration: 1500 });
        }
        return { ...g, points: newPoints };
      }
      return g;
    }));

    if (!groupId.startsWith('temp_')) {
      try {
        await supabase.from('interactive_groups').update({ points: newPoints }).eq('id', groupId);
      } catch (err) { console.error('Error updating group points in DB', err); }
    }
  };

  // ----------------------------------------------------
  // دوال وأوامر تحدي السرعة وبنك الأسئلة المطور
  // ----------------------------------------------------

  const getAiPrompt = () => {
    switch(questionType) {
      case 'mcq': return "سأقوم بتزويدك بمحتوى. قم بإنشاء أسئلة اختيار من متعدد بناءً عليه. يجب أن تكون الاختيارات باللغة الإنجليزية (A, B, C, D). التنسيق المطلوب لكل سؤال في سطر واحد ومفصول بعلامة | هكذا:\nالسؤال | الخيار الأول | الخيار الثاني | الخيار الثالث | الخيار الرابع | الإجابة الصحيحة (اكتب الحرف A أو B أو C أو D)";
      case 'true_false': return "سأقوم بتزويدك بمحتوى. استخرج عبارات صح وخطأ. التنسيق لكل عبارة في سطر واحد مفصول بعلامة | هكذا:\nالعبارة | الإجابة الصحيحة (اكتب True أو False)";
      case 'complete': return "سأقوم بتزويدك بمحتوى. استخرج أسئلة أكمل الفراغ. التنسيق لكل سؤال في سطر واحد مفصول بعلامة | هكذا:\nالجملة وبها فراغ (___) | الكلمة أو العبارة الصحيحة";
      case 'text': default: return "سأقوم بتزويدك بمحتوى. استخرج أسئلة مباشرة. التنسيق لكل سؤال في سطر واحد مفصول بعلامة | هكذا:\nنص السؤال | الإجابة النموذجية";
    }
  };

  const handleSaveQuestion = async () => {
    if (!user?.id) return;
    if (!draftQuestionText.trim()) return toast.error('اكتب أو انسخ الأسئلة أولاً قبل الحفظ');
    
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    setIsProcessing(true);

    try {
      const lines = draftQuestionText.split('\n').map(l => l.trim()).filter(l => l !== '');
      const payloads: any[] = [];

      lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        
        if (questionType === 'mcq') {
          if (parts.length >= 6) { // Bulk Insert من AI
            payloads.push({
              teacher_id: Number(user.id),
              class_id: classId,
              question_text: parts[0],
              question_type: questionType,
              options: [parts[1], parts[2], parts[3], parts[4]],
              correct_answer: parts[5].toUpperCase()
            });
          } else { // إدخال فردي من الحقول
            payloads.push({
              teacher_id: Number(user.id),
              class_id: classId,
              question_text: line,
              question_type: questionType,
              options: mcqOptions,
              correct_answer: manualCorrectAnswer.toUpperCase()
            });
          }
        } else if (questionType === 'true_false') {
          if (parts.length >= 2) {
            payloads.push({
              teacher_id: Number(user.id), class_id: classId, question_type: questionType,
              question_text: parts[0], correct_answer: parts[1]
            });
          } else {
            payloads.push({
              teacher_id: Number(user.id), class_id: classId, question_type: questionType,
              question_text: line, correct_answer: manualCorrectAnswer
            });
          }
        } else {
          // Complete and Text
          if (parts.length >= 2) {
            payloads.push({
              teacher_id: Number(user.id), class_id: classId, question_type: questionType,
              question_text: parts[0], correct_answer: parts[1]
            });
          } else {
            payloads.push({
              teacher_id: Number(user.id), class_id: classId, question_type: questionType,
              question_text: line, correct_answer: manualCorrectAnswer
            });
          }
        }
      });

      const { data, error } = await supabase.from('saved_questions').insert(payloads).select();
      if (error) throw error;

      if (data) {
        setSavedQuestions(prev => [...data, ...prev]);
        toast.success(`تم حفظ ${payloads.length} سؤال في البنك بنجاح!`);
        setDraftQuestionText('');
        setMcqOptions(['', '', '', '']);
        setManualCorrectAnswer('');
      }
    } catch (error) { 
      console.error(error);
      toast.error('فشل حفظ الأسئلة. تأكد من تحديث قاعدة البيانات.'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearBank = async () => {
    if (!user?.id) return;
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    if (!window.confirm('هل أنت متأكد من حذف جميع الأسئلة المحفوظة لهذا الفصل؟')) return;

    try {
      await supabase.from('saved_questions').delete().eq('teacher_id', Number(user.id)).eq('class_id', classId);
      setSavedQuestions([]);
      toast.success('تم تصفير بنك الأسئلة لهذا الفصل بنجاح');
    } catch (error) { toast.error('فشل تصفير بنك الأسئلة'); }
  };

  const pickRandomQuestion = () => {
    if (savedQuestions.length === 0) return toast.error('بنك الأسئلة فارغ! أضف أسئلة أولاً.');
    const randomQ = savedQuestions[Math.floor(Math.random() * savedQuestions.length)] as any;
    
    // سحب السؤال ووضعه في وضع الاستعداد (لا يظهر للطلاب بعد)
    setActiveQuestion({
      id: randomQ.id,
      question_text: randomQ.question_text,
      question_type: randomQ.question_type || 'text',
      options: randomQ.options || ['', '', '', ''],
      correct_answer: randomQ.correct_answer || ''
    });
    
    // إعادة تعيين المتغيرات استعداداً للتحدي
    setSelectedAnswer(null);
    setShowDirectAnswer(false);
    setSpeedTimeLeft(speedSeconds); 
    setIsSpeedRunning(false); 
    
    playSound('magic');
    toast.success('تم سحب سؤال عشوائي بنجاح! اضغط ابدأ التحدي لعرضه للطلاب.');
  };

  const handleStartChallenge = () => {
    if (speedActiveTab === 'manual') {
      if (!draftQuestionText.trim()) return toast.error('يرجى كتابة السؤال أولاً لبدء التحدي');
      const lines = draftQuestionText.split('\n').filter(l => l.trim() !== '');
      setActiveQuestion({
        question_text: lines[0].split('|')[0], // فقط السؤال
        question_type: questionType,
        options: questionType === 'mcq' ? mcqOptions : [],
        correct_answer: manualCorrectAnswer || (lines[0].includes('|') ? lines[0].split('|')[1]?.trim() : '')
      });
    } else {
      if (!activeQuestion) return toast.error('يرجى سحب سؤال عشوائي من البنك أولاً');
    }
    
    setSelectedAnswer(null);
    setShowDirectAnswer(false);
    setIsSpeedRunning(true);
    setIsDoublePoints(true);
  };

  // دالة تفاعل الطالب مع السؤال (توقف العداد أوتوماتيكياً)
  const handleStudentAnswerClick = (answer: string) => {
    // التأكد أن التحدي تم كشفه وبدأ العداد
    const isChallengeRevealed = isSpeedRunning || speedTimeLeft < speedSeconds || selectedAnswer || showDirectAnswer;
    if (!isChallengeRevealed) {
      return toast.error('يجب بدء التحدي والعداد أولاً للتمكن من الإجابة!', { icon: '⚠️' });
    }
    if (selectedAnswer) return; // منع الضغط مرتين

    setSelectedAnswer(answer);
    setIsSpeedRunning(false); // إيقاف العداد فور الإجابة مباشرة
    
    let isCorrect = false;
    const correctAns = activeQuestion?.correct_answer?.trim().toLowerCase() || '';
    
    if (activeQuestion?.question_type === 'mcq' || activeQuestion?.question_type === 'true_false') {
      isCorrect = answer.trim().toLowerCase() === correctAns;
    }

    if (isCorrect) {
      playSound('win');
      toast.success('إجابة صحيحة! قم بتوزيع النقاط المضاعفة الآن 🎉', { duration: 4000 });
    } else {
      playSound('error');
      toast.error('إجابة خاطئة! ❌', { duration: 4000 });
      setShowDirectAnswer(true); // إظهار الإجابة الصحيحة
    }
  };

  // ----------------------------------------------------

  const handleResetPoints = async (periodLabel: string) => {
    if (!students.length) return toast.error('الفصل فارغ بالفعل.');
    if (!window.confirm(`هل أنت متأكد من تصفير نقاط الطلاب لـ (${periodLabel})؟`)) return;
    setIsProcessing(true); setShowResetMenu(false);
    try {
      await supabase.from('students').update({ total_points: 0 }).eq('class_id', generateClassId(filters.stage, filters.grade, filters.section));
      toast.success(`تم تصفير النقاط لـ ${periodLabel} بنجاح.`, { duration: 2000 });
      fetchStudents();
    } catch (error) { toast.error('حدث خطأ أثناء تصفير النقاط.'); } 
    finally { setIsProcessing(false); }
  };

  const handleGenerateGroups = async () => {
    setIsGeneratingGroups(true);
    const classId = generateClassId(filters.stage, filters.grade, filters.section);

    try {
      const { data: dbStudents, error: fetchErr } = await supabase.from('students').select('id, name, class_id, total_points').eq('class_id', classId);
      if (fetchErr) throw fetchErr;

      let pool: Student[] = (dbStudents as Student[]) || [];
      if (groupType === 'boys') pool = pool.filter(s => getStudentAvatar(s.name) === '👦');
      else if (groupType === 'girls') pool = pool.filter(s => getStudentAvatar(s.name) === '👧');

      if (pool.length === 0) return toast.error('لا يوجد طلاب مسجلين في هذا الفصل في قاعدة البيانات.');

      const shuffled = shuffleArray(pool);
      const numGroups = Math.max(1, groupCount);
      const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
        id: `temp_${Date.now()}_${i}`, letter: String.fromCharCode(65 + i), students: [], points: 0, isSaved: false
      }));

      shuffled.forEach((student, index) => { newGroups[index % numGroups].students.push(student); });

      const readyGroups = newGroups.filter(g => g.students.length > 0);
      setGroups(readyGroups);
      setHasUnsavedGroups(true);
      toast.success('تم توزيع الطلاب! اضغط "حفظ في السحابة" لتثبيتها بحسابك.', { duration: 3500 });
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الطلاب لتوليد المجموعات');
    } finally { setIsGeneratingGroups(false); }
  };

  const handleSaveGroupsToDB = async () => {
    if (!user?.id) return toast.error('يجب تسجيل الدخول لحفظ المجموعات.');
    if (groups.length === 0) return toast.error('لا توجد مجموعات لحفظها.');

    setIsSavingGroups(true);
    const classId = generateClassId(filters.stage, filters.grade, filters.section);

    try {
      await supabase.from('interactive_groups').delete().eq('class_id', classId).eq('teacher_id', Number(user.id));
      const groupsPayload = groups.map(g => ({ class_id: classId, teacher_id: Number(user.id), letter: g.letter, points: g.points || 0 }));
      const { data: insertedGroups, error: groupInsertErr } = await supabase.from('interactive_groups').insert(groupsPayload).select();
      if (groupInsertErr) throw groupInsertErr;

      if (insertedGroups) {
        const membersPayload: any[] = [];
        const savedStateGroups: Group[] = [];

        insertedGroups.forEach(dbGroup => {
          const matchingLocalGroup = groups.find(g => g.letter === dbGroup.letter);
          if (matchingLocalGroup) {
            matchingLocalGroup.students.forEach(s => { membersPayload.push({ group_id: dbGroup.id, student_id: s.id }); });
            savedStateGroups.push({ ...matchingLocalGroup, id: dbGroup.id, isSaved: true });
          }
        });

        if (membersPayload.length > 0) {
          const { error: memberInsertErr } = await supabase.from('group_members').insert(membersPayload);
          if (memberInsertErr) throw memberInsertErr;
        }

        setGroups(savedStateGroups);
        setHasUnsavedGroups(false);
        playSound('win');
        toast.success('تم حفظ المجموعات بنجاح بحسابك! 💾✨');
      }
    } catch (error: any) { toast.error(`حدث خطأ أثناء الحفظ`); } finally { setIsSavingGroups(false); }
  };

  const handleResetGroupPoints = async () => {
    if (!user?.id) return;
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    if (!window.confirm('هل أنت متأكد من تصفير نقاط مجموعاتك؟')) return;
    
    setGroups(prev => prev.map(g => ({ ...g, points: 0 })));
    try {
      await supabase.from('interactive_groups').update({ points: 0 }).eq('class_id', classId).eq('teacher_id', Number(user.id));
      toast.success('تم تصفير نقاط المجموعات بنجاح.');
    } catch (error) { toast.error('فشل تصفير النقاط في قاعدة البيانات.'); }
  };

  const handleClearGroups = async () => {
    if (!user?.id) return;
    const classId = generateClassId(filters.stage, filters.grade, filters.section);
    if (!window.confirm('هل أنت متأكد من حذف مجموعاتك الحالية نهائياً من قاعدة البيانات؟')) return;

    setGroups([]);
    setHasUnsavedGroups(false);
    try {
      await supabase.from('interactive_groups').delete().eq('class_id', classId).eq('teacher_id', Number(user.id));
      toast.success('تم مسح المجموعات بنجاح.');
    } catch (error) { toast.error('حدث خطأ أثناء مسح المجموعات.'); }
  };

  const getRaceTheme = () => {
    switch (filters.stage) {
      case 'Primary': return {
        container: 'bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-slate-800/90 dark:to-slate-900 border-indigo-100 dark:border-slate-700',
        title: 'text-indigo-800 dark:text-indigo-300',
        track: 'bg-white/80 dark:bg-slate-700 shadow-inner border border-gray-100 dark:border-slate-600',
        fill: 'bg-gradient-to-l from-amber-400 to-orange-500',
        text: 'text-indigo-900 dark:text-white',
        box: 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-slate-600'
      };
      case 'Preparatory': return {
        container: 'bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-800',
        title: 'text-white',
        track: 'bg-black/30 shadow-inner border border-white/5',
        fill: 'bg-gradient-to-l from-violet-400 to-fuchsia-500',
        text: 'text-white',
        box: 'bg-white/10 text-white border-white/20 backdrop-blur-sm'
      };
      case 'Secondary': default: return {
        container: 'bg-slate-900 border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]',
        title: 'text-emerald-400',
        track: 'bg-slate-800 shadow-inner border border-slate-700',
        fill: 'bg-gradient-to-l from-emerald-400 to-cyan-500 shadow-[0_0_15px_rgba(52,211,153,0.6)]',
        text: 'text-white',
        box: 'bg-slate-800 text-emerald-400 border-emerald-900 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
      };
    }
  };

  const startRandomizer = () => {
    if (students.length === 0) return toast.error('لا يوجد طلاب في هذا الفصل');
    setIsSpinning(true);
    setRandomWinner(null);
    setHighlightIndex(-1);

    let jumps = 0;
    const maxJumps = 40;
    let currentSpeed = 50;

    const tick = () => {
      const randomIdx = Math.floor(Math.random() * students.length);
      setHighlightIndex(randomIdx);
      jumps++;

      if (jumps < maxJumps) {
        currentSpeed += (jumps * 0.8);
        setTimeout(tick, currentSpeed);
      } else {
        const winner = students[randomIdx];
        setRandomWinner(winner);
        setIsSpinning(false);
        triggerCelebration(winner.name);
      }
    };
    tick();
  };

  const openMysteryBox = () => {
    if (mysteryStudentId === '') return toast.error('يرجى اختيار الطالب أولاً');
    
    playSound('magic');
    setIsBoxOpening(true);
    setTimeout(() => {
      const randomPrize = MYSTERY_PRIZES[Math.floor(Math.random() * MYSTERY_PRIZES.length)];
      setDrawnPrize(randomPrize);
      setIsBoxOpening(false);
      
      if (randomPrize.points && mysteryStudentId !== '') {
         handlePointChange(Number(mysteryStudentId), randomPrize.points);
      } else {
         playSound('win');
      }
    }, 1500);
  };

  const closeMysteryBox = () => {
    setShowMysteryBox(false);
    setDrawnPrize(null);
    setMysteryStudentId('');
  };

  const renderMysteryBoxModal = () => {
    if (!showMysteryBox) return null;
    return (
      <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-gradient-to-b from-slate-900 to-purple-950 rounded-[3rem] shadow-[0_0_50px_rgba(139,92,246,0.3)] border-2 border-purple-500/30 w-full max-w-5xl overflow-hidden relative flex flex-col p-6 md:p-8">
          <button onClick={closeMysteryBox} className="absolute top-6 left-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-20">
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-lg flex justify-center items-center gap-3">
              <Gift className="w-10 h-10 text-amber-400" /> صندوق المفاجآت
            </h2>
            {!drawnPrize && <p className="text-purple-300 mt-2 font-semibold">اختر الطالب الفائز بالضغط على اسمه ثم افتح الصندوق!</p>}
          </div>

          {!drawnPrize ? (
            <div className="flex flex-col md:flex-row gap-8 items-center h-full">
              <div className="w-full md:w-2/3 bg-white/5 p-4 rounded-3xl border border-white/10 max-h-[50vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setMysteryStudentId(s.id)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border-2 ${mysteryStudentId === s.id ? 'bg-purple-600/40 border-purple-400 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-800/50 border-transparent hover:bg-slate-700 hover:border-slate-500'}`}
                    >
                      {mysteryStudentId === s.id && <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-purple-300" />}
                      <span className="text-3xl mb-1">{getStudentAvatar(s.name)}</span>
                      <span className="text-xs font-bold text-center text-white line-clamp-2">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center">
                <div className={`cursor-pointer transition-transform duration-300 ${isBoxOpening ? 'animate-bounce scale-110' : mysteryStudentId !== '' ? 'hover:scale-110' : 'opacity-50 grayscale'}`} onClick={() => { if(!isBoxOpening && mysteryStudentId !== '') openMysteryBox(); }}>
                  <Gift className={`w-32 h-32 md:w-48 md:h-48 ${isBoxOpening ? 'text-amber-400' : 'text-purple-400'} filter drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]`} />
                </div>
                
                <button 
                  onClick={openMysteryBox} 
                  disabled={isBoxOpening || mysteryStudentId === ''}
                  className="mt-8 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isBoxOpening ? 'جاري الفتح...' : mysteryStudentId === '' ? 'اختر طالباً أولاً' : 'افتح الصندوق الآن!'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in-75 duration-500 py-8">
              <div className={`w-40 h-40 rounded-[2.5rem] bg-gradient-to-br ${drawnPrize.color} flex items-center justify-center text-white shadow-[0_0_50px_rgba(255,255,255,0.2)] border-4 border-white mb-8 animate-pulse`}>
                {drawnPrize.icon}
              </div>
              <h3 className={`text-4xl font-black mb-4 text-white drop-shadow-md`}>{drawnPrize.title}</h3>
              <p className="text-purple-200 text-xl mb-8 font-semibold text-center max-w-md">{drawnPrize.desc}</p>
              
              <div className="bg-slate-800/80 border border-slate-700 px-8 py-4 rounded-3xl mb-8 text-center">
                <p className="text-gray-400 text-sm mb-2 font-bold">الفائز بالجائزة</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getStudentAvatar(students.find(s => s.id === mysteryStudentId)?.name || '')}</span>
                  <span className="text-2xl font-black text-white">{students.find(s => s.id === mysteryStudentId)?.name}</span>
                </div>
              </div>

              <button onClick={closeMysteryBox} className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-lg border border-white/20 transition-colors">
                إغلاق والمتابعة
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSpeedChallengeModal = () => {
    if (!showSpeedModal) return null;
    
    // متغير لتحديد هل التحدي بدأ ومكشوف أم لا
    const isChallengeRevealed = isSpeedRunning || speedTimeLeft < speedSeconds || selectedAnswer !== null || showDirectAnswer;

    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in" dir="rtl">
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-[3rem] p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)] w-full max-w-6xl relative flex flex-col h-[90vh] overflow-y-auto">
           
           <button onClick={() => { setShowSpeedModal(false); setIsSpeedRunning(false); setIsDoublePoints(false); setActiveQuestion(null); setDraftQuestionText(''); setSelectedAnswer(null); setShowDirectAnswer(false); }} className="absolute top-6 left-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-20">
              <X className="w-8 h-8" />
           </button>
           
           <div className="text-center mb-8 border-b border-white/10 pb-6">
             <h2 className="text-4xl md:text-5xl font-black text-white flex justify-center items-center gap-4 drop-shadow-md">
                <Zap className="w-12 h-12 text-amber-500 animate-pulse" />
                تحدي النقاط المضاعفة
             </h2>
             <p className="text-amber-300/80 text-lg mt-3 font-semibold">اسحب سؤالاً عشوائياً، ابدأ التحدي لكشفه، واكسب النقاط المضاعفة!</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
             <div className="lg:col-span-5 flex flex-col space-y-4">
                
                <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
                  <button onClick={() => setSpeedActiveTab('bank')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${speedActiveTab === 'bank' ? 'bg-amber-500 text-amber-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>سحب من البنك</button>
                  <button onClick={() => setSpeedActiveTab('manual')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${speedActiveTab === 'manual' ? 'bg-amber-500 text-amber-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>إضافة أسئلة</button>
                  <button onClick={() => setSpeedActiveTab('manage')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${speedActiveTab === 'manage' ? 'bg-amber-500 text-amber-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>إدارة البنك</button>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex-1 flex flex-col overflow-y-auto">
                  
                  {speedActiveTab === 'bank' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <div className="bg-amber-500/10 p-4 rounded-full">
                        <Shuffle className="w-12 h-12 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">سحب سؤال عشوائي</h3>
                        <p className="text-slate-400 text-sm">بنك الأسئلة الحالي يحتوي على <strong className="text-amber-400">{savedQuestions.length}</strong> أسئلة خاصة بهذا الفصل.</p>
                      </div>
                      <button 
                        onClick={pickRandomQuestion}
                        disabled={isSpeedRunning || savedQuestions.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-black text-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        اسحب سؤالاً للاستعداد
                      </button>
                    </div>
                  )}

                  {speedActiveTab === 'manual' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300">نوع السؤال المضاف</label>
                        <select 
                          value={questionType} 
                          onChange={e => setQuestionType(e.target.value as any)} 
                          className="bg-slate-900 text-amber-400 font-bold border border-slate-700 rounded-lg p-2 text-sm outline-none"
                          disabled={isSpeedRunning}
                        >
                          <option value="text">سؤال كتابي / مباشر</option>
                          <option value="mcq">اختيار من متعدد</option>
                          <option value="true_false">صح وخطأ</option>
                          <option value="complete">أكمل ما يلي</option>
                        </select>
                      </div>

                      <div>
                        <textarea 
                          placeholder={questionType === 'mcq' ? "مثال للإضافة السريعة:\nWhat is the capital of Egypt? | Cairo | Alex | Giza | Aswan | A" : "اكتب الأسئلة هنا (كل سطر يعتبر سؤال منفصل لحفظه في البنك)..."}
                          value={draftQuestionText} 
                          onChange={e => setDraftQuestionText(e.target.value)} 
                          className="w-full bg-slate-900 text-white border-2 border-slate-700 focus:border-amber-500 rounded-xl p-4 text-sm font-bold outline-none resize-none h-24 custom-scrollbar leading-relaxed"
                          disabled={isSpeedRunning}
                        />
                        <p className="text-amber-300/80 text-[11px] mt-2 font-bold">
                           💡 <b>إضافة متعددة:</b> انسخ الأسئلة كل سؤال في سطر.
                           {questionType === 'mcq' && ' (افصل بعلامة | بين السؤال، الـ 4 خيارات، والإجابة الصحيحة A/B/C/D)'}
                        </p>
                      </div>

                      {/* إظهار حقول إدخال يدوية إضافية إذا كان المعلم يكتب سؤالاً واحداً فقط بدون علامة | */}
                      {draftQuestionText.split('\n').filter(l => l.trim()).length <= 1 && !draftQuestionText.includes('|') && !draftQuestionText.includes('\t') && draftQuestionText.trim() !== '' && (
                        <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                           {questionType === 'mcq' && (
                             <div className="grid grid-cols-2 gap-3" dir="ltr">
                               {mcqOptions.map((opt, i) => (
                                 <input key={i} type="text" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => { const newOpts = [...mcqOptions]; newOpts[i] = e.target.value; setMcqOptions(newOpts); }} className="bg-slate-900 text-white border border-slate-700 rounded-lg p-3 text-xs font-bold outline-none focus:border-amber-500" disabled={isSpeedRunning} />
                               ))}
                             </div>
                           )}
                           <input type="text" placeholder={questionType === 'mcq' ? "الإجابة الصحيحة (A, B, C, D)" : "اكتب الإجابة النموذجية للسؤال..."} value={manualCorrectAnswer} onChange={e => setManualCorrectAnswer(e.target.value)} className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg p-3 text-xs font-bold outline-none focus:border-emerald-500" disabled={isSpeedRunning} />
                        </div>
                      )}

                      <button onClick={handleSaveQuestion} disabled={isSpeedRunning || isProcessing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookmarkPlus className="w-5 h-5" />} حفظ في بنك الأسئلة
                      </button>

                      {/* صندوق الرسالة المخصصة للذكاء الاصطناعي */}
                      <div className="mt-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-right">
                        <p className="text-amber-300 text-sm font-bold flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5" /> أمر الذكاء الاصطناعي (Prompt) المخصص:
                        </p>
                        <div className="flex gap-2 items-start">
                          <p className="text-amber-100/80 text-xs leading-relaxed flex-1 select-all bg-slate-900 p-2 rounded-lg border border-amber-500/20 text-justify">
                            {getAiPrompt()}
                          </p>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(getAiPrompt()); toast.success('تم نسخ الأمر بنجاح!'); }}
                            className="bg-amber-600 hover:bg-amber-500 text-amber-950 p-2 rounded-lg transition-colors flex-shrink-0"
                            title="نسخ الأمر"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {speedActiveTab === 'manage' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <div className="bg-rose-500/10 p-4 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">إدارة بنك الأسئلة</h3>
                        <p className="text-slate-400 text-sm">استخدم هذا الخيار لمسح جميع الأسئلة التي قمت بحفظها <strong className="text-rose-400">لهذا الفصل فقط</strong> والبدء من جديد.</p>
                      </div>
                      <button 
                        onClick={handleClearBank}
                        disabled={isSpeedRunning || savedQuestions.length === 0}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" /> تصفير بنك أسئلة الفصل
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 mb-3 text-center">المضاعف</label>
                    <div className="flex gap-2 justify-center">
                      {[2, 3, 4].map(m => (
                        <button key={m} onClick={() => setPointsMultiplier(m)} disabled={isSpeedRunning} className={`w-12 h-12 flex items-center justify-center text-lg font-black rounded-xl transition-all ${pointsMultiplier === m ? 'bg-amber-500 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-110' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 border border-slate-700'} disabled:opacity-50`}>×{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-[1.5] bg-slate-800/50 p-4 rounded-3xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 mb-3 text-center">الوقت المحدد (ثوانٍ)</label>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[10, 15, 30, 60].map(sec => (
                        <button key={sec} onClick={() => { setSpeedSeconds(sec); setSpeedTimeLeft(sec); }} disabled={isSpeedRunning} className={`px-4 py-2 font-bold rounded-xl transition-all ${speedSeconds === sec ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-700 border border-slate-700'} disabled:opacity-50`}>{sec}</button>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             <div className="lg:col-span-7 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-r border-white/10 pt-8 lg:pt-0 lg:pr-8">
               
               <div className="w-full flex-1 flex flex-col items-center justify-center">
                 {/* عرض السؤال التفاعلي بناءً على التفعيل */}
                 {activeQuestion ? (
                   <div className="bg-amber-500/10 border-2 border-amber-500/30 p-6 md:p-8 rounded-[2rem] w-full text-center mb-8 min-h-[250px] flex flex-col shadow-inner relative overflow-hidden">
                     
                     {/* شاشة الإخفاء التلقائية (تغطي السؤال قبل بدء العداد) */}
                     {!isChallengeRevealed ? (
                       <div className="absolute inset-0 z-10 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                          <Lock className="w-16 h-16 text-amber-500/60 mb-4 animate-pulse" />
                          <h3 className="text-3xl font-black text-white">السؤال جاهز للطلاب!</h3>
                          <p className="text-amber-200/70 mt-3 text-lg font-bold">لن يتمكنوا من رؤيته إلا عند الضغط على بدء التحدي.</p>
                       </div>
                     ) : null}

                     <p className="text-amber-100 text-2xl md:text-3xl font-black leading-relaxed drop-shadow-md mb-6 relative z-0">{activeQuestion.question_text}</p>
                     
                     {/* تفاعل الاختيار من متعدد */}
                     {activeQuestion.question_type === 'mcq' && activeQuestion.options && activeQuestion.options.some(o => o.trim() !== '') && (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mt-auto relative z-0" dir="ltr">
                         {activeQuestion.options.filter(o => o.trim() !== '').map((opt, idx) => {
                           const letter = String.fromCharCode(65 + idx); // A, B, C, D
                           const isCorrectAnswer = letter === activeQuestion.correct_answer?.trim().toUpperCase();
                           
                           let btnClass = "bg-slate-900/80 border-slate-600 text-white hover:border-amber-500";
                           
                           if (selectedAnswer) {
                             if (isCorrectAnswer) {
                               btnClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                             } else if (selectedAnswer === letter && !isCorrectAnswer) {
                               btnClass = "bg-rose-600 border-rose-400 text-white";
                             } else {
                               btnClass = "bg-slate-900/40 border-slate-700 text-slate-500 opacity-50";
                             }
                           } else if (!isSpeedRunning) {
                             btnClass = "bg-slate-900/80 border-slate-600 text-white opacity-70 cursor-not-allowed";
                           }

                           return (
                             <button 
                               key={idx} 
                               onClick={() => handleStudentAnswerClick(letter)}
                               disabled={!isSpeedRunning || !!selectedAnswer}
                               className={`p-4 rounded-xl font-bold text-sm md:text-base flex items-center gap-3 shadow-sm transition-all text-left w-full border ${btnClass}`}
                             >
                               <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-black ${selectedAnswer && isCorrectAnswer ? 'bg-white text-emerald-700' : selectedAnswer && selectedAnswer === letter ? 'bg-white text-rose-700' : 'bg-amber-500 text-amber-950'}`}>
                                 {letter}
                               </span>
                               <span className="leading-snug flex-1">{opt}</span>
                               {selectedAnswer && isCorrectAnswer && <Check className="w-5 h-5 text-white" />}
                               {selectedAnswer && selectedAnswer === letter && !isCorrectAnswer && <XCircle className="w-5 h-5 text-white" />}
                             </button>
                           );
                         })}
                       </div>
                     )}

                     {/* تفاعل الصح والخطأ */}
                     {activeQuestion.question_type === 'true_false' && (
                       <div className="flex justify-center gap-6 mt-auto relative z-0" dir="ltr">
                         {['True', 'False'].map(opt => {
                            const isCorrectAnswer = opt.toLowerCase() === activeQuestion.correct_answer?.trim().toLowerCase();
                            let btnClass = "bg-slate-900/80 border-slate-600 text-white hover:border-amber-500";
                            
                            if (selectedAnswer) {
                              if (isCorrectAnswer) {
                                btnClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]";
                              } else if (selectedAnswer === opt && !isCorrectAnswer) {
                                btnClass = "bg-rose-600 border-rose-400 text-white";
                              } else {
                                btnClass = "bg-slate-900/40 border-slate-700 text-slate-500 opacity-50";
                              }
                            } else if (!isSpeedRunning) {
                              btnClass = "bg-slate-900/80 border-slate-600 text-white opacity-70 cursor-not-allowed";
                            }

                            return (
                              <button 
                                key={opt}
                                onClick={() => handleStudentAnswerClick(opt)}
                                disabled={!isSpeedRunning || !!selectedAnswer}
                                className={`px-8 py-4 rounded-2xl font-black text-xl border-2 transition-all w-40 flex items-center justify-center gap-2 ${btnClass}`}
                              >
                                {opt === 'True' ? 'صواب (True)' : 'خطأ (False)'}
                              </button>
                            );
                         })}
                       </div>
                     )}
                     
                     {/* تفاعل الأكمل والمباشر (إظهار الإجابة يدوياً) */}
                     {(activeQuestion.question_type === 'complete' || activeQuestion.question_type === 'text') && (
                       <div className="mt-auto flex flex-col items-center gap-4 relative z-0">
                          {showDirectAnswer && activeQuestion.correct_answer ? (
                            <div className="bg-emerald-600/20 border-2 border-emerald-500/50 text-emerald-200 px-8 py-4 rounded-2xl font-black text-xl flex items-center gap-3 animate-in zoom-in">
                              <CheckCircle2 className="w-6 h-6" /> {activeQuestion.correct_answer}
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                if(!isSpeedRunning) return toast.error('قم بتشغيل التحدي والعداد أولاً!');
                                playSound('magic'); 
                                setShowDirectAnswer(true); 
                                setIsSpeedRunning(false); // إيقاف العداد عند إظهار الإجابة
                              }}
                              className={`bg-slate-800 border border-slate-600 hover:bg-slate-700 px-6 py-3 rounded-xl text-amber-400 font-bold text-sm flex items-center gap-2 transition-colors ${!isSpeedRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Eye className="w-5 h-5" /> إظهار الإجابة الصحيحة للطلاب
                            </button>
                          )}
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 p-8 rounded-[2rem] w-full text-center mb-8 flex flex-col items-center justify-center min-h-[200px]">
                     <HelpCircle className="w-16 h-16 text-slate-600 mb-4" />
                     <p className="text-slate-400 text-xl font-bold">شاشة العرض للطلاب<br/><span className="text-sm font-normal mt-2 block">السؤال والاختيارات ستظهر هنا ليتم الضغط عليها للتصحيح التلقائي وإيقاف العداد</span></p>
                   </div>
                 )}

                 <div className={`text-[8rem] md:text-[12rem] font-black font-mono leading-none transition-colors drop-shadow-2xl ${speedTimeLeft <= 5 && speedTimeLeft > 0 && isSpeedRunning ? 'text-rose-500 animate-ping' : 'text-amber-400'}`}>
                    {speedTimeLeft}
                 </div>
               </div>

               <div className="flex w-full gap-3 mt-8">
                  {!isSpeedRunning ? (
                    <button onClick={handleStartChallenge} className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-2xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105">
                      <Play className="w-8 h-8" /> {speedTimeLeft < speedSeconds ? 'استئناف التحدي' : 'ابـدأ التحدي الآن!'}
                    </button>
                  ) : (
                    <button onClick={() => { setIsSpeedRunning(false); setIsDoublePoints(false); }} className="flex-[2] py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-2xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105">
                      <Pause className="w-8 h-8" /> إيقاف مؤقت للعداد
                    </button>
                  )}

                  <button onClick={() => { setIsSpeedRunning(false); setIsDoublePoints(false); setSpeedTimeLeft(speedSeconds); setSelectedAnswer(null); setShowDirectAnswer(false); }} className="px-6 py-5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-2xl font-bold flex items-center justify-center transition-colors border border-slate-700" title="إعادة ضبط المؤقت">
                    <ResetIcon className="w-6 h-6" />
                  </button>

                  <button onClick={() => { setShowSpeedModal(false); setIsSpeedRunning(false); setIsDoublePoints(false); setActiveQuestion(null); setDraftQuestionText(''); setSelectedAnswer(null); setShowDirectAnswer(false); }} className="px-8 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg flex items-center justify-center transition-colors shadow-md hover:scale-105" title="إنهاء وإغلاق التحدي">
                    إنهاء التحدي
                  </button>
               </div>
             </div>
           </div>
        </div>
      </div>
    );
  };

  const renderDraggableTimer = () => {
    if (!showTimerModal) return null;
    const applyCustomTime = () => {
      const m = Number(timerMinutesInput) || 0;
      const s = Number(timerSecondsInput) || 0;
      const totalSec = (m * 60) + s;
      if (totalSec > 0) {
        setTimerSeconds(totalSec); 
        setTimeLeft(totalSec);
        setIsTimerRunning(false);
      } else { toast.error('الرجاء إدخال وقت صحيح'); }
    };

    const formatTime = (sec: number) => {
      const mins = Math.floor(sec / 60);
      const remainingSec = sec % 60;
      return `${mins}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
    };

    return (
      <div style={{ left: `${timerPosition.x}px`, top: `${timerPosition.y}px` }} className="fixed z-[400] w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border-2 border-indigo-500/30 animate-in fade-in duration-200 select-none" dir="rtl">
        <div onMouseDown={handleMouseDownTimer} className="flex justify-between items-center mb-3 cursor-move bg-indigo-50 dark:bg-slate-800/80 px-3 py-2 rounded-2xl border border-indigo-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-black text-sm"><GripHorizontal className="w-5 h-5 text-indigo-400" /><span>المؤقت الحر</span></div>
          <button onClick={() => setShowTimerModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="my-4 text-center">
          <div className={`text-5xl font-black font-mono tracking-wider ${timeLeft <= 10 && timeLeft > 0 ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>{formatTime(timeLeft)}</div>
        </div>

        {!isTimerRunning && (
          <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
            <div className="flex-1 flex items-center gap-1">
              <span className="text-xs text-gray-500 font-bold">دقيقة</span>
              <input type="number" min="0" value={timerMinutesInput} onChange={e => setTimerMinutesInput(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full text-center bg-white dark:bg-slate-800 border rounded-lg py-1 font-bold outline-none focus:border-indigo-400 text-sm" />
            </div>
            <div className="flex-1 flex items-center gap-1">
              <span className="text-xs text-gray-500 font-bold">ثانية</span>
              <input type="number" min="0" max="59" value={timerSecondsInput} onChange={e => setTimerSecondsInput(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full text-center bg-white dark:bg-slate-800 border rounded-lg py-1 font-bold outline-none focus:border-indigo-400 text-sm" />
            </div>
            <button onClick={applyCustomTime} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-1.5 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[30, 60, 120, 300].map(sec => (
            <button key={sec} onClick={() => { setTimerSeconds(sec); setTimeLeft(sec); setIsTimerRunning(false); }} className={`py-1.5 rounded-lg font-bold text-[11px] ${timerSeconds === sec ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'}`}>
              {sec >= 60 ? `${sec / 60}د` : `${sec}ث`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-sm shadow-md ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {isTimerRunning ? 'إيقاف' : 'ابدأ'}
          </button>
          <button onClick={() => { setIsTimerRunning(false); setTimeLeft(timerSeconds); }} className="px-3 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200"><ResetIcon className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  const generateIframeContent = (userCode: string) => {
    let cleanCode = userCode.replace(/import.*?['"].*?['"];?/g, ''); 
    cleanCode = cleanCode.replace(/export\s+default\s+[a-zA-Z0-9_]+;?/g, '');
    cleanCode = cleanCode.replace(/export\s+(const|let|var|function|class)/g, '$1');
    return `<!DOCTYPE html><html dir="ltr"><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script><script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script><style>body { margin: 0; font-family: system-ui, sans-serif; background-color: #0f172a; color: white; }</style></head><body><div id="root"></div><script type="text/babel">const { useState, useEffect, useRef, useMemo, useCallback } = React; try { ${cleanCode} if (typeof App !== 'undefined') { const root = ReactDOM.createRoot(document.getElementById('root')); root.render(<App />); } } catch (e) { document.getElementById('root').innerHTML = '<div style="padding: 20px; color: #dc2626;">' + e.toString() + '</div>'; } </script></body></html>`;
  };

  const renderCodeModal = () => {
    if (!showCodeModal) return null;
    return (
      <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-300" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-indigo-200 dark:border-slate-700 w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]">
          <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center shadow-lg z-10 border-b border-white/10">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3"><Code className="w-7 h-7 text-emerald-400" /> لعبة كودية مخصصة</h2>
            <button onClick={() => setShowCodeModal(false)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-2">
            <button onClick={() => setCodeMode('editor')} className={`flex-1 py-3 font-bold text-sm md:text-base rounded-xl transition-all ${codeMode === 'editor' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>📝 تعديل الكود</button>
            <button onClick={() => { setCodeMode('preview'); setRunnerKey(k => k + 1); }} className={`flex-1 py-3 font-bold text-sm md:text-base rounded-xl transition-all ${codeMode === 'preview' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>▶️ تشغيل اللعبة</button>
          </div>
          <div className="flex-1 overflow-hidden flex bg-slate-50 dark:bg-slate-900 relative">
            {codeMode === 'editor' ? (
              <div className="w-full h-full p-4 flex flex-col">
                <textarea value={customCode} onChange={e => setCustomCode(e.target.value)} className="w-full flex-1 p-5 rounded-2xl border-2 border-slate-700 bg-[#1e1e1e] text-[#d4d4d4] font-mono outline-none resize-none text-sm md:text-base shadow-inner" dir="ltr" spellCheck="false" />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-950 relative">
                <iframe key={runnerKey} title="Code Runner" sandbox="allow-scripts" className="w-full h-full border-none" srcDoc={generateIframeContent(customCode)} />
                <button onClick={() => setRunnerKey(k => k + 1)} className="absolute bottom-6 right-6 bg-slate-800 text-white p-3 rounded-full shadow-2xl border border-white/10"><RotateCcw className="w-6 h-6" /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRandomizerModal = () => {
    if (!activeRandomizer) return null;
    const currentStudent = highlightIndex >= 0 ? students[highlightIndex] : null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-3xl overflow-hidden relative flex flex-col max-h-[90vh]">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-md z-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              {activeRandomizer === 'wheel' && <Aperture className="w-8 h-8 animate-spin-slow" />}
              {activeRandomizer === 'slot' && <ListOrdered className="w-8 h-8" />}
              {activeRandomizer === 'spotlight' && <Focus className="w-8 h-8" />}
              السحب العشوائي
            </h2>
            <button onClick={() => { if(!isSpinning) setActiveRandomizer(null); }} className="text-white/70 hover:text-white bg-black/20 p-2 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {activeRandomizer === 'wheel' && (
              <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-[16px] border-indigo-100 dark:border-slate-800 shadow-inner flex items-center justify-center overflow-hidden transition-transform duration-75 ${isSpinning ? 'animate-spin' : ''}`} style={{ background: 'conic-gradient(from 0deg, #4f46e5, #9333ea, #ec4899, #f59e0b, #10b981, #3b82f6, #4f46e5)' }}>
                  <div className="w-48 h-48 md:w-60 md:h-60 bg-white dark:bg-slate-900 rounded-full shadow-xl flex items-center justify-center z-10 p-4 text-center">
                    {currentStudent ? (
                      <div className="flex flex-col items-center">
                        <span className="text-4xl mb-2">{getStudentAvatar(currentStudent.name)}</span>
                        <span className="font-black text-xl md:text-2xl text-gray-800 dark:text-white">{currentStudent.name}</span>
                      </div>
                    ) : <span className="font-bold text-gray-400">اضغط ابدأ</span>}
                  </div>
                </div>
              </div>
            )}
            {activeRandomizer === 'slot' && (
              <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 border-4 border-indigo-500 rounded-3xl h-40 flex items-center justify-center shadow-inner overflow-hidden">
                  {currentStudent ? (
                    <div className="flex flex-col items-center scale-125">
                       <span className="text-5xl mb-2">{getStudentAvatar(currentStudent.name)}</span>
                       <span className="font-black text-3xl text-indigo-700 dark:text-indigo-300 text-center px-4">{currentStudent.name}</span>
                    </div>
                  ) : <span className="font-black text-2xl text-gray-400">جاهز للسحب...</span>}
                </div>
              </div>
            )}
            {activeRandomizer === 'spotlight' && (
              <div className="w-full max-h-[50vh] overflow-y-auto p-2 flex flex-wrap justify-center gap-2 md:gap-3">
                {students.map((student, idx) => {
                  const isHighlighted = highlightIndex === idx;
                  const isWinner = randomWinner?.id === student.id;
                  return (
                    <div key={student.id} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 w-20 h-24 md:w-24 md:h-28 ${isWinner ? 'bg-indigo-600 text-white scale-110 shadow-xl ring-4 ring-indigo-300 z-10' : isHighlighted ? 'bg-amber-400 text-amber-950 scale-105 shadow-lg' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                      <span className="text-2xl md:text-3xl mb-1">{getStudentAvatar(student.name)}</span>
                      <span className="text-[9px] md:text-xs font-bold text-center leading-tight line-clamp-2 px-1">{student.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-center">
            {!randomWinner ? (
               <button onClick={startRandomizer} disabled={isSpinning || students.length === 0} className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-lg flex items-center gap-2">
                {isSpinning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Dices className="w-6 h-6" />}
                {isSpinning ? 'جاري السحب...' : 'ابدأ السحب الآن!'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => handlePointChange(randomWinner.id, 1)} className="px-8 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black flex items-center gap-2">
                  <Plus className="w-5 h-5" /> إعطاء نقطة ({randomWinner.name.split(' ')[0]})
                </button>
                <button onClick={startRandomizer} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" /> سحب طالب آخر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPodium = () => {
    const top5 = [3, 1, 0, 2, 4].map(idx => ({ rank: idx + 1, student: students[idx] })).filter(item => item.student && item.student.total_points > 0);
    if (!top5.length) return null;

    const styles = [
      { height: 'h-48 md:h-64', bg: 'from-yellow-500 to-amber-600', border: 'border-yellow-400', text: 'text-yellow-900', icon: <Crown className="w-10 h-10 md:w-14 md:h-14 text-yellow-300 animate-bounce" /> },
      { height: 'h-36 md:h-48', bg: 'from-slate-300 to-slate-500', border: 'border-slate-300', text: 'text-slate-800', icon: <Medal className="w-7 h-7 md:w-9 md:h-9 text-slate-200" /> },
      { height: 'h-28 md:h-40', bg: 'from-amber-600 to-orange-800', border: 'border-amber-500', text: 'text-amber-950', icon: <Medal className="w-7 h-7 md:w-9 md:h-9 text-amber-300" /> },
      { height: 'h-20 md:h-28', bg: 'from-emerald-400 to-emerald-600', border: 'border-emerald-400', text: 'text-emerald-900', icon: <Star className="w-6 h-6 md:w-7 md:h-7 text-emerald-200" /> },
      { height: 'h-16 md:h-20', bg: 'from-blue-400 to-blue-600', border: 'border-blue-400', text: 'text-blue-900', icon: <Star className="w-6 h-6 md:w-7 md:h-7 text-blue-200" /> }
    ];

    return (
      <div className="w-full flex justify-center items-end mt-10 mb-8 gap-2 md:gap-4 px-2">
        {top5.map(({ rank, student }) => {
          const style = styles[rank - 1];
          return (
            <div key={student.id} className="flex flex-col items-center justify-end w-[18%] max-w-[140px] relative">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center justify-end w-full pb-3 md:pb-5 z-20">
                <div className="flex flex-col items-center gap-2 w-full">
                  {style.icon}
                  <div className="relative">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-t ${style.bg} border-[3px] md:border-4 ${style.border} flex items-center justify-center text-3xl md:text-4xl shadow-xl z-10 overflow-hidden`}>
                      <span className="relative z-10">{getStudentAvatar(student.name)}</span>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-black px-2.5 py-0.5 rounded-full text-[10px] md:text-xs border-2 border-gray-200 dark:border-slate-600 shadow-md z-30 min-w-[36px] text-center">
                      {student.total_points}
                    </div>
                  </div>
                  <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-1.5 md:px-2 py-1.5 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 w-[190%] sm:w-[170%] max-w-[150px] z-20 flex items-center justify-center mt-1">
                    <p className="font-bold text-gray-800 dark:text-white text-center text-[10px] md:text-xs leading-tight truncate">{student.name}</p>
                  </div>
                </div>
              </div>
              <div className={`w-full rounded-t-xl md:rounded-t-2xl bg-gradient-to-t ${style.bg} shadow-2xl flex items-start justify-center pt-3 md:pt-5 border-t border-x ${style.border} ${style.height}`}>
                <span className={`font-black text-4xl md:text-6xl ${style.text} opacity-40`}>{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAdvancedBoard = (stage: 'PRE' | 'SEC') => {
    const theme = stage === 'SEC' 
      ? { bg: 'from-slate-900 via-slate-800 to-slate-900', accent: 'emerald', danger: 'rose', icon: <Gamepad2 className="w-8 h-8 text-emerald-400" />, title: 'لوحة الأوائل (الثانوية)' } 
      : { bg: 'from-indigo-950 via-purple-900/80 to-indigo-950', accent: 'violet', danger: 'pink', icon: <Trophy className="w-8 h-8 text-violet-400" />, title: 'لوحة الأوائل (الإعدادية)' };
    
    return (
      <div className={`p-4 md:p-8 bg-gradient-to-br ${theme.bg} w-full rounded-3xl text-white shadow-2xl relative overflow-hidden border border-white/10 mt-6`}>
        <div className="max-w-[1400px] mx-auto relative z-10 pt-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-36 md:mb-44 flex justify-center items-center gap-4 text-white/90">
            {theme.icon}{theme.title}
          </h2>
          {renderPodium()}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-12 border-t border-white/10 pt-10">
            {students.map(student => (
              <div key={student.id} className={`relative p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col justify-between ${isDoublePoints && isSpeedRunning ? 'ring-2 ring-yellow-400/50' : ''}`}>
                <div className="flex flex-col items-center mb-4 gap-2 w-full">
                  <div className="text-4xl mb-1">{getStudentAvatar(student.name)}</div>
                  {student.badge && <span className="bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Award className="w-3 h-3" /> {student.badge}</span>}
                  <h3 className="text-sm font-bold text-center text-white/95 truncate w-full">{student.name}</h3>
                  <div className={`bg-${theme.accent}-500/20 border border-${theme.accent}-500/50 rounded-lg px-3 py-1 w-full text-center mt-1`}>
                    <span className="text-xl font-black">{student.total_points || 0} <span className="text-xs font-normal opacity-50">نقطة</span></span>
                  </div>
                </div>
                <div className="space-y-2 mt-auto">
                  <input type="text" placeholder="سبب التقييم..." value={reasons[student.id] || ''} onChange={(e) => setReasons(p => ({ ...p, [student.id]: e.target.value }))} className={`w-full text-[10px] p-2 rounded-md bg-black/30 border border-white/10 text-white text-center outline-none`}/>
                  <div className="flex gap-1">
                    <button onClick={() => handlePointChange(student.id, -1)} className={`py-1.5 px-2 rounded-md bg-${theme.danger}-500/20 text-${theme.danger}-100`}><Minus className="w-4 h-4" /></button>
                    <button onClick={() => handlePointChange(student.id, 1)} className={`flex-1 py-1.5 rounded-md ${(isDoublePoints && isSpeedRunning) ? 'bg-gradient-to-r from-yellow-500 to-amber-600 animate-pulse text-amber-950' : `bg-${theme.accent}-500/30 text-white`} font-bold text-xs flex justify-center items-center gap-1`}><Plus className="w-4 h-4" /> {(isDoublePoints && isSpeedRunning) ? `تقييم (×${pointsMultiplier})` : 'تقييم'}</button>
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
    <div className={`space-y-6 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[300] bg-slate-900 overflow-y-auto p-6' : ''}`} dir="rtl">
      
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button onClick={() => setShowResetMenu(!showResetMenu)} disabled={isProcessing} className="flex items-center gap-2 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 px-4 py-2 rounded-xl font-bold transition-colors text-sm shadow-sm">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} تصفير اللوحة <ChevronDown className="w-3 h-3" />
          </button>
          {showResetMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-red-100 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-3 text-xs font-bold text-red-400 border-b border-gray-100 dark:border-slate-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> مسح النقاط لـ</div>
              {['نهاية الأسبوع', 'نهاية الشهر', 'نهاية العام'].map(lbl => (
                <button key={lbl} onClick={() => handleResetPoints(lbl)} className="w-full text-right p-3 hover:bg-red-50 dark:hover:bg-slate-700 text-sm font-semibold text-red-600 transition-colors">تصفير {lbl.replace('نهاية ال', '')}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {renderMysteryBoxModal()}
      {renderSpeedChallengeModal()}
      {renderCodeModal()}
      {renderRandomizerModal()}
      {renderDraggableTimer()}
      
      {celebration.show && (
        <>
          <CustomConfetti />
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] shadow-2xl border-4 border-indigo-500 text-center animate-in zoom-in-50 duration-300">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-300 to-orange-500 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">🎉</div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">تهانينا!</h1>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{celebration.studentName}</h2>
            </div>
          </div>
        </>
      )}

      {/* شريط الأدوات العلوي */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-20">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3"><Gamepad2 className="text-indigo-600 w-8 h-8" /> النشاط التفاعلي</h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          
          <button onClick={() => setShowMysteryBox(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:scale-[1.02] transition-transform animate-pulse border border-purple-400">
            <Gift className="w-5 h-5 text-yellow-300" /> صندوق المفاجآت
          </button>
          
          <button onClick={() => { setDraftQuestionText(''); setShowSpeedModal(true); fetchQuestionsFromDB(); }} className="flex items-center gap-2 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-4 py-3 rounded-xl font-bold transition-colors">
            <Zap className="w-5 h-5 text-amber-500" /> تحدي النقاط المضاعفة
          </button>

          <button onClick={() => setShowCodeModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3 rounded-xl font-bold shadow-md hover:scale-[1.02] transition-transform">
            <Code className="w-5 h-5 text-white" /> لعبة كودية
          </button>
          
          <button onClick={() => setShowTimerModal(true)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-3 rounded-xl font-bold transition-colors">
            <Timer className="w-5 h-5" /> المؤقت الحر
          </button>
          
          <div className="relative">
            <button onClick={() => setShowRandomMenu(!showRandomMenu)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold shadow-md">
              <Dices className="w-5 h-5" /> عشوائي <ChevronDown className="w-4 h-4" />
            </button>
            {showRandomMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border overflow-hidden z-50">
                <button onClick={() => { setActiveRandomizer('wheel'); setShowRandomMenu(false); }} className="w-full text-right p-3 hover:bg-amber-50 font-bold text-sm flex items-center gap-2"><Aperture className="w-4 h-4 text-amber-500" /> عجلة الحظ</button>
                <button onClick={() => { setActiveRandomizer('slot'); setShowRandomMenu(false); }} className="w-full text-right p-3 hover:bg-amber-50 font-bold text-sm flex items-center gap-2"><ListOrdered className="w-4 h-4 text-amber-500" /> العداد السريع</button>
                <button onClick={() => { setActiveRandomizer('spotlight'); setShowRandomMenu(false); }} className="w-full text-right p-3 hover:bg-amber-50 font-bold text-sm flex items-center gap-2"><Focus className="w-4 h-4 text-amber-500" /> تسليط الضوء</button>
              </div>
            )}
          </div>
          <button onClick={() => { setShowGrouping(!showGrouping); if(!showGrouping) fetchGroupsFromDB(); }} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold ${showGrouping ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
            <Users className="w-5 h-5" /> المجموعات
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors" title="وضع العرض السينمائي">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {!isFullscreen && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-black ml-4"><Filter className="w-5 h-5" /> تحديد الفصل:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <select value={filters.stage} onChange={e => setFilters({ stage: e.target.value, grade: schoolStructure[e.target.value as keyof typeof schoolStructure].years[0], section: 'A' })} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 dark:bg-slate-900 font-bold outline-none">
              {Object.entries(schoolStructure).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filters.grade} onChange={e => setFilters(p => ({ ...p, grade: e.target.value }))} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 dark:bg-slate-900 font-bold outline-none">
              {schoolStructure[filters.stage as keyof typeof schoolStructure]?.years.map(g => <option key={g} value={g}>الصف {g}</option>)}
            </select>
            <select value={filters.section} onChange={e => setFilters(p => ({ ...p, section: e.target.value }))} className="py-3 px-4 rounded-xl border-2 bg-indigo-50 dark:bg-slate-900 font-bold outline-none">
               {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>شعبة {s}</option>)}
            </select>
          </div>
        </div>
      )}

      {showGrouping && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="text-indigo-500 w-8 h-8" /> المجموعات التفاعلية
              </h3>
              {groups.length > 0 && (
                hasUnsavedGroups ? (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">⚠️ بانتظار الحفظ في السحابة</span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> محفوظة بحسابك</span>
                )
              )}
            </div>

            {groups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hasUnsavedGroups && (
                  <button onClick={handleSaveGroupsToDB} disabled={isSavingGroups} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all transform hover:scale-105">
                    {isSavingGroups ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ المجموعات في السحابة
                  </button>
                )}
                <button onClick={handleResetGroupPoints} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"><Eraser className="w-4 h-4" /> تصفير النقاط</button>
                <button onClick={handleClearGroups} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"><Trash2 className="w-4 h-4" /> حذف المجموعات</button>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-slate-700">
            <div className="w-full lg:w-1/3">
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">عدد المجموعات</label>
              <input type="number" min="2" max="10" value={groupCount} onChange={e => setGroupCount(Number(e.target.value) || 2)} className="w-full py-3 px-4 rounded-xl border-2 bg-white dark:bg-slate-800 font-bold focus:border-indigo-400 outline-none" />
            </div>
            <div className="w-full lg:w-1/3">
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">نوع المجموعات</label>
              <select value={groupType} onChange={e => setGroupType(e.target.value as any)} className="w-full py-3 px-4 rounded-xl border-2 bg-white dark:bg-slate-800 font-bold focus:border-indigo-400 outline-none">
                <option value="mixed">مختلط</option>
                <option value="boys">بنين فقط</option>
                <option value="girls">بنات فقط</option>
              </select>
            </div>
            <div className="w-full lg:w-1/3 flex gap-2">
              <button onClick={handleGenerateGroups} disabled={isGeneratingGroups} className="flex-1 py-3 px-4 bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50">
                {isGeneratingGroups ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} 
                {isGeneratingGroups ? 'جاري السحب والتوزيع...' : groups.length > 0 ? 'إعادة توزيع عشوائي' : 'إنشاء وتوزيع عشوائي'}
              </button>
            </div>
          </div>

          {groups.length > 0 && (
            <div className={`mt-8 mb-10 p-6 md:p-8 rounded-3xl shadow-lg border relative overflow-hidden transition-all duration-500 ${getRaceTheme().container}`}>
              <h3 className={`text-2xl font-black mb-8 text-center flex items-center justify-center gap-3 ${getRaceTheme().title}`}><Flag className="w-7 h-7" /> مضمار سباق المجموعات</h3>
              <div className="space-y-6">
                {groups.map((g, idx) => {
                  const maxPoints = Math.max(10, ...groups.map(group => group.points));
                  const progress = Math.min((g.points / maxPoints) * 100, 100);
                  const theme = getRaceTheme();
                  const groupIcons = ['🏎️', '🚀', '🚁', '🚤', '🏍️', '🛸', '🚜', '🚕', '🚙', '🚓'];
                  return (
                    <div key={`race-${g.id}`} className="flex items-center gap-3 md:gap-5 relative">
                      <div className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-md border ${theme.box}`}>{g.letter}</div>
                      <div className={`flex-1 h-6 md:h-8 rounded-full relative overflow-visible ${theme.track}`}>
                        <div className={`absolute top-0 bottom-0 right-0 rounded-full transition-all duration-1000 ease-out ${theme.fill}`} style={{ width: `${progress}%` }}>
                          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 text-3xl md:text-4xl filter drop-shadow-lg z-10 transform hover:scale-125 transition-transform cursor-pointer">{groupIcons[idx % groupIcons.length]}</div>
                        </div>
                      </div>
                      <div className={`w-16 flex-shrink-0 text-left font-black text-lg md:text-xl ${theme.text}`}>{g.points} <span className="text-[10px] md:text-xs opacity-70 font-normal">نقطة</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {groups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.map((g) => (
                <div key={g.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                    <h4 className="font-black text-lg flex items-center gap-2">مجموعة <span className="bg-white text-indigo-700 w-6 h-6 flex items-center justify-center rounded-md text-sm">{g.letter}</span></h4>
                  </div>
                  <div className="flex p-2 gap-2 bg-indigo-50/50 dark:bg-slate-900/50 border-b">
                    <button onClick={() => handleGroupPointChange(g.id, 1)} className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-sm transition-colors ${(isDoublePoints && isSpeedRunning) ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}><Plus className="w-4 h-4" /> {(isDoublePoints && isSpeedRunning) ? `إضافة (×${pointsMultiplier})` : 'إضافة'}</button>
                    <button onClick={() => handleGroupPointChange(g.id, -1)} className="w-12 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                  </div>
                  <div className="p-3 overflow-y-auto max-h-48 flex-1 bg-gray-50/50 dark:bg-slate-800">
                    <ul className="space-y-1.5">
                      {g.students.map(s => (
                        <li key={s.id} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                          <span className="text-xl">{getStudentAvatar(s.name)}</span>
                          <span className="truncate">{s.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filters.stage === 'Primary' ? (
        <div className="p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 rounded-3xl shadow-inner border border-indigo-100 dark:border-slate-700 relative overflow-hidden mt-6">
          <h2 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 text-center flex justify-center gap-3 mt-8 mb-36 md:mb-44">
            <Star className="w-8 h-8 text-indigo-500 animate-pulse fill-indigo-500" /> لوحة الطلاب الأوائل (المرحلة الابتدائية)
          </h2>
          {renderPodium()}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[1400px] mx-auto mt-12 border-t-2 border-dashed border-indigo-200 dark:border-slate-700 pt-10">
            {students.map(student => (
              <div key={student.id} className={`flex flex-col items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-[2rem] shadow-lg border transition-all ${isDoublePoints && isSpeedRunning ? 'ring-2 ring-yellow-400 scale-[1.02]' : ''}`}>
                <div className="text-center w-full mb-3 flex flex-col items-center">
                  <div className="text-4xl mb-2">{getStudentAvatar(student.name)}</div>
                  {student.badge && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold mb-1 flex items-center gap-1"><Award className="w-3 h-3" /> {student.badge}</span>}
                  <h3 className="text-sm font-black text-gray-800 dark:text-white truncate w-full">{student.name}</h3>
                  <div className="mt-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-full text-indigo-700 dark:text-indigo-300 font-bold text-sm">{student.total_points || 0} نقطة</div>
                </div>
                {!isFullscreen && (
                  <div className="w-full flex flex-col gap-2 mt-auto">
                    <input type="text" placeholder="سبب التقييم..." value={reasons[student.id] || ''} onChange={e => setReasons(p => ({ ...p, [student.id]: e.target.value }))} className="w-full text-[10px] p-2 rounded-xl bg-white dark:bg-slate-900 text-center outline-none border border-gray-200 dark:border-slate-600 focus:border-indigo-400"/>
                    <div className="flex gap-1">
                      <button onClick={() => handlePointChange(student.id, -1)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-1.5 rounded-xl transition-colors"><Minus className="w-4 h-4 mx-auto" /></button>
                      <button onClick={() => handlePointChange(student.id, 1)} className={`flex-[2] py-1.5 rounded-xl font-bold text-xs flex justify-center items-center gap-1 transition-colors ${(isDoublePoints && isSpeedRunning) ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 animate-pulse' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}><Plus className="w-4 h-4" /> {(isDoublePoints && isSpeedRunning) ? `إضافة (×${pointsMultiplier})` : 'إضافة'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : renderAdvancedBoard(schoolStructure[filters.stage as keyof typeof schoolStructure].code as 'PRE' | 'SEC')}
    </div>
  );
};

export default TeacherClassroomActivity;