import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth-context';
import { ShieldCheck, Database, Cpu, Activity, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function WelcomeOverlay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  if (!user || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(25px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.8, ease: 'easeInOut' } }}
        className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#020617]/80 font-sans"
        dir={document.documentElement.dir}
      >
        {/* إضاءات خلفية سيبرانية ناعمة */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, 90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[150px]"
        />

        {/* الكرت الزجاجي الاحترافي */}
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.95, transition: { duration: 0.5 } }}
          transition={{ type: "spring", damping: 25, stiffness: 150 }}
          className="relative z-10 w-full max-w-lg p-[1px] rounded-[2.5rem] bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)]"
        >
          <div className="relative bg-[#0b1221]/80 backdrop-blur-3xl p-12 rounded-[2.5rem] text-center w-full border border-white/5 overflow-hidden">
            
            {/* الأيقونة المركزية (Corporate Logic) */}
            <div className="relative w-28 h-28 mx-auto mb-10 flex items-center justify-center">
              {/* حلقات دوارة احترافية */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-blue-500/30 rounded-full border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border border-indigo-400/20 rounded-full"
              />
              
              {/* أيقونة المعالج/النظام */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              >
                <Server className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
              </motion.div>
            </div>
            
            {/* نصوص الترحيب */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 space-y-3"
            >
              <h2 className="text-3xl font-black text-white tracking-tight">
                {t('welcome_back')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 drop-shadow-lg">{user.name}</span>
              </h2>
              
              <div className="flex items-center justify-center gap-2 text-slate-400 font-medium text-xs tracking-widest uppercase">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{t('syncing_data')}</span>
              </div>
            </motion.div>

            {/* شريط التحميل السيبراني */}
            <div className="relative mt-12">
              <div className="flex justify-between text-[10px] text-slate-500 mb-2 px-1 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t('auth_status')}</span>
                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-blue-400" /> {t('sync_status')}</span>
              </div>

              <div className="h-1 bg-slate-800 rounded-full w-full overflow-hidden relative shadow-inner">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-indigo-400 to-cyan-400 origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3.8, ease: "easeInOut" }}
                >
                  <motion.div 
                    className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent filter blur-[1px]"
                    animate={{ x: ['100%', '-400%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
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