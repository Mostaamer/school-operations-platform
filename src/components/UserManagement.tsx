import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, UserPlus, Shield, Edit2, Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  isActive: boolean;
}

export default function UserManagement() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('TEACHER');
  const [password, setPassword] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employeeCode, name, role, subject, isActive')
        .order('id', { ascending: true });
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

  const startEdit = (u: UserItem) => {
    setEditingId(u.id);
    setCode(u.employeeCode);
    setName(u.name);
    setRole(u.role);
    setSubject(u.subject || '');
    setPassword('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleUserStatus = async (id: number, currentStatus: boolean, userCode: string) => {
    const action = currentStatus ? t('deactivate') : t('activate');
    if (!window.confirm(`${action} (${userCode})?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ isActive: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setMessage({ text: `${action} Success!`, type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!code || !name || (!editingId && !password)) {
      setMessage({ text: 'Please fill essential fields.', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const cleanCode = code.trim().toUpperCase();

      if (editingId) {
        const updateData: any = { 
          employeeCode: cleanCode, 
          name: name.trim(), 
          role: role, 
          subject: role === 'TEACHER' ? subject.trim() : null
        };

        if (password.trim() !== '') {
          updateData.password = password.trim();
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingId);
        
        if (error) throw error;
        setMessage({ text: 'Updated successfully!', type: 'success' });
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('users')
          .insert([{ 
            employeeCode: cleanCode, 
            name: name.trim(), 
            role: role, 
            password: password.trim(),
            subject: role === 'TEACHER' ? subject.trim() : null,
            isActive: true
          }]);
        if (error) throw error;
        setMessage({ text: 'Added successfully!', type: 'success' });
      }

      setCode(''); setName(''); setPassword(''); setSubject('');
      fetchUsers();
    } catch (err: any) {
      setIsLoading(false);
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, userCode: string) => {
    if (!window.confirm(`${t('delete')} (${userCode})?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        setMessage({ text: 'Delete failed: ' + error.message, type: 'error' });
      } else {
        setMessage({ text: 'Deleted successfully.', type: 'success' });
        fetchUsers();
      }
    } catch (err) {
      setMessage({ text: 'Error trying to delete', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-start" dir={i18n.dir()}>
      <div className="flex items-center gap-3 border-b pb-4 border-gray-200 dark:border-gray-700">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-950 dark:text-white">{t('user_management_title')}</h1>
      </div>
      
      {message.text && (
        <div className={`p-4 rounded-xl font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleAddUser} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          {editingId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <UserPlus className="w-5 h-5 text-green-600" />}
          {editingId ? t('edit_employee_data') : t('add_new_account')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('emp_code')}</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('emp_name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('role')}</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="TEACHER">{t('role_teacher')} (TEACHER)</option>
              <option value="ADMIN">{t('role_admin')} (ADMIN)</option>
              <option value="SUPERVISOR">{t('role_supervisor')} (SUPERVISOR)</option>
              <option value="DEVELOPER">{t('role_developer')} (DEVELOPER)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {editingId ? t('password_edit') : t('password')}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          {role === 'TEACHER' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('assigned_subject')}</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={isLoading} className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-blue-500/20">
            {isLoading ? '...' : (editingId ? t('save_changes') : t('save_cloud'))}
          </button>
          {editingId && (
            <button type="button" onClick={() => {setEditingId(null); setCode(''); setName(''); setPassword('');}} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all">{t('cancel_edit')}</button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
        <h2 className="p-4 font-bold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">{t('registered_users')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="p-4">{t('status')}</th>
                <th className="p-4">{t('table_code')}</th>
                <th className="p-4">{t('table_name')}</th>
                <th className="p-4">{t('table_role')}</th>
                <th className="p-4">{t('table_subject')}</th>
                <th className="p-4">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${!u.isActive ? 'bg-gray-100 dark:bg-gray-800/50 opacity-60' : 'hover:bg-blue-50/50 dark:hover:bg-gray-700/50'}`}>
                  <td className="p-4">
                    <span className={`inline-block w-3 h-3 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                  </td>
                  <td className={`p-4 font-mono font-black text-lg ${!u.isActive ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>{u.employeeCode}</td>
                  <td className={`p-4 font-extrabold text-lg ${!u.isActive ? 'text-gray-500' : 'text-gray-950 dark:text-white'}`}>{u.name}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-3 py-1 rounded-lg font-black text-sm ${!u.isActive ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'}`}>
                      {t(`role_${u.role.toLowerCase()}`)}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-600 dark:text-gray-300 text-md">{u.subject || '—'}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => toggleUserStatus(u.id, u.isActive, u.employeeCode)} className={`p-2 rounded-xl transition-all ${u.isActive ? 'text-orange-500 hover:bg-orange-100' : 'text-green-600 hover:bg-green-100'}`} title={u.isActive ? t('deactivate') : t('activate')}>
                      <Power className="w-5 h-5" />
                    </button>
                    <button onClick={() => startEdit(u)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all" title={t('edit')}><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteUser(u.id, u.employeeCode)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all" title={t('delete')}><Trash2 className="w-5 h-5" /></button>
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