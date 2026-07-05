import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  BookOpen, 
  FileText, 
  Copy, 
  CheckCircle2, 
  BookMarked,
  LayoutTemplate,
  MessageSquareShare,
  Languages
} from 'lucide-react';
import toast from 'react-hot-toast'; 

export default function TeacherDailyLessonPost() {
  const { user } = useAuth(); 
  
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [unit, setUnit] = useState('');
  const [lessonNumber, setLessonNumber] = useState('');
  const [title, setTitle] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [bookPages, setBookPages] = useState('');
  const [bookletPages, setBookletPages] = useState('');
  const [homework, setHomework] = useState('');

  // قاموس الترجمة
  const t = {
    ar: {
      headerTitle: "التقرير اليومي للدرس",
      headerDesc: "صمم تقريرك بذكاء. الحقول الفارغة لن تظهر في الرسالة النهائية.",
      topicLabel: "عنوان الدرس (Topic)",
      topicPlaceholder: "مثال: The Solar System",
      unitLabel: "رقم الوحدة (Unit)",
      lessonLabel: "رقم الدرس (Lesson)",
      optional: "(اختياري)",
      keyPointsLabel: "النقاط التي تم شرحها (Key Points)",
      keyPointsPlaceholder: "اكتب كل نقطة في سطر جديد...",
      bookLabel: "كتاب الوزارة",
      bookletLabel: "البوكليت",
      pagesPlaceholder: "Pages (e.g. 15-18)",
      bookletPlaceholder: "Pages (e.g. 30, 31)",
      hwLabel: "الواجب المنزلي (Homework)",
      hwPlaceholder: "اتركه فارغاً إذا لم يكن هناك واجب...",
      copyBtn: "نسخ النص",
      shareBtn: "مشاركة واتساب",
      titleError: "يرجى كتابة عنوان الدرس أولاً لتوليد التقرير",
      copySuccess: "تم نسخ التقرير بنجاح! يمكنك لصقه في أي مكان.",
      defaultKeyPoint: "(مراجعة عامة / نشاط صفي)",
      missingTitle: "[عنوان الدرس لم يكتب]"
    },
    en: {
      headerTitle: "Daily Lesson Report",
      headerDesc: "Design your report smartly. Empty fields won't appear.",
      topicLabel: "Lesson Topic",
      topicPlaceholder: "e.g., The Solar System",
      unitLabel: "Unit Number",
      lessonLabel: "Lesson Number",
      optional: "(Optional)",
      keyPointsLabel: "Covered Key Points",
      keyPointsPlaceholder: "Write each point on a new line...",
      bookLabel: "Ministry Book",
      bookletLabel: "Booklet",
      pagesPlaceholder: "Pages (e.g. 15-18)",
      bookletPlaceholder: "Pages (e.g. 30, 31)",
      hwLabel: "Homework",
      hwPlaceholder: "Leave blank if no homework...",
      copyBtn: "Copy Text",
      shareBtn: "Share to WhatsApp",
      titleError: "Please enter the lesson topic first.",
      copySuccess: "Report copied successfully!",
      defaultKeyPoint: "(General Revision / Class Activity)",
      missingTitle: "[Topic not provided]"
    }
  };

  const currentT = t[lang];

  const generatePostText = () => {
    const today = new Date().toLocaleDateString('en-GB'); 
    const teacherName = user?.name || 'Teacher';

    let text = `📢 *Daily Lesson Update*\n`;
    text += `👨‍🏫 *Teacher:* ${teacherName}\n`;
    text += `📅 *Date:* ${today}\n\n`;

    text += `📚 *Topic:* ${title ? title : currentT.missingTitle}\n`;

    if (unit || lessonNumber) {
      const u = unit ? `Unit ${unit}` : '';
      const l = lessonNumber ? `Lesson ${lessonNumber}` : '';
      const separator = (unit && lessonNumber) ? ', ' : '';
      text += `🔖 *(${u}${separator}${l})*\n`;
    }

    text += `\n🎯 *Today we covered:*\n`;
    if (keyPoints.trim()) {
      text += keyPoints.split('\n').filter(p => p.trim() !== '').map(p => `• ${p}`).join('\n');
    } else {
      text += `• ${currentT.defaultKeyPoint}`; 
    }
    text += `\n\n`;

    if (bookPages.trim() || bookletPages.trim()) {
      text += `📖 *Classwork:*\n`;
      if (bookPages.trim()) text += `📗 Ministry Book: Pages ${bookPages}\n`;
      if (bookletPages.trim()) text += `📘 Booklet: Pages ${bookletPages}\n`;
      text += `\n`;
    }

    if (homework.trim()) {
      text += `📝 *Homework:*\n${homework}\n\n`;
    }

    text += `*Keep up the great work!* 🌟`;
    
    return text.trim();
  };

  const handleWhatsAppShare = () => {
    if (!title.trim()) {
      toast.error(currentT.titleError, { icon: '⚠️' });
      return;
    }
    const text = encodeURIComponent(generatePostText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePostText());
    toast.success(currentT.copySuccess, { icon: '📋' });
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  return (
    <div className="w-full max-w-7xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 rounded-2xl">
            <LayoutTemplate className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{currentT.headerTitle}</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
              {currentT.headerDesc}
            </p>
          </div>
        </div>
        
        {/* زر تغيير اللغة */}
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Languages className="w-5 h-5 text-indigo-500" />
          {lang === 'ar' ? 'English' : 'عربي'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* نموذج إدخال البيانات */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md">
          <div className="space-y-6">
            
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                {currentT.topicLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={currentT.topicPlaceholder}
                className={`w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner ${lang === 'ar' ? 'text-right dir-rtl' : 'text-left dir-ltr'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <BookMarked className="w-4 h-4 text-indigo-500" />
                  {currentT.unitLabel} <span className="text-gray-400 text-xs font-normal">{currentT.optional}</span>
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dir-ltr text-left"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  {currentT.lessonLabel} <span className="text-gray-400 text-xs font-normal">{currentT.optional}</span>
                </label>
                <input
                  type="text"
                  value={lessonNumber}
                  onChange={(e) => setLessonNumber(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dir-ltr text-left"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {currentT.keyPointsLabel}
              </label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder={currentT.keyPointsPlaceholder}
                rows={4}
                className={`w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none custom-scrollbar shadow-inner ${lang === 'ar' ? 'text-right dir-rtl' : 'text-left dir-ltr'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {currentT.bookLabel} <span className="text-gray-400 text-xs font-normal">{currentT.optional}</span>
                </label>
                <input
                  type="text"
                  value={bookPages}
                  onChange={(e) => setBookPages(e.target.value)}
                  placeholder={currentT.pagesPlaceholder}
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dir-ltr text-left"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {currentT.bookletLabel} <span className="text-gray-400 text-xs font-normal">{currentT.optional}</span>
                </label>
                <input
                  type="text"
                  value={bookletPages}
                  onChange={(e) => setBookletPages(e.target.value)}
                  placeholder={currentT.bookletPlaceholder}
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dir-ltr text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {currentT.hwLabel} <span className="text-gray-400 text-xs font-normal">{currentT.optional}</span>
              </label>
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder={currentT.hwPlaceholder}
                rows={2}
                className={`w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none custom-scrollbar shadow-inner ${lang === 'ar' ? 'text-right dir-rtl' : 'text-left dir-ltr'}`}
              />
            </div>

          </div>
        </div>

        {/* كارت المعاينة وشاشة العرض */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#e5ddd5] dark:bg-[#0b141a] rounded-[2.5rem] p-5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.1)] relative overflow-hidden flex-1 min-h-[450px] border-[6px] border-white dark:border-slate-800">
            <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05] bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png')] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')]" />
            
            <div className="relative z-10 bg-white dark:bg-[#005c4b] rounded-2xl rounded-tl-none p-4 shadow-sm ml-2 mt-2 w-[92%] float-left border border-gray-100 dark:border-transparent" dir="ltr">
              <pre className="whitespace-pre-wrap font-sans text-[14.5px] text-gray-800 dark:text-[#e9edef] leading-relaxed">
                {generatePostText()}
              </pre>
              <div className="text-[11px] text-gray-400 dark:text-gray-300/70 text-right mt-1.5 flex justify-end items-center gap-1">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span className="text-blue-500 dark:text-blue-400">✓✓</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-auto">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl font-bold transition-all active:scale-95 hover:shadow-md"
            >
              <Copy className="w-5 h-5" />
              {currentT.copyBtn}
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:to-[#188c43] text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-500/20"
            >
              <MessageSquareShare className="w-5 h-5" />
              {currentT.shareBtn}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}