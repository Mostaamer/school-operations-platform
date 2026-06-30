import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth-context';

// --- استيراد نظام اللغة الجديد ---
import './lib/language'; 

// استيراد المكونات الأساسية والمحمية
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AiExams from './components/AiExams';
import StudentsList from './components/StudentsList';
import StudentManagement from './components/StudentManagement'; 
import StudentEnrollment from './components/StudentEnrollment';
import ClassroomTracking from './components/ClassroomTracking';
import SupervisorMonitoring from './components/SupervisorMonitoring';
import ResourcesLibrary from './components/ResourcesLibrary';
import Placeholder from './components/Placeholder';
import ScheduleView from './components/ScheduleView';
import CurriculumProgress from './components/CurriculumProgress';
import HomeworkManagement from './components/HomeworkManagement';
import AuditLogs from './components/AuditLogs';
import BackupManagement from './components/BackupManagement';
import ClassManagement from './components/ClassManagement';
import SupervisorTeacherSchedule from './components/SupervisorTeacherSchedule';
import SupervisorTeacherAttendance from './components/SupervisorTeacherAttendance';
import SupervisorCurriculum from './components/SupervisorCurriculum';
import DailyLessonPost from './components/TeacherDailyLessonPost';
import UserManagement from './components/UserManagement';
import SupervisorStudentView from './components/SupervisorStudentView';
import SupervisorBehaviorDashboard from './components/SupervisorBehaviorDashboard';
import SupervisorVisits from './components/SupervisorVisits';
import SupervisorDashboard from './components/SupervisorDashboard';
// استيراد مكون تسجيل الحضور الخاص بالمعلم
import TeacherStatus from './components/TeacherStatus'; 

// --- استيراد الملفات الجديدة الخاصة بالمعلم المضافة حديثاً ---
import TeacherBehavior from './components/TeacherBehavior';
import TeacherVisits from './components/TeacherVisits';
import TeacherLesson from './components/TeacherLesson';

// --- المكونات المساعدة ---

/**
 * مكون ProtectedRoute:
 * يقوم بحماية المسارات بناءً على الصلاحيات (Roles)
 */
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

/**
 * مكون DashboardRouter:
 * يوجه المستخدم ديناميكياً للوحة القيادة المناسبة بناءً على دوره
 */
function DashboardRouter() {
  const { user } = useAuth();
  
  // توجيه المشرف للوحة المخصصة
  if (user?.role === 'SUPERVISOR') return <SupervisorDashboard />;
  
  // اللوحة العامة لباقي المستخدمين
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '1rem',
              fontWeight: 'bold'
            }
          }} 
        />
        
        <Routes>
          {/* مسارات عامة */}
          <Route path="/login" element={<Login />} />
          
          {/* مسارات النظام المحمية داخل الـ Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            
            <Route index element={<DashboardRouter />} />
            
            {/* --- إدارة الطلاب والفصول --- */}
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'SUPERVISOR', 'TEACHER']}><StudentsList /></ProtectedRoute>} />
            <Route path="admin/student-management" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}><StudentManagement /></ProtectedRoute>} />
            <Route path="admin/students/enroll" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}><StudentEnrollment /></ProtectedRoute>} />
            
            {/* --- الموارد الأكاديمية --- */}
            <Route path="resources" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'SUPERVISOR', 'TEACHER']}><ResourcesLibrary /></ProtectedRoute>} />
            <Route path="teacher/ai-exams" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><AiExams /></ProtectedRoute>} />

            {/* --- مسارات المطور (Developer) --- */}
            <Route path="dev/health" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><Placeholder /></ProtectedRoute>} />
            <Route path="dev/users" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><UserManagement /></ProtectedRoute>} />
            <Route path="dev/audit" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><AuditLogs /></ProtectedRoute>} />
            <Route path="dev/backup" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><BackupManagement /></ProtectedRoute>} />
            <Route path="dev/classes" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><ClassManagement /></ProtectedRoute>} />

            {/* --- مسارات الإدارة (Admin) --- */}
            <Route path="admin/schedules" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}><ScheduleView /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'SUPERVISOR']}><SupervisorMonitoring /></ProtectedRoute>} />

            {/* --- مسارات الإشراف (Supervisor) --- */}
            <Route path="curriculum" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER', 'TEACHER']}><CurriculumProgress /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorMonitoring /></ProtectedRoute>} />
            <Route path="supervisor/teacher-schedules" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorTeacherSchedule /></ProtectedRoute>} />
            <Route path="supervisor/students" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorStudentView /></ProtectedRoute>} />
            <Route path="supervisor/behavior" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorBehaviorDashboard /></ProtectedRoute>} />
            <Route path="supervisor/visits" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorVisits /></ProtectedRoute>} />
            <Route path="supervisor/attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorTeacherAttendance /></ProtectedRoute>} />
            <Route path="supervisor/teacher-attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorTeacherAttendance /></ProtectedRoute>} />
            <Route path="supervisor/curriculum" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'DEVELOPER']}><SupervisorCurriculum /></ProtectedRoute>} />

            {/* --- مسارات المعلم (Teacher) --- */}
            <Route path="teacher/status" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><TeacherStatus /></ProtectedRoute>} />
            <Route path="teacher/schedule" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><ScheduleView /></ProtectedRoute>} />
            <Route path="teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><ClassroomTracking /></ProtectedRoute>} />
            <Route path="teacher/daily-post" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><DailyLessonPost /></ProtectedRoute>} />
            <Route path="teacher/homework" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><HomeworkManagement /></ProtectedRoute>} />
            
            {/* الربط الجديد للملفات المطلوبة لصفحة المعلم دون المساس بأي كود قديم */}
            <Route path="teacher/behavior" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><TeacherBehavior /></ProtectedRoute>} />
            <Route path="teacher/visits" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><TeacherVisits /></ProtectedRoute>} />
            <Route path="teacher/lesson" element={<ProtectedRoute allowedRoles={['TEACHER', 'DEVELOPER']}><TeacherLesson /></ProtectedRoute>} />

            {/* --- مسار غير موجود (404) --- */}
            <Route path="*" element={<Placeholder />} />
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}