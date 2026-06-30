import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth-context';
import { Atom, Dna, Database, ShieldCheck, Activity } from 'lucide-react';

export default function WelcomeOverlay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // منطق المؤقت الزمني (بقي كما هو تماماً دون تعديل)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!user || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.8, ease: 'easeInOut' } }}
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#050b14]/80 font-sans"
        dir="rtl"
      >
        {/* 1. مؤثرات الإضاءة الخلفية (Glowing Orbs) */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[25%] w-[400px] h-[400px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] left-[25%] w-[500px] h-[500px] bg-cyan-700/20 rounded-full mix-blend-screen filter blur-[120px]"
        />

        {/* 2. الكرت الزجاجي الرئيسي (Glassmorphism Card) */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9, rotateX: 15 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ y: -50, opacity: 0, scale: 0.9, transition: { duration: 0.6 } }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{ perspective: 1000 }}
          className="relative z-10 w-full max-w-lg p-[1px] rounded-[3rem] bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
        >
          <div className="relative bg-[#0a1122]/90 backdrop-blur-3xl p-12 rounded-[3rem] text-center w-full border border-white/10 overflow-hidden">
            
            {/* زخرفة خلفية داخلية للكرت */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
            
            {/* 3. العنصر المركزي المتحرك (Science Hub) */}
            <div className="relative w-32 h-32 mx-auto mb-10 flex items-center justify-center">
              {/* هالة مضيئة خلف الأيقونة */}
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-500/30 rounded-full filter blur-xl"
              />
              
              {/* أيقونة الذرة (تدور بشكل مستمر) */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute"
              >
                <Atom className="w-28 h-28 text-blue-400/80" strokeWidth={1} />
              </motion.div>

              {/* أيقونة الـ DNA النبضية في المنتصف */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.5 }}
                className="relative z-10 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl p-4 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
              >
                <Dna className="w-10 h-10 text-white" strokeWidth={2} />
              </motion.div>
            </div>
            
            {/* 4. النصوص والترحيب */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 space-y-4"
            >
              <h2 className="text-4xl font-black text-white tracking-tight">
                مرحباً بك، <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 drop-shadow-sm">{user.name}</span>
              </h2>
              
              <div className="flex items-center justify-center gap-2 text-cyan-200/70 font-medium text-sm tracking-widest uppercase">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>جاري تأسيس الاتصال الآمن بالسحابة...</span>
              </div>
            </motion.div>

            {/* 5. شريط التحميل الاحترافي (Data Sync Bar) */}
            <div className="relative mt-12">
              {/* أيقونات جانبية توضح حالة التحميل */}
              <div className="flex justify-between text-xs text-slate-500 mb-2 px-1 font-mono">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Auth</span>
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-blue-400" /> Syncing</span>
              </div>

              {/* مسار الشريط */}
              <div className="h-1.5 bg-white/5 rounded-full w-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                {/* الشريط المتحرك الأساسي */}
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 origin-right"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                >
                  {/* لمعة متحركة فوق الشريط */}
                  <motion.div 
                    className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent filter blur-[2px]"
                    animate={{ x: ['100%', '-500%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}