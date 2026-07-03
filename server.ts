import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { backupService } from './backupService'; 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

// إعداد عميل Supabase
const supabase = createClient(
  'https://wwgchgvykykeapbnivmr.supabase.co', 
  'sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv'
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let db: any = {};
  
  function initDb() {
    db = {
      settings: { activeClasses: ['أ', 'ب', 'ج', 'د', 'هـ'], allClasses: ['أ', 'ب', 'ج', 'د', 'هـ'] },
      users: [
        { id: '1', employeeCode: 'DEV-001', name: 'المطور الرئيسي', role: 'DEVELOPER', isActive: true, password: '123' },
        { id: '2', employeeCode: 'ADM-001', name: 'مدير النظام', role: 'ADMIN', isActive: true, password: '123' },
        { id: '3', employeeCode: 'SUP-001', name: 'المشرف الأكاديمي', role: 'SUPERVISOR', isActive: true, password: '123' },
      ],
      teachers: [],
      students: [],
      backups: [], 
    };
  }
  initDb();

  // --- API Routes ---
  app.get('/api/users', (req, res) => res.json(db.users));
  app.get('/api/students', (req, res) => res.json(db.students));
  app.get('/api/backups', (req, res) => res.json(db.backups));

  // --- نظام تسجيل الدخول (مع حماية الحسابات المعطلة) ---
  app.post('/api/login', async (req, res) => {
    const { employeeCode, password } = req.body;
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('employeeCode', employeeCode)
        .eq('password', password);

      if (error) throw error;
      if (!users || users.length === 0) {
        return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      }

      const user = users[0];
      if (user.isActive === false) {
        return res.status(403).json({ error: "هذا الحساب معطل حالياً. يرجى مراجعة إدارة النظام." });
      }

      res.json({ success: true, user: user });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "حدث خطأ في السيرفر أثناء تسجيل الدخول" });
    }
  });

  // 1. إنشاء نسخة احتياطية
  app.post('/api/backups/create', async (req, res) => {
    try {
      const newBackup = backupService.createBackup(db);
      const { error } = await supabase
        .from('backup_logs')
        .insert([{ 
            backup_name: newBackup.name, 
            file_path: `/backups/${newBackup.id}.json`,
            file_size_mb: 0.1, 
            is_automated: false,
            status: 'SUCCESS'
        }]);

      if (error) throw error;
      db.backups.push(newBackup);
      res.json(newBackup);
    } catch (error) {
      console.error("خطأ في الربط مع Supabase:", error);
      res.status(500).json({ error: "فشل إنشاء النسخة" });
    }
  });

  // 2. استعادة نسخة (الاستعادة الانتقائية)
  app.post('/api/backups/:id/restore', (req, res) => {
    try {
      const { restoreParts } = req.body; // مصفوفة بالأجزاء المراد استعادتها
      const fullBackup = backupService.restoreBackup(req.params.id);
      
      // إذا لم يحدد أجزاء، نستعيد كل شيء. إذا حدد، نستعيد المختار فقط.
      if (!restoreParts || restoreParts.length === 0) {
        db = fullBackup;
      } else {
        const newDb = { ...db };
        if (restoreParts.includes('users')) newDb.users = fullBackup.users;
        if (restoreParts.includes('teachers')) newDb.teachers = fullBackup.teachers;
        if (restoreParts.includes('students')) newDb.students = fullBackup.students;
        if (restoreParts.includes('settings')) newDb.settings = fullBackup.settings;
        db = newDb;
      }
      
      res.json({ success: true, message: "تمت الاستعادة بنجاح" });
    } catch (error) {
      res.status(404).json({ error: "النسخة غير موجودة" });
    }
  });

  // 3. حذف نسخة
  app.delete('/api/backups/:id', (req, res) => {
    const success = backupService.deleteBackup(req.params.id);
    if (success) {
      db.backups = db.backups.filter((b: any) => b.id !== req.params.id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "النسخة غير موجودة" });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();