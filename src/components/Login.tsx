import React, { useState, useEffect, useRef } from 'react';
// 🆕 استدعاء supabase و directLogin
import { useAuth, supabase } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Atom, Dna, UserCircle2, KeyRound, Sparkles, Eye, EyeOff, Languages, QrCode, ScanLine, ArrowLeft, MonitorSmartphone } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { initSocket } from './auth-socket/socketHandler'; 
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Login() {
  const { t, i18n } = useTranslation();
  // 🆕 استخراج directLogin من الكونتيكست
  const { login, user, directLogin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [authView, setAuthView] = useState<'standard' | 'show_qr' | 'scan_qr'>('standard');
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);

  const isRtl = i18n.language === 'ar';
  
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // 🆕 الاعتماد على Supabase Realtime بدلاً من السوكت
  useEffect(() => {
    let channel: any = null;

    if (authView === 'show_qr') {
      // 1. توليد كود محلي فريد
      const localSessionId = Math.random().toString(36).substring(7);
      setQrSessionId(localSessionId);

      // 2. إنشاء السجل في Supabase
      supabase.from('qr_sessions').insert([{ session_id: localSessionId, status: 'pending' }]).then();

      // 3. الاستماع لأي تحديثات على هذا الكود (عندما يمسحه الموبايل)
      channel = supabase
        .channel(`qr_${localSessionId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'qr_sessions', filter: `session_id=eq.${localSessionId}` },
          async (payload) => {
            if (payload.new.status === 'linked' && payload.new.user_id) {
              console.log("تم المسح بنجاح! جاري جلب بيانات المدرس...");
              
              // جلب بيانات المدرس من قاعدة البيانات
              const { data } = await supabase.from('users').select('*').eq('employeeCode', payload.new.user_id).maybeSingle();
              
              if (data) {
                const userData = {
                  id: String(data.id),
                  employeeCode: data.employeeCode,
                  name: data.name,
                  role: data.role as any,
                  isActive: true,
                  subject: data.subject,
                  grade: data.grade,
                  assignedClasses: data.assignedClasses
                };
                
                // تسجيل الدخول وتوجيه البورد للرئيسية
                directLogin(userData);
                navigate('/');
              }
            }
          }
        )
        .subscribe();

    } else {
      setQrSessionId(null);
    }

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [authView, navigate, directLogin]);

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
      style={{ backgroundImage: "url('/2_3.jpg')" }} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-700/10 rounded-full mix-blend-screen filter blur-[120px] animate-[pulse_8s_ease-in-out_infinite] delay-700"></div>

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

      <div className="relative z-10 w-full max-w-lg mx-4 rounded-[2.5rem] p-1 overflow-hidden bg-gradient-to-br from-white/10 to-transparent shadow-[0_12px_40px_0_rgba(0,0,0,0.6)] backdrop-blur-3xl border border-white/10 transition-all duration-500">
        
        <div className="bg-[#0a1122]/75 w-full h-full min-h-[600px] rounded-[2.4rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-center">
          
          <div className={cn("transition-all duration-500 w-full", authView === 'standard' ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full hidden")}>
            
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
                
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-all active:scale-95"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? t('hide_password') : t('show_password')}</span>
                </button>
              </div>

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

            <div className="mt-6">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  {isRtl ? 'أو الدخول الذكي' : 'OR SMART LOGIN'}
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setAuthView('show_qr')}
                  className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-300 active:scale-95 group"
                >
                  <QrCode className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">{isRtl ? 'عرض كود السبورة' : 'Show Board Code'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setAuthView('scan_qr')}
                  className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-300 active:scale-95 group"
                >
                  <ScanLine className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">{isRtl ? 'مسح بالكاميرا' : 'Scan via Camera'}</span>
                </button>
              </div>
            </div>
            
          </div>

          {/* الواجهة الثانية: عرض كود الـ QR */}
          {authView === 'show_qr' && (
            <div className="absolute inset-0 bg-[#0a1122]/95 p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 z-20 rounded-[2.4rem]">
              <button 
                onClick={() => setAuthView('standard')}
                className={cn("absolute top-6 p-2 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-all", isRtl ? "right-6" : "left-6")}
              >
                <ArrowLeft className={cn("w-6 h-6", isRtl && "rotate-180")} />
              </button>
              
              <MonitorSmartphone className="w-12 h-12 text-cyan-400 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">{isRtl ? 'تسجيل دخول للسبورة' : 'Board Login'}</h3>
              <p className="text-gray-400 text-sm text-center mb-8 max-w-[250px]">
                {isRtl ? 'افتح تطبيق SOP Hub من هاتفك وقم بمسح هذا الكود للدخول فوراً.' : 'Open SOP Hub on your phone and scan this code.'}
              </p>
              
              <div className="w-64 h-64 bg-white rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)] relative">
                {qrSessionId ? (
                  <>
                    <QRCodeSVG value={qrSessionId} size={190} level={"H"} includeMargin={false} />
                    <span className="text-black font-bold text-xs bg-gray-200 px-2 py-1 rounded mt-3">كود: {qrSessionId}</span>
                  </>
                ) : (
                  <span className="text-black font-bold text-sm animate-pulse">{isRtl ? 'جاري جلب الكود...' : 'Fetching Code...'}</span>
                )}
              </div>
            </div>
          )}

          {/* الواجهة الثالثة: مسح كود الـ QR (ميزة إضافية) */}
          {authView === 'scan_qr' && (
            <div className="absolute inset-0 bg-[#0a1122]/95 p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 z-20 rounded-[2.4rem]">
              <button 
                onClick={() => setAuthView('standard')}
                className={cn("absolute top-6 p-2 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white transition-all z-30", isRtl ? "right-6" : "left-6")}
              >
                <ArrowLeft className={cn("w-6 h-6", isRtl && "rotate-180")} />
              </button>
              
              <ScanLine className="w-12 h-12 text-blue-400 mb-4 z-30" />
              <h3 className="text-2xl font-bold text-white mb-2 z-30">{isRtl ? 'الكاميرا قيد التشغيل' : 'Camera Active'}</h3>
              <p className="text-gray-400 text-sm text-center mb-8 max-w-[250px] z-30">
                {isRtl ? 'وجه الكاميرا نحو كود السمارت بورد ليتم ربط الجلسة تلقائياً.' : 'Point your camera at the smart board code to link session.'}
              </p>
              
              <div className="relative w-full max-w-[320px] aspect-square rounded-[2rem] border-2 border-dashed border-blue-500/50 flex items-center justify-center overflow-hidden bg-black/60 shadow-inner">
                
                <Scanner
                  onScan={async (result) => {
                    if (result && result.length > 0) {
                      const scannedSessionId = result[0].rawValue;
                      if (user?.employeeCode) {
                        // 🆕 تحديث Supabase بدلاً من السوكت
                        await supabase.from('qr_sessions').update({ 
                          status: 'linked', 
                          user_id: user.employeeCode 
                        }).eq('session_id', scannedSessionId);
                      }
                      setAuthView('standard');
                    }
                  }}
                  components={{ onOff: false, torch: false, zoom: false, finder: false }}
                  styles={{ container: { width: '100%', height: '100%' } }}
                />

                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-[pulse_2s_ease-in-out_infinite] translate-y-[150px] pointer-events-none z-10"></div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}