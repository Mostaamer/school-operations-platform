import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth-context';
import './lib/language'; 

import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
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
import UserManagement from './components/UserManagement';
import SupervisorStudentView from './components/SupervisorStudentView';
import SupervisorBehaviorDashboard from './components/SupervisorBehaviorDashboard';
import SupervisorVisits from './components/SupervisorVisits';
import SupervisorDashboard from './components/SupervisorDashboard';
import TeacherStatus from './components/TeacherStatus'; 
import TeacherBehavior from './components/TeacherBehavior';
import TeacherVisits from './components/TeacherVisits';
import TeacherLesson from './components/TeacherLesson';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'SUPERVISOR') return <SupervisorDashboard />;
  if (user?.role === 'TEACHER') return <Dashboard />; 
  if (user?.role === 'ADMIN' || user?.role === 'DEVELOPER') return <Dashboard />;
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
              border: '1px solid var(--border-color)', 
              borderRadius: '1rem', 
              fontWeight: 'bold' 
            } 
          }} 
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />
            
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><StudentsList /></ProtectedRoute>} />
            <Route path="admin/student-management" element={<ProtectedRoute allowedRoles={['ADMIN']}><StudentManagement /></ProtectedRoute>} />
            <Route path="admin/students/enroll" element={<ProtectedRoute allowedRoles={['ADMIN']}><StudentEnrollment /></ProtectedRoute>} />
            <Route path="admin/schedules" element={<ProtectedRoute allowedRoles={['ADMIN']}><ScheduleView /></ProtectedRoute>} />
            
            <Route path="resources" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'TEACHER']}><ResourcesLibrary /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR']}><SupervisorMonitoring /></ProtectedRoute>} />
            <Route path="curriculum" element={<ProtectedRoute allowedRoles={['SUPERVISOR', 'TEACHER']}><CurriculumProgress /></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorMonitoring /></ProtectedRoute>} />
            
            <Route path="dev/health" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><Placeholder /></ProtectedRoute>} />
            <Route path="dev/users" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><UserManagement /></ProtectedRoute>} />
            <Route path="dev/audit" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><AuditLogs /></ProtectedRoute>} />
            <Route path="dev/backup" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><BackupManagement /></ProtectedRoute>} />
            <Route path="dev/classes" element={<ProtectedRoute allowedRoles={['DEVELOPER']}><ClassManagement /></ProtectedRoute>} />
            
            <Route path="supervisor/teacher-schedules" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorTeacherSchedule /></ProtectedRoute>} />
            <Route path="supervisor/students" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorStudentView /></ProtectedRoute>} />
            <Route path="supervisor/behavior-dashboard" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorBehaviorDashboard /></ProtectedRoute>} />
            <Route path="supervisor/visits" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorVisits /></ProtectedRoute>} />
            <Route path="supervisor/visits-list" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorVisits /></ProtectedRoute>} />
            <Route path="supervisor/attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorTeacherAttendance /></ProtectedRoute>} />
            <Route path="supervisor/teacher-attendance" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorTeacherAttendance /></ProtectedRoute>} />
            <Route path="supervisor/curriculum" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorCurriculum /></ProtectedRoute>} />
            
            <Route path="teacher/status" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherStatus /></ProtectedRoute>} />
            <Route path="teacher/schedule" element={<ProtectedRoute allowedRoles={['TEACHER']}><ScheduleView /></ProtectedRoute>} />
            <Route path="teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER']}><ClassroomTracking /></ProtectedRoute>} />
            <Route path="teacher/homework" element={<ProtectedRoute allowedRoles={['TEACHER']}><HomeworkManagement /></ProtectedRoute>} />
            <Route path="teacher/behavior" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherBehavior /></ProtectedRoute>} />
            <Route path="teacher/lesson" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherLesson /></ProtectedRoute>} />
            <Route path="teacher/visits" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherVisits /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}