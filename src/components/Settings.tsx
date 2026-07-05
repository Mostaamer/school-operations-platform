import React, { useState } from 'react';
import { useAuth, supabase } from '../lib/auth-context';
import { useTranslation } from 'react-i18next';
import { KeyRound, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [newPassword, setNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secMessage, setSecMessage] = useState({ text: '', type: '' });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPassMessage({ text: isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 chars.', type: 'error' });
      return;
    }
    
    setPassLoading(true);
    try {
      const { error } = await supabase.from('users').update({ 
        password: newPassword, last_password_change: new Date().toISOString()
      }).eq('id', user?.id);

      if (error) throw error;
      setPassMessage({ text: isRtl ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!', type: 'success' });
      setNewPassword('');
    } catch (err) {
      setPassMessage({ text: isRtl ? 'حدث خطأ.' : 'Error occurred.', type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) {
      setSecMessage({ text: isRtl ? 'الرجاء ملء جميع الحقول.' : 'Please fill all fields.', type: 'error' });
      return;
    }

    setSecLoading(true);
    try {
      const { error } = await supabase.from('users').update({ 
        security_question: newQuestion, security_answer: newAnswer 
      }).eq('id', user?.id);

      if (error) throw error;
      setSecMessage({ text: isRtl ? 'تم تحديث إعدادات الأمان بنجاح!' : 'Security updated successfully!', type: 'success' });
      setNewQuestion(''); setNewAnswer('');
    } catch (err) {
      setSecMessage({ text: isRtl ? 'حدث خطأ.' : 'Error occurred.', type: 'error' });
    } finally {
      setSecLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{isRtl ? 'إعدادات الحساب والأمان' : 'Account & Security Settings'}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{isRtl ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
          </div>

          {passMessage.text && <div className={`p-3 rounded-xl mb-4 text-sm font-bold text-center ${passMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{passMessage.text}</div>}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRtl ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={passLoading} className="w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
              {passLoading ? '...' : (isRtl ? 'حفظ كلمة المرور' : 'Save Password')}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{isRtl ? 'تحديث سؤال الأمان' : 'Update Security Question'}</h2>
          </div>

          {secMessage.text && <div className={`p-3 rounded-xl mb-4 text-sm font-bold text-center ${secMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{secMessage.text}</div>}

          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRtl ? 'سؤال الأمان الجديد' : 'New Question'}</label>
              <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{isRtl ? 'الإجابة الجديدة' : 'New Answer'}</label>
              <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <button type="submit" disabled={secLoading} className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors">
              {secLoading ? '...' : (isRtl ? 'تحديث الحماية' : 'Update Security')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}