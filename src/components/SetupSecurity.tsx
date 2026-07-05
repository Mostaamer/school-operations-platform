import React, { useState } from 'react';
import { useAuth, supabase } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SetupSecurity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isRtl = i18n.language === 'ar';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError(isRtl ? 'الرجاء كتابة السؤال والإجابة.' : 'Please enter both question and answer.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          security_question: question.trim(),
          security_answer: answer.trim() 
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      navigate('/');
    } catch (err) {
      setError(isRtl ? 'حدث خطأ أثناء حفظ الإعدادات.' : 'Failed to save settings.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gray-800 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{isRtl ? 'خطوة تأمين أخيرة' : 'Final Security Step'}</h2>
          <p className="text-gray-400 text-sm">
            {isRtl ? 'لضمان أمان حسابك في حال نسيان كلمة المرور، يرجى إعداد سؤال أمان شخصي.' : 'To secure your account for password recovery, please set a security question.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium text-center">{error}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{isRtl ? 'سؤال الأمان' : 'Security Question'}</label>
            <input 
              type="text" 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)} 
              placeholder={isRtl ? "مثال: ما هو اسم أول مدرسة عملت بها؟" : "e.g., What is your first school's name?"}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{isRtl ? 'الإجابة السرية' : 'Secret Answer'}</label>
            <input 
              type="text" 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              placeholder={isRtl ? "إجابتك السرية" : "Your secret answer"}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl p-3 mt-4 transition-colors flex justify-center items-center gap-2">
            {isLoading ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : <><CheckCircle2 className="w-5 h-5" /> {isRtl ? 'حفظ ودخول للنظام' : 'Save & Enter System'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}