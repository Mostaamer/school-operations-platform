import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, UserPlus, Shield, Edit2, X } from 'lucide-react';

const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

type Role = 'ADMIN' | 'TEACHER' | 'SUPERVISOR' | 'DEVELOPER';

interface UserItem {
  id: number;
  employeeCode: string;
  name: string;
  role: Role;
  password?: string;
  subject?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('TEACHER');
  const [password, setPassword] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // الحالة المضافة للتعديل (لا تؤثر على أي سطر سابق)
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employeeCode, name, role, subject');
      if (!error && data) {
        setUsers(data as UserItem[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // دالة تحضير بيانات التعديل
  const startEdit = (u: UserItem) => {
    setEditingId(u.id);
    setCode(u.employeeCode);
    setName(u.name);
    setRole(u.role);
    setSubject(u.subject || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!code || !name || (!editingId && !password)) {
      setMessage({ text: 'الرجاء ملء الحقول الأساسية (الكود، الاسم، كلمة المرور)', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const cleanCode = code.trim().toUpperCase();

      if (editingId) {
        // تحديث البيانات في قاعدة البيانات
        const { error } = await supabase
          .from('users')
          .update({ 
            employeeCode: cleanCode, 
            name: name.trim(), 
            role: role, 
            subject: role === 'TEACHER' ? subject.trim() : null
          })
          .eq('id', editingId);
        
        if (error) throw error;
        setMessage({ text: 'تم تحديث بيانات الموظف بنجاح!', type: 'success' });
        setEditingId(null);
      } else {
        // إضافة مستخدم جديد
        const { error } = await supabase
          .from('users')
          .insert([{ 
            employeeCode: cleanCode, 
            name: name.trim(), 
            role: role, 
            password: password.trim(),
            subject: role === 'TEACHER' ? subject.trim() : null
          }]);
        if (error) throw error;
        setMessage({ text: 'تم إضافة المستخدم بنجاح ومزامنتها مع السحابة!', type: 'success' });
      }

      setCode(''); setName(''); setPassword(''); setSubject('');
      fetchUsers();
    } catch (err: any) {
      setIsLoading(false);
      setMessage({ text: 'خطأ أثناء الحفظ: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, userCode: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الموظف ذو الكود (${userCode}) نهائياً من السحابة؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        setMessage({ text: 'فشل الحذف: ' + error.message, type: 'error' });
      } else {
        setMessage({ text: 'تم حذف الموظف بنجاح من قاعدة البيانات.', type: 'success' });
        fetchUsers();
      }
    } catch (err) {
      setMessage({ text: 'حدث خطأ أثناء محاولة الحذف', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4 border-gray-200 dark:border-gray-700">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">إدارة الحسابات والصلاحيات (المطور)</h1>
      </div>
      
      {message.text && (
        <div className={`p-4 rounded-xl font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* نموذج الإضافة والتعديل */}
      <form onSubmit={handleAddUser} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <UserPlus className="w-5 h-5 text-green-600" />}
          {editingId ? 'تعديل بيانات الموظف' : 'إضافة حساب جديد للسيستم'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كود الموظف</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white" placeholder="مثال: TEA-002" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الموظف</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white" placeholder="الاسم الكامل" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرتبة / الصلاحية</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white">
              <option value="TEACHER">معلم (TEACHER)</option>
              <option value="ADMIN">مدير (ADMIN)</option>
              <option value="SUPERVISOR">مشرف (SUPERVISOR)</option>
              <option value="DEVELOPER">مطور (DEVELOPER)</option>
            </select>
          </div>
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white" placeholder="••••••••" />
            </div>
          )}
          {role === 'TEACHER' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية المكلف بها</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white" placeholder="مثال: اللغة العربية، الرياضيات، العلوم..." />
            </div>
          )}
        </div>
        <button type="submit" disabled={isLoading} className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">
          {isLoading ? 'جاري التنفيذ...' : (editingId ? 'حفظ التعديلات' : 'حفظ الموظف في السحابة')}
        </button>
        {editingId && (
          <button type="button" onClick={() => {setEditingId(null); setCode(''); setName('');}} className="mr-3 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl">إلغاء</button>
        )}
      </form>

      {/* الجدول المعالج وعرض البيانات */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h2 className="p-4 font-bold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">المستخدمين المسجلين حالياً بالسحابة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-4">الكود</th>
                <th className="p-4">الاسم</th>
                <th className="p-4">الدور</th>
                <th className="p-4">المادة التخصصية</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 font-mono font-black text-blue-600 dark:text-blue-400 text-lg">{u.employeeCode}</td>
                  <td className="p-4 font-extrabold text-lg text-gray-950 dark:text-white">{u.name}</td>
                  <td className="p-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 rounded-lg font-black text-sm">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-600 dark:text-gray-300 text-md">{u.subject || '—'}</td>
                  <td className="p-4 flex justify-center gap-3">
                    <button onClick={() => startEdit(u)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all" title="تعديل"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteUser(u.id, u.employeeCode)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all" title="حذف"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}