import React, { useState, useEffect, useRef } from 'react';
import { useAuth, supabase } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Atom, Dna, UserCircle2, KeyRound, Sparkles, Eye, EyeOff, Languages, QrCode, ScanLine, ArrowLeft, MonitorSmartphone, HelpCircle } from 'lucide-react';
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
  const { login, user, directLogin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [authView, setAuthView] = useState<'standard' | 'show_qr' | 'scan_qr' | 'forgot_password'>('standard');
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);

  const [resetEmpCode, setResetEmpCode] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

  const isRtl = i18n.language === 'ar';
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let channel: any = null;
    let timeoutId: NodeJS.Timeout;
    let currentSessionId: string | null = null;

    if (authView === 'show_qr') {
      currentSessionId = Math.random().toString(36).substring(7);
      setQrSessionId(currentSessionId);

      supabase.from('qr_sessions').insert([{ session_id: currentSessionId, status: 'pending' }]).then();

      channel = supabase
        .channel(`qr_${currentSessionId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'qr_sessions', filter: `session_id=eq.${currentSessionId}` },
          async (payload) => {
            if (payload.new.status === 'linked' && payload.new.user_id) {
              const { data } = await supabase.from('users').select('*').eq('employeeCode', payload.new.user_id).maybeSingle();
              
              if (data) {
                if (data.isActive === false) {
                  setErrorMessage(isRtl ? 'هذا الحساب معطل، يرجى مراجعة الإدارة.' : 'Account disabled, contact admin.');
                  setAuthView('standard');
                  return;
                }
                const userData = {
                  id: String(data.id), employeeCode: data.employeeCode, name: data.name, role: data.role as any,
                  isActive: data.isActive, subject: data.subject, grade: data.grade, assignedClasses: data.assignedClasses
                };
                await supabase.from('qr_sessions').delete().eq('session_id', currentSessionId);
                directLogin(userData);
                
                if (!data.security_question && data.role !== 'DEVELOPER') {
                  navigate('/setup-security');
                } else {
                  navigate('/');
                }
              }
            }
          }
        ).subscribe();

      timeoutId = setTimeout(() => setAuthView('standard'), 180000);
    } else {
      setQrSessionId(null);
    }

    return () => { 
      if (channel) supabase.removeChannel(channel); 
      if (timeoutId) clearTimeout(timeoutId);
      if (currentSessionId) supabase.from('qr_sessions').delete().eq('session_id', currentSessionId).then();
    };
  }, [authView, navigate, directLogin, isRtl]);

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');

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
        if (rememberMe) localStorage.setItem('remembered_username', username);
        else localStorage.removeItem('remembered_username');

        const { data: userData } = await supabase
          .from('users')
          .select('security_question, role')
          .eq('employeeCode', username.trim().toUpperCase())
          .maybeSingle();

        setIsLoading(false);

        if (userData && !userData.security_question && userData.role !== 'DEVELOPER') {
          navigate('/setup-security');
        } else {
          navigate('/');
        }
      } else {
        setIsLoading(false);
        setErrorMessage(t('login_error_invalid'));
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(t('login_error_unexpected'));
    }
  };

  const handleCheckEmployeeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage({ text: '', type: '' });
    setIsLoading(true);

    try {
      const { data, error } = await supabase.from('users').select('id, security_question, role').eq('employeeCode', resetEmpCode.trim().toUpperCase()).maybeSingle();

      if (error || !data) {
        setResetMessage({ text: isRtl ? 'لم يتم العثور على موظف بهذا الكود.' : 'Employee code not found.', type: 'error' });
      } else if (data.role === 'DEVELOPER') {
        setResetUserId(data.id);
        setSecurityQuestion(isRtl ? 'أنت مطور النظام، يمكنك تغيير كلمة المرور مباشرة.' : 'You are a developer, reset directly.');
        setSecurityAnswer('DEV_BYPASS');
        setResetStep(2);
      } else if (!data.security_question) {
        setResetMessage({ text: isRtl ? 'لم تقم بإعداد سؤال أمان مسبقاً، يرجى مراجعة المطور.' : 'No security question set, contact admin.', type: 'error' });
      } else {
        setResetUserId(data.id);
        setSecurityQuestion(data.security_question);
        setResetStep(2);
      }
    } catch (err) {
      setResetMessage({ text: isRtl ? 'حدث خطأ في الشبكة.' : 'Network error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage({ text: '', type: '' });
    
    if (!securityAnswer || !newPassword) {
      setResetMessage({ text: isRtl ? 'الرجاء ملء جميع الحقول.' : 'Please fill all fields.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const { data: userData, error: fetchError } = await supabase.from('users').select('security_answer, role').eq('id', resetUserId).single();

      if (fetchError || (userData?.role !== 'DEVELOPER' && userData?.security_answer !== securityAnswer.trim())) {
        setResetMessage({ text: isRtl ? 'إجابة سؤال الأمان غير صحيحة.' : 'Incorrect security answer.', type: 'error' });
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase.from('users').update({ 
          password: newPassword.trim(), last_password_change: new Date().toISOString()
      }).eq('id', resetUserId);

      if (updateError) throw updateError;

      setResetMessage({ text: isRtl ? 'تم تغيير كلمة المرور بنجاح! جاري تحويلك...' : 'Password updated successfully!', type: 'success' });
      setTimeout(() => {
        setAuthView('standard'); setResetStep(1); setResetEmpCode(''); setSecurityAnswer(''); setNewPassword(''); setResetMessage({ text: '', type: '' });
      }, 2000);

    } catch (err) {
      setResetMessage({ text: isRtl ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden font-sans selection:bg-blue-500/30" style={{ backgroundImage: "url('/2_3.jpg')" }} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-700/10 rounded-full mix-blend-screen filter blur-[120px] animate-[pulse_8s_ease-in-out_infinite] delay-700"></div>

      <div className={cn("absolute top-6 z-20", isRtl ? "left-6" : "right-6")}>
        <button type="button" onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all backdrop-blur-md shadow-md active:scale-95">
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
                <div className="absolute inset-0 flex items-center justify-center"><Dna className="w-5 h-5 text-cyan-300" strokeWidth={2} /></div>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{t('login_title')}</h2>
              <p className="text-gray-300 text-sm mt-2">{t('login_subtitle')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>{errorMessage}
                </div>
              )}

              <div className="relative group">
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={cn("peer w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-5 pt-4 pb-1 text-white text-lg focus:bg-black/50 focus:border-blue-500/50 outline-none transition-all shadow-inner", isRtl ? "text-right" : "text-left")} placeholder=" " />
                <label htmlFor="username" className={cn("absolute flex items-center gap-2 text-gray-400 transition-all peer-placeholder-shown:text-base peer-focus:text-xs peer-focus:text-blue-400 text-xs", isRtl ? "right-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2" : "left-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2")}>
                  <UserCircle2 className="w-4 h-4" />{t('username')}
                </label>
              </div>

              <div className="relative group">
                <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn("peer w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-5 pt-4 pb-1 text-white text-lg focus:bg-black/50 focus:border-blue-500/50 outline-none transition-all shadow-inner", isRtl ? "text-right" : "text-left")} placeholder=" " />
                <label htmlFor="password" className={cn("absolute flex items-center gap-2 text-gray-400 transition-all peer-placeholder-shown:text-base peer-focus:text-xs peer-focus:text-blue-400 text-xs", isRtl ? "right-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2" : "left-5 peer-placeholder-shown:top-4 peer-focus:top-2 top-2")}>
                  <KeyRound className="w-4 h-4" />{t('password')}
                </label>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group/cb">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded bg-white/10 border border-white/20 group-hover/cb:border-blue-400 transition-colors">
                    <input type="checkbox" className="peer sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <div className="absolute inset-0 bg-blue-500 rounded scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover/cb:text-white transition-colors">{t('remember_me')}</span>
                </label>
                
                <div className="flex flex-col items-end gap-1">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-all active:scale-95">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}<span>{showPassword ? t('hide_password') : t('show_password')}</span>
                  </button>
                  <button type="button" onClick={() => setAuthView('forgot_password')} className="text-gray-400 hover:text-white text-xs transition-colors mt-1">
                    {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="relative w-full h-14 mt-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.5)] transition-all group">
                <span className="relative flex items-center justify-center gap-2 h-full">
                  {isLoading ? t('verifying') : <><Sparkles className="w-5 h-5" />{t('login_btn')}</>}
                </span>
              </button>
            </form>

            <div className="mt-6">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase tracking-wider">{isRtl ? 'أو الدخول الذكي' : 'OR SMART LOGIN'}</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button type="button" onClick={() => setAuthView('show_qr')} className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all group">
                  <QrCode className="w-6 h-6 text-cyan-400 group-hover:scale-110" />
                  <span className="text-xs font-bold">{isRtl ? 'عرض كود السبورة' : 'Show Board Code'}</span>
                </button>
                <button type="button" onClick={() => setAuthView('scan_qr')} className="flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all group">
                  <ScanLine className="w-6 h-6 text-blue-400 group-hover:scale-110" />
                  <span className="text-xs font-bold">{isRtl ? 'مسح بالكاميرا' : 'Scan via Camera'}</span>
                </button>
              </div>
            </div>
          </div>

          {authView === 'forgot_password' && (
            <div className="absolute inset-0 bg-[#0a1122]/95 p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 z-20 rounded-[2.4rem]">
              <button onClick={() => { setAuthView('standard'); setResetStep(1); setResetMessage({text: '', type: ''}); }} className={cn("absolute top-6 p-2 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white", isRtl ? "right-6" : "left-6")}>
                <ArrowLeft className={cn("w-6 h-6", isRtl && "rotate-180")} />
              </button>
              <HelpCircle className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">{isRtl ? 'استعادة كلمة المرور' : 'Reset Password'}</h3>
              <p className="text-gray-400 text-sm text-center mb-6 max-w-[280px]">{isRtl ? 'أدخل كود الموظف الخاص بك للتحقق من هويتك' : 'Enter your employee code to verify identity.'}</p>

              {resetMessage.text && (
                <div className={`w-full p-3 rounded-xl mb-4 text-sm font-medium text-center ${resetMessage.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {resetMessage.text}
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleCheckEmployeeCode} className="w-full space-y-4">
                  <input type="text" value={resetEmpCode} onChange={(e) => setResetEmpCode(e.target.value)} placeholder={isRtl ? "كود الموظف (مثال: TEA-01)" : "Employee Code"} className={cn("w-full h-12 bg-black/30 border border-white/10 rounded-xl px-4 text-white focus:border-blue-500 outline-none", isRtl ? "text-right" : "text-left")} />
                  <button type="submit" disabled={isLoading || !resetEmpCode} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50">
                    {isLoading ? 'جاري التحقق...' : (isRtl ? 'متابعة' : 'Continue')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="w-full space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                    <p className="text-xs text-blue-400 mb-1">{isRtl ? 'سؤال الأمان الخاص بك:' : 'Your Security Question:'}</p>
                    <p className="text-white font-medium">{securityQuestion}</p>
                  </div>
                  <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} placeholder={isRtl ? "أدخل الإجابة" : "Enter Answer"} className={cn("w-full h-12 bg-black/30 border border-white/10 rounded-xl px-4 text-white focus:border-blue-500 outline-none", isRtl ? "text-right" : "text-left")} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={isRtl ? "كلمة المرور الجديدة" : "New Password"} className={cn("w-full h-12 bg-black/30 border border-white/10 rounded-xl px-4 text-white focus:border-blue-500 outline-none", isRtl ? "text-right" : "text-left")} />
                  <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all disabled:opacity-50 mt-2">
                    {isLoading ? 'جاري الحفظ...' : (isRtl ? 'حفظ الدخول الجديد' : 'Save New Password')}
                  </button>
                </form>
              )}
            </div>
          )}

          {authView === 'show_qr' && (
            <div className="absolute inset-0 bg-[#0a1122]/95 p-8 flex flex-col items-center justify-center animate-in fade-in z-20 rounded-[2.4rem]">
              <button onClick={() => setAuthView('standard')} className={cn("absolute top-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white", isRtl ? "right-6" : "left-6")}><ArrowLeft className={cn("w-6 h-6", isRtl && "rotate-180")} /></button>
              <MonitorSmartphone className="w-12 h-12 text-cyan-400 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-white mb-2">{isRtl ? 'تسجيل دخول للسبورة' : 'Board Login'}</h3>
              <p className="text-gray-400 text-sm text-center mb-8">{isRtl ? 'افتح تطبيق SOP Hub من هاتفك وقم بمسح هذا الكود.' : 'Scan this code with SOP Hub.'}</p>
              <div className="w-64 h-64 bg-white rounded-3xl p-4 flex flex-col items-center justify-center">
                {qrSessionId ? <QRCodeSVG value={qrSessionId} size={190} level={"H"} /> : <span className="text-black text-sm animate-pulse">جاري جلب الكود...</span>}
              </div>
            </div>
          )}

          {authView === 'scan_qr' && (
            <div className="absolute inset-0 bg-[#0a1122]/95 p-8 flex flex-col items-center justify-center animate-in fade-in z-20 rounded-[2.4rem]">
              <button onClick={() => setAuthView('standard')} className={cn("absolute top-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white z-30", isRtl ? "right-6" : "left-6")}><ArrowLeft className={cn("w-6 h-6", isRtl && "rotate-180")} /></button>
              <ScanLine className="w-12 h-12 text-blue-400 mb-4 z-30" />
              <h3 className="text-2xl font-bold text-white mb-2 z-30">{isRtl ? 'الكاميرا قيد التشغيل' : 'Camera Active'}</h3>
              <p className="text-gray-400 text-sm text-center mb-8 z-30">{isRtl ? 'وجه الكاميرا نحو الكود.' : 'Point camera at code.'}</p>
              <div className="relative w-full max-w-[320px] aspect-square rounded-[2rem] border-2 border-dashed border-blue-500/50 flex items-center justify-center overflow-hidden bg-black/60 shadow-inner">
                <Scanner onScan={async (result) => {
                    if (result && result.length > 0 && user?.employeeCode) {
                      await supabase.from('qr_sessions').update({ status: 'linked', user_id: user.employeeCode }).eq('session_id', result[0].rawValue);
                      setAuthView('standard');
                    }
                  }} components={{ onOff: false, torch: false, zoom: false, finder: false }} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}