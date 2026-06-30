import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Atom, Dna, UserCircle2, KeyRound, Sparkles, Eye, EyeOff, Languages } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // حالة رؤية الباسورد التحكم بالعين
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isRtl = i18n.language === 'ar';

  // استرجاع اسم المستخدم المحفوظ عند تحميل الصفحة
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // دالة تبديل اللغة وتغيير الكلاسات المصاحبة
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || !password) {
      setErrorMessage(t('login_error_empty'));
      return;
    }

    try {
      setIsLoading(true);
      const success = await login(username, password);
      
      if (success) {
        // حفظ أو مسح اسم المستخدم بناءً على خيار "تذكرني"
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        setIsLoading(false);
        navigate('/');
      } else {
        setIsLoading(false);
        setErrorMessage(t('login_error_invalid'));
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(t('login_error_unexpected'));
    }
  };

  return (
    <div 
      className="relative min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden font-sans selection:bg-blue-500/30" 
      style={{ backgroundImage: "url('/2.jpg')" }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* طبقة داكنة خفيفة (Overlay) فوق الصورة لضمان وضوح النص والتأثير الزجاجي */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      
      {/* مؤثرات الإضاءة الخلفية المدمجة لتعطي ألواناً متداخلة مع صورتك */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-700/10 rounded-full mix-blend-screen filter blur-[120px] animate-[pulse_8s_ease-in-out_infinite] delay-700"></div>

      {/* زر اختيار اللغة العلوي ذو تصميم زجاجي أنيق متناسق مع الواجهة ويتغير موقعه حسب الاتجاه تلقائياً */}
      <div className={cn("absolute top-6 z-20", isRtl ? "left-6" : "right-6")}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all backdrop-blur-md shadow-md active:scale-95"
        >
          <Languages className="w-4 h-4 text-cyan-400" />
          <span>{isRtl ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* الحاوية الزجاجية الشفافة (Glassmorphism Card) */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-[2.5rem] p-1 overflow-hidden bg-gradient-to-br from-white/10 to-transparent shadow-[0_12px_40px_0_rgba(0,0,0,0.6)] backdrop-blur-3xl border border-white/10 transition-all duration-500">
        <div className="bg-[#0a1122]/75 w-full h-full rounded-[2.4rem] p-8 md:p-12">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* اللوجو والأيقونات المتحركة */}
            <div className="text-center mb-10">
              <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-white/5 rounded-full border border-white/10 shadow-inner">
                <Atom className="w-10 h-10 text-blue-400 animate-[spin_15s_linear_infinite]" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Dna className="w-5 h-5 text-cyan-300" strokeWidth={2} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{t('login_title')}</h2>
              <p className="text-gray-300 text-sm mt-2">{t('login_subtitle')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {errorMessage && (
                <div className="p-4 rounded-xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {errorMessage}
                </div>
              )}

              {/* حقل اسم المستخدم (Floating Label المطور - يدعم اللغتين والاتجاهين) */}
              <div className="relative group">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn(
                    "peer w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-5 pt-4 pb-1 text-white text-lg focus:bg-black/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all duration-300 shadow-inner",
                    isRtl ? "text-right" : "text-left"
                  )}
                  placeholder=" " 
                />
                <label 
                  htmlFor="username" 
                  className={cn(
                    "absolute flex items-center gap-2 text-gray-400 cursor-text transition-all duration-300 peer-placeholder-shown:text-base peer-focus:text-xs peer-focus:text-blue-400 text-xs",
                    isRtl 
                      ? "right-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2 origin-right" 
                      : "left-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2 origin-left"
                  )}
                >
                  <UserCircle2 className="w-4 h-4" />
                  {t('username')}
                </label>
              </div>

              {/* حقل كلمة المرور (Floating Label المطور - يدعم اللغتين والتحكم في الإخفاء والإظهار) */}
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "peer w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-5 pt-4 pb-1 text-white text-lg focus:bg-black/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all duration-300 shadow-inner",
                    isRtl ? "text-right" : "text-left"
                  )}
                  placeholder=" "
                />
                <label 
                  htmlFor="password" 
                  className={cn(
                    "absolute flex items-center gap-2 text-gray-400 cursor-text transition-all duration-300 peer-placeholder-shown:text-base peer-focus:text-xs peer-focus:text-blue-400 text-xs",
                    isRtl 
                      ? "right-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2 origin-right" 
                      : "left-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2 origin-left"
                  )}
                >
                  <KeyRound className="w-4 h-4" />
                  {t('password')}
                </label>
              </div>

              {/* خيار تذكر بياناتي + الزر البديل التفاعلي لرؤية الباسورد وتحريك العين */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group/cb">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded bg-white/10 border border-white/20 group-hover/cb:border-blue-400 transition-colors">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="absolute inset-0 bg-blue-500 rounded scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover/cb:text-white transition-colors">
                    {t('remember_me')}
                  </span>
                </label>
                
                {/* زر إظهار وإخفاء الباسورد البديل لأيقونة نسيت الرمز */}
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-all active:scale-95"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? t('hide_password') : t('show_password')}</span>
                </button>
              </div>

              {/* زر الدخول الاحترافي */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-14 mt-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center justify-center gap-2 h-full">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('verifying')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('login_btn')}
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}