import { createClient } from '@supabase/supabase-js';

// استخدم نفس القيم التي تعمل معك في بقية المشروع
const supabaseUrl = "https://wwgchgvykykeapbnivmr.supabase.co";
const supabaseKey = "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv";

export const supabase = createClient(supabaseUrl, supabaseKey);

// 1. جلب كل السلوكيات مع بيانات الطلاب
export const getBehaviors = async () => {
  return await supabase
    .from('behavior_records')
    .select('*, students(name)')
    .order('created_at', { ascending: false });
};

// 2. تحديث الحالة
export const updateBehaviorStatus = async (id: number, status: string) => {
  return await supabase
    .from('behavior_records')
    .update({ status })
    .eq('id', id);
};

// 3. حذف ملاحظة
export const deleteBehavior = async (id: number) => {
  return await supabase
    .from('behavior_records')
    .delete()
    .eq('id', id);
};

// 4. الاشتراك اللحظي
export const subscribeToBehaviors = (onUpdate: (payload: any) => void) => {
  return supabase
    .channel('public:behavior_records')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'behavior_records' }, (payload) => {
      onUpdate(payload.new);
    })
    .subscribe();
};