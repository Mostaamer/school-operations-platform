export type Role = 'DEVELOPER' | 'ADMIN' | 'SUPERVISOR' | 'TEACHER';

export interface User {
  id: string;
  employeeCode: string;
  name: string;
  role: Role;
  isActive: boolean;
  subject?: string;
  grade?: string;
  assignedClasses?: string[];
}

export interface Student {
  id: string;
  fullName: string;
  studentId: string;
  photoUrl?: string;
  grade: string;
  classSection: string;
  parentName: string;
  parentPhone: string;
  notes?: string;
}

export interface StudentTrackingLog {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  attendance: 'PRESENT' | 'ABSENT' | 'LATE';
  homework: 'COMPLETED' | 'INCOMPLETE';
  supplies: 'BROUGHT' | 'MISSING';
  participation: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'WEAK';
  behavior: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_ATTENTION';
  teacherNotes: string;
  // حقول التوثيق للربط مع المشرف
  updated_by?: string;
  updated_at?: string;
}

export interface Schedule {
  id: string;
  classId: string;
  subject: string;
  teacherId: string;
  dayOfWeek: string;
  periodIndex: number;
}