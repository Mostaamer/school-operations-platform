import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, FileText, AlertTriangle, Clock, CheckCircle2, 
  RefreshCw, Trash2, Search, SlidersHorizontal, 
  Layers, Award, Calendar, Bookmark, ShieldAlert,
  GraduationCap, TrendingUp, TrendingDown, UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/auth-context';

// الواجهات (Interfaces) لضمان صحة البيانات
interface Student {
  id: number;
  name: string;
}

interface BehaviorRecord {
  id: number;
  student_id: number;
  teacher_name?: string;
  behavior_type: string;
  category: string;
  points: number;
  note: string;
  class_name: string;
  stage?: string;
  grade?: string;
  section?: string;
  status: string;
  created_at: string;
}

export default function SupervisorBehaviorDashboard() {
  const [behaviors, setBehaviors] = useState<BehaviorRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // جلب البيانات من جدول السلوكيات وجدول الطلاب
  const loadData = async () => {
    setLoading(true);
    try {
      const [behaviorsRes, studentsRes] = await Promise.all([
        supabase.from('behavior_records').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, name')
      ]);

      if (behaviorsRes.error) throw behaviorsRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setBehaviors(behaviorsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('behavior_records')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (error) {
      toast.error('فشل تحديث حالة الإجراء');
    } else {
      toast.success(
        newStatus === 'investigating' ? 'تم بدء التحقيق وتحديث حالة السجل' : 'تم إغلاق الملف بنجاح'
      );
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد تماماً من حذف هذا السجل نهائياً؟')) {
      const { error } = await supabase
        .from('behavior_records')
        .delete()
        .eq('id', id);
        
      if (error) toast.error('حدث خطأ أثناء الحذف');
      else {
        toast.success('تم حذف السجل بنجاح');
        loadData();
      }
    }
  };

  // إحصائيات لوحة التحكم العلوية
  const stats = useMemo(() => ({
    active: behaviors.filter(b => b.status === 'active').length,
    investigating: behaviors.filter(b => b.status === 'investigating').length,
    resolved: behaviors.filter(b => b.status === 'resolved').length,
    totalPoints: behaviors.reduce((acc, curr) => acc + (curr.points || 0), 0)
  }), [behaviors]);

  // حساب إجمالي النقاط لكل طالب (إيجابي، سلبي، وصافي) للعرض داخل كارت الطالب
  const studentTotals = useMemo(() => {
    const totals: Record<number, { positive: number, negative: number, net: number }> = {};
    behaviors.forEach(b => {
      if (!totals[b.student_id]) totals[b.student_id] = { positive: 0, negative: 0, net: 0 };
      if (b.points > 0) totals[b.student_id].positive += b.points;
      if (b.points < 0) totals[b.student_id].negative += Math.abs(b.points);
      totals[b.student_id].net += b.points; // حساب الصافي
    });
    return totals;
  }, [behaviors]);

  const categories = ['all', ...Array.from(new Set(behaviors.map(b => b.category).filter(Boolean)))];

  // دالة لتنسيق اسم الفصل والمرحلة
  const formatClassName = (b: BehaviorRecord) => {
    if (b.stage && b.grade && b.section) {
      const stageName = b.stage === 'PRI' ? 'ابتدائي' : b.stage === 'PREP' ? 'إعدادي' : b.stage === 'SEC' ? 'ثانوي' : b.stage;
      return `${stageName} - صف ${b.grade} - فصل ${b.section}`;
    }
    return b.class_name || 'غير محدد';
  };

  // تصفية الكروت
  const filteredBehaviors = behaviors.filter((b) => {
    const studentName = students.find(s => s.id === b.student_id)?.name || '';
    const matchesStatus = b.status === filter;
    const matchesSearch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(b.student_id).includes(searchTerm) || 
      (b.class_name && b.class_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.teacher_name && b.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
    
    return matchesStatus && matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-right" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-indigo-600" size={32} />
            منصة الإشراف والمتابعة السلوكية
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">إدارة الشكاوى، متابعة التقارير المدرسية، واتخاذ الإجراءات الفورية.</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {/* لوحة إحصائيات المشرف */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { l: 'المخالفات المعلقة', c: stats.active, i: <AlertTriangle size={24}/>, b: 'border-orange-100 bg-gradient-to-br from-white to-orange-50/40', text: 'text-orange-600', iconBg: 'bg-orange-50' },
          { l: 'جاري التحقق منها', c: stats.investigating, i: <Clock size={24}/>, b: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/40', text: 'text-blue-600', iconBg: 'bg-blue-50' },
          { l: 'تقارير تم حلها', c: stats.resolved, i: <CheckCircle2 size={24}/>, b: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40', text: 'text-emerald-600', iconBg: 'bg-emerald-50' },
          { l: 'إجمالي الحركات السلوكية', c: behaviors.length, i: <Award size={24}/>, b: 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40', text: 'text-indigo-600', iconBg: 'bg-indigo-50' }
        ].map((s, i) => (
          <div key={i} className={`p-6 rounded-3xl border shadow-sm flex justify-between items-center bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${s.b}`}>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">{s.l}</p>
              <h2 className={`text-4xl font-black ${s.text}`}>{s.c}</h2>
            </div>
            <div className={`p-3 rounded-2xl shadow-inner ${s.iconBg} ${s.text}`}>
              {s.i}
            </div>
          </div>
        ))}
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
          {[
            { id: 'active', label: 'المعلقة', count: stats.active, color: 'bg-orange-500' },
            { id: 'investigating', label: 'جاري التحقيق', count: stats.investigating, color: 'bg-blue-500' },
            { id: 'resolved', label: 'تم الحل', count: stats.resolved, color: 'bg-emerald-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 relative ${
                filter === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tab.color}`} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-black ${filter === tab.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 lg:justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث باسم الطالب، المعلم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">كل التصنيفات</option>
              {categories.filter(c => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => <div key={n} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse h-80" />)}
        </div>
      ) : filteredBehaviors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-20 px-4 text-center max-w-xl mx-auto shadow-sm mt-12">
          <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto text-slate-400 mb-4 border border-slate-100">
            <Layers size={36} />
          </div>
          <h3 className="text-xl font-black text-slate-700">لا توجد سجلات سلوكية متاحة</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">القسم المحدد حالياً فارغ، أو لا توجد نتائج تطابق بحثك.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBehaviors.map((item) => {
            const studentName = students.find(s => s.id === item.student_id)?.name || 'طالب غير معروف';
            const sTotals = studentTotals[item.student_id] || { positive: 0, negative: 0, net: 0 };
            
            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
                <div className="p-6">
                  
                  {/* رأس الكارت (الطالب والنقاط للحركة الحالية) */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-3 rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 leading-tight">{studentName}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">رقم تعريفي: {item.student_id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide shadow-sm flex flex-col items-center justify-center ${
                      item.points < 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      <span>{item.points > 0 ? `+${item.points}` : item.points}</span>
                      <span className="text-[9px]">الحدث الحالي</span>
                    </span>
                  </div>

                  {/* معلومات المعلم والتاريخ */}
                  <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-3 rounded-2xl mb-4 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <UserCircle size={14} className="text-indigo-400" />
                      <span>{item.teacher_name || 'معلم غير محدد'}</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  {/* بيانات الفصل والنوع */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                      <Layers size={12}/> {formatClassName(item)}
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-1.5 rounded-xl flex items-center gap-1 ${item.behavior_type === 'إيجابي' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      <Bookmark size={12}/> {item.behavior_type}
                    </span>
                    {item.category && (
                      <span className="bg-amber-50 text-amber-700 text-xs font-extrabold px-2.5 py-1.5 rounded-xl">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* شريط إحصائيات الطالب الإجمالية مع الرصيد الصافي */}
                  <div className="mb-5 bg-white border border-slate-100 shadow-sm rounded-2xl p-3 flex justify-between items-center">
                    <div className="text-center px-1 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">صافي الرصيد</p>
                      <p className={`text-sm font-black flex items-center justify-center gap-1 ${sTotals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sTotals.net >= 0 ? `+${sTotals.net}` : sTotals.net}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="text-center px-1 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي الإيجابي</p>
                      <p className="text-sm font-black text-emerald-600 flex items-center justify-center gap-1">
                        <TrendingUp size={14}/> {sTotals.positive}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="text-center px-1 flex-1">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي الخصم</p>
                      <p className="text-sm font-black text-rose-600 flex items-center justify-center gap-1">
                        <TrendingDown size={14}/> {sTotals.negative}
                      </p>
                    </div>
                  </div>

                  {/* الملاحظة */}
                  <div className="bg-slate-50 p-4 rounded-2xl mb-2 text-sm text-slate-600 border border-slate-100/70 leading-relaxed">
                    <p className="font-black text-slate-800 mb-1 flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" /> تقرير المعلم:
                    </p>
                    {item.note || 'لم يتم تدوين أي ملاحظات إضافية.'}
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex gap-2 items-center">
                  {item.status === 'active' && (
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'investigating')}
                      className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs tracking-wide shadow-sm shadow-orange-100 active:scale-95 transition-all flex justify-center items-center gap-1.5"
                    >
                      <Clock size={14}/> بدء إجراءات التحقق
                    </button>
                  )}

                  {item.status === 'investigating' && (
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs tracking-wide shadow-sm shadow-emerald-100 active:scale-95 transition-all flex justify-center items-center gap-1.5"
                    >
                      <CheckCircle2 size={14}/> إغلاق الشكوى
                    </button>
                  )}

                  {item.status === 'resolved' && (
                    <div className="flex-1 text-center py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-extrabold text-xs flex justify-center items-center gap-1.5">
                      <CheckCircle2 size={14}/> تم إغلاق الملف
                    </div>
                  )}

                  <button 
                    onClick={() => handleDelete(item.id)}
                    title="حذف السجل"
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all active:scale-90"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}