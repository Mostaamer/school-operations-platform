import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let db: any = {};
  
  function initDb() {
    db = {
      settings: {
        activeClasses: ['أ', 'ب', 'ج', 'د', 'هـ'], // تم ضبطها لـ 5 فصول
        allClasses: ['أ', 'ب', 'ج', 'د', 'هـ']
      },
      users: [
        { id: '1', employeeCode: 'DEV-001', name: 'المطور الرئيسي', role: 'DEVELOPER', isActive: true, password: '123' },
        { id: '2', employeeCode: 'ADM-001', name: 'مدير النظام', role: 'ADMIN', isActive: true, password: '123' },
        { id: '3', employeeCode: 'SUP-001', name: 'المشرف الأكاديمي', role: 'SUPERVISOR', isActive: true, password: '123' },
      ],
      teachers: [],
      students: [],
      exams: [],
      resources: [],
      schedules: [],
      curriculumProgress: [],
      homework: [],
      notifications: [],
      auditLogs: [],
      backups: [],
      trackingLogs: [],
      teacherAttendance: []
    };
  }

  // تهيئة قاعدة بيانات فارغة
  initDb();

  const clients: express.Response[] = [];

  const notifyClients = (notification: any) => {
    const notifObj = { id: `NOTIF-${Date.now()}`, read: false, ...notification };
    db.notifications.unshift(notifObj as never);
    clients.forEach(client => { client.write(`data: ${JSON.stringify(notifObj)}\n\n`); });
  };

  // --- API Routes ---
  
  app.get('/api/users', (req, res) => res.json(db.users));
  
  app.get('/api/teachers', (req, res) => res.json(db.teachers));

  app.post('/api/teachers', (req, res) => {
    const newTeacher = { id: `TCH-${Date.now()}`, status: 'ACTIVE', ...req.body };
    db.teachers.push(newTeacher);
    res.status(201).json(newTeacher);
  });

  app.get('/api/students', (req, res) => res.json(db.students));

  app.post('/api/students', (req, res) => {
    const newStudent = { ...req.body, id: `STU-${Date.now()}` };
    db.students.push(newStudent);
    res.json(newStudent);
  });

  app.get('/api/settings', (req, res) => res.json(db.settings));

  // باقي الـ Routes تظل كما هي لضمان عمل البرنامج...
  // (قمت بالاختصار هنا للتركيز على تنظيف البيانات الأساسية، تأكد من إبقاء باقي الـ Endpoints الموجودة في كودك الأصلي)

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