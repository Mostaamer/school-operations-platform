import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: {
          // ====== القائمة الجانبية (Sidebar) ======
          "dashboard": "لوحة القيادة",
          "student_management": "إدارة الطلاب",
          "students_list": "قائمة الطلاب",
          "schedules": "الجداول الدراسية",
          "permissions": "الصلاحيات",
          "backup": "النسخ الاحتياطي",
          "teacher_schedules": "جداول المعلمين",
          "teacher_attendance": "حضور المعلمين",
          "class_visits": "الزيارات الصفية",
          "visit_reports": "تقارير الزيارات",
          "behavior_dashboard": "لوحة السلوك",
          "curriculum_tracking": "متابعة المناهج",
          "comprehensive_reports": "التقارير الشاملة",
          "record_attendance": "تسجيل الحضور",
          "my_schedule": "الجدول الدراسي",
          "absences_attendance": "الغياب والحضور",
          "behavior_discipline": "السلوك والمواظبة",
          "my_visits": "تقارير الزيارات",
          "logout": "تسجيل الخروج",
          "search_placeholder": "ابحث هنا...",

          // ====== شاشة الترحيب ======
          "welcome_back": "مرحباً بك،",
          "syncing_data": "جاري تأسيس الاتصال الآمن ومزامنة البيانات...",
          "auth_status": "المصادقة",
          "sync_status": "المزامنة",

          // ====== أقسام أخرى (موجودة مسبقاً) ======
          "login_title": "تسجيل الدخول",
          "login_subtitle": "منصة العمليات المدرسية الذكية",
          "username": "اسم المستخدم",
          "password": "كلمة المرور",
          "login_btn": "تسجيل الدخول",
        }
      },
      en: {
        translation: {
          // ====== Sidebar ======
          "dashboard": "Dashboard",
          "student_management": "Student Management",
          "students_list": "Students List",
          "schedules": "Schedules",
          "permissions": "Permissions",
          "backup": "System Backup",
          "teacher_schedules": "Teacher Schedules",
          "teacher_attendance": "Teacher Attendance",
          "class_visits": "Classroom Visits",
          "visit_reports": "Visit Reports",
          "behavior_dashboard": "Behavior Dashboard",
          "curriculum_tracking": "Curriculum Tracking",
          "comprehensive_reports": "Comprehensive Reports",
          "record_attendance": "Record Attendance",
          "my_schedule": "My Schedule",
          "absences_attendance": "Attendance & Absences",
          "behavior_discipline": "Behavior & Discipline",
          "my_visits": "My Visit Reports",
          "logout": "Log Out",
          "search_placeholder": "Search here...",

          // ====== Welcome Screen ======
          "welcome_back": "Welcome back,",
          "syncing_data": "Establishing secure connection & syncing data...",
          "auth_status": "Auth",
          "sync_status": "Syncing",

          // ====== Other ======
          "login_title": "Login",
          "login_subtitle": "Smart School Operations Platform",
          "username": "Username",
          "password": "Password",
          "login_btn": "Login",
        }
      }
    },
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  });

export default i18n;