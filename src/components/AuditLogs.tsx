import React, { useState, useEffect } from 'react';
import { FileText, Search, User, Filter, AlertCircle, Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.includes(searchQuery) || log.userName.includes(searchQuery) || log.action.includes(searchQuery);
    const matchesRole = roleFilter ? log.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getActionInfo = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
    }
    return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-[var(--text-secondary)]' };
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'مدير النظام';
      case 'DEVELOPER': return 'مطور النظام';
      case 'SUPERVISOR': return 'موجه';
      case 'TEACHER': return 'معلم';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-light" />
            سجلات التدقيق (Audit Logs)
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">تتبع نشاط المستخدمين وحركات النظام للإدارة الشاملة</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-surface p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input 
            type="text"
            placeholder="البحث برقم العملية، اسم المستخدم، أو التفاصيل..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-[var(--text-primary)] text-sm w-full"
          />
        </div>
        
        <div className="bg-surface p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2 shrink-0 md:w-56">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[var(--text-primary)] text-sm w-full"
          >
            <option value="">جميع الأدوار</option>
            <option value="TEACHER">المعلمين</option>
            <option value="SUPERVISOR">الموجهين</option>
            <option value="ADMIN">المديرين</option>
            <option value="DEVELOPER">المطورين</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">جاري التحميل...</div>
      ) : (
        <div className="bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-[var(--text-secondary)]">
                <tr>
                  <th className="font-medium p-4 whitespace-nowrap">الوقت والتاريخ</th>
                  <th className="font-medium p-4 whitespace-nowrap">المستخدم</th>
                  <th className="font-medium p-4 whitespace-nowrap">العملية (Action)</th>
                  <th className="font-medium p-4 w-1/2">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const actionStyle = getActionInfo(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleString('ar-EG')}
                          </div>
                        </td>
                        <td className="p-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-light/10 text-brand-light flex items-center justify-center font-bold text-xs">
                              {log.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{log.userName}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">{getRoleLabel(log.role)} - {log.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium inline-block ${actionStyle.bg} ${actionStyle.text}`} dir="ltr">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-[var(--text-primary)]">{log.details}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-mono">{log.id}</p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[var(--text-secondary)] bg-gray-50/50 dark:bg-gray-900/50">
                      <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                      لا توجد سجلات مطابقة للبحث أو الفلتر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
