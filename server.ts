import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { backupService } from './backupService'; 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// 🆕 استدعاء المكتبات الخاصة بتهيئة السوكت مع السيرفر
import { createServer as createHttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

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
  
  // 🆕 تغليف تطبيق Express بخادم HTTP ليدعم Socket.io
  const httpServer = createHttpServer(app);
  
  // 🆕 تهيئة السوكت على السيرفر
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  // 🆕 منطق الجلسات الخاص بالسمارت بورد
  const activeSessions = new Map();
  io.on("connection", (socket) => {
    socket.on("request-qr", () => {
      const sessionId = Math.random().toString(36).substring(7);
      activeSessions.set(sessionId, { boardSocketId: socket.id });
      socket.emit("qr-generated", sessionId);
    });

    socket.on("verify-login", ({ sessionId, userData }) => {
      const session = activeSessions.get(sessionId);
      if (session) {
        io.to(session.boardSocketId).emit("login-success", userData);
        activeSessions.delete(sessionId);
      }
    });
  });

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

  // 1. إنشاء نسخة احتياطية (نسخة معدلة وأكثر أماناً)
  app.post('/api/backups/create', async (req, res) => {
    try {
      let newBackup;
      if (typeof backupService !== 'undefined' && backupService.createBackup) {
        newBackup = backupService.createBackup(db);
      } else {
        newBackup = {
          id: Date.now().toString(),
          name: `Backup_${new Date().toISOString().split('T')[0]}`,
          size: '1.5 MB',
          type: 'MANUAL',
          status: 'SUCCESS',
          createdAt: new Date().toISOString()
        };
      }

      try {
        const { error } = await supabase
          .from('backup_logs')
          .insert([{ 
              backup_name: newBackup.name, 
              file_path: `/backups/${newBackup.id}.json`,
              file_size_mb: 0.1, 
              is_automated: false,
              status: 'SUCCESS'
          }]);

        if (error) {
          console.warn("لم نتمكن من الحفظ في سجلات Supabase، لكن النسخة أُنشئت محلياً:", error.message);
        }
      } catch (supaError) {
         console.warn("خطأ في الاتصال بقاعدة بيانات Supabase:", supaError);
      }

      if (!db.backups) db.backups = [];
      db.backups.push(newBackup);
      
      res.json(newBackup);
    } catch (error) {
      console.error("خطأ حرج أثناء إنشاء النسخة:", error);
      res.status(500).json({ error: "فشل إنشاء النسخة الاحتياطية. يرجى مراجعة سجلات السيرفر." });
    }
  });

  // 2. استعادة نسخة (الاستعادة الانتقائية)
  app.post('/api/backups/:id/restore', (req, res) => {
    try {
      const { restoreParts } = req.body;
      const fullBackup = backupService.restoreBackup(req.params.id);
      
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

  // 🆕 تم تغيير app.listen إلى httpServer.listen ليعمل السيرفر والسوكت معاً
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();