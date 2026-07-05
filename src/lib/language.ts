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
          "login_title": "تسجيل الدخول",
          "login_subtitle": "منصة العمليات المدرسية الذكية",
          "username": "اسم المستخدم",
          "password": "كلمة المرور",
          "login_btn": "تسجيل الدخول",

          // ====== كلمات عامة ======
          "actions": "الإجراءات",
          "status": "الحالة",
          "save": "حفظ",
          "cancel": "إلغاء",
          "delete": "حذف",
          "edit": "تعديل",
          "activate": "تفعيل",
          "deactivate": "تعطيل",
          
          // ====== إدارة المستخدمين (UserManagement) ======
          "user_management_title": "إدارة الحسابات والصلاحيات (المطور)",
          "add_new_account": "إضافة حساب جديد للسيستم",
          "edit_employee_data": "تعديل بيانات الموظف",
          "emp_code": "كود الموظف",
          "emp_name": "اسم الموظف",
          "role": "الرتبة / الصلاحية",
          "password_edit": "كلمة المرور (اتركها فارغة إذا لم ترد التغيير)",
          "assigned_subject": "المادة الدراسية المكلف بها",
          "save_cloud": "حفظ الموظف في السحابة",
          "save_changes": "حفظ التعديلات",
          "cancel_edit": "إلغاء التعديل",
          "registered_users": "المستخدمين المسجلين حالياً بالسحابة",
          "table_code": "الكود",
          "table_name": "الاسم",
          "table_role": "الدور",
          "table_subject": "المادة التخصصية",
          "role_teacher": "معلم",
          "role_admin": "مدير",
          "role_supervisor": "مشرف",
          "role_developer": "مطور",
          
          // ====== الزيارات الإشرافية (TeacherVisits) ======
          "visits_title": "تقارير الزيارات الإشرافية",
          "no_visits": "لا توجد زيارات مسجلة حالياً",
          "supervisor": "المشرف",
          "grade": "الصف",
          "classroom": "الفصل",
          "final_score": "النتيجة النهائية",
          "supervisor_notes": "ملاحظات وتوصيات المشرف",
          "no_notes": "لا توجد ملاحظات.",
          // معايير التقييم
          "criteria_clarity": "الوضوح",
          "criteria_engagement": "التفاعل",
          "criteria_method": "الأساليب",
          "criteria_environment": "البيئة الصفية",
          "criteria_participation": "المشاركة",
          "criteria_time_management": "إدارة الوقت",

          // ====== تسجيل الحضور (TeacherStyles) ======
          "attendance_title": "تسجيل الحضور اليومي",
          "status_present": "حاضر",
          "status_late": "متأخر",
          "status_absent": "غائب"
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
          "login_title": "Login",
          "login_subtitle": "Smart School Operations Platform",
          "username": "Username",
          "password": "Password",
          "login_btn": "Login",

          // ====== General ======
          "actions": "Actions",
          "status": "Status",
          "save": "Save",
          "cancel": "Cancel",
          "delete": "Delete",
          "edit": "Edit",
          "activate": "Activate",
          "deactivate": "Deactivate",
          
          // ====== UserManagement ======
          "user_management_title": "User Management & Roles",
          "add_new_account": "Add New Account",
          "edit_employee_data": "Edit Employee Data",
          "emp_code": "Employee Code",
          "emp_name": "Employee Name",
          "role": "Role / Permission",
          "password_edit": "Password (Leave blank to keep unchanged)",
          "assigned_subject": "Assigned Subject",
          "save_cloud": "Save to Cloud",
          "save_changes": "Save Changes",
          "cancel_edit": "Cancel Edit",
          "registered_users": "Currently Registered Users",
          "table_code": "Code",
          "table_name": "Name",
          "table_role": "Role",
          "table_subject": "Subject",
          "role_teacher": "Teacher",
          "role_admin": "Admin",
          "role_supervisor": "Supervisor",
          "role_developer": "Developer",
          
          // ====== TeacherVisits ======
          "visits_title": "Supervisory Visit Reports",
          "no_visits": "No visits recorded currently",
          "supervisor": "Supervisor",
          "grade": "Grade",
          "classroom": "Classroom",
          "final_score": "Final Score",
          "supervisor_notes": "Supervisor Notes",
          "no_notes": "No notes available.",
          // Criteria
          "criteria_clarity": "Clarity",
          "criteria_engagement": "Engagement",
          "criteria_method": "Methods",
          "criteria_environment": "Class Environment",
          "criteria_participation": "Participation",
          "criteria_time_management": "Time Mngt",

          // ====== TeacherStyles (Attendance) ======
          "attendance_title": "Daily Attendance",
          "status_present": "Present",
          "status_late": "Late",
          "status_absent": "Absent"
        }
      }
    },
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  });

export default i18n;