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
          // ====== أقسام صفحة تسجيل الدخول الجديدة ======
          "login_title": "تسجيل الدخول",
          "login_subtitle": "منصة العمليات المدرسية الذكية",
          "username": "اسم المستخدم",
          "password": "كلمة المرور",
          "remember_me": "تذكر بياناتي",
          "show_password": "إظهار كلمة المرور",
          "hide_password": "إخفاء كلمة المرور",
          "login_btn": "تسجيل الدخول",
          "verifying": "جاري التحقق...",
          "login_error_empty": "الرجاء إدخال اسم المستخدم وكلمة المرور",
          "login_error_invalid": "بيانات الدخول غير صحيحة، أو الحساب غير نشط",
          "login_error_unexpected": "حدث خطأ غير متوقع أثناء الاتصال",

          // ====== العناوين الرئيسية (سجل الزيارات) ======
          "visits_title": "سجل الزيارات الصفية",
          "subtitle": "وثّق وقيّم أداء المعلمين لتطوير جودة العملية التعليمية",
          
          // الحقول والقوائم
          "stage": "المرحلة",
          "grade": "الصف",
          "class": "الفصل",
          "teacher": "المعلم",
          "supervisor": "المشرف",
          "choose_stage": "اختر المرحلة",
          "choose_grade": "اختر الصف",
          "choose_class": "اختر الفصل",
          "choose_teacher": "اختر المدرس",
          "choose_supervisor": "اختر المشرف",
          "class_prefix": "فصل",
          "grade_prefix": "الصف",
          
          // الدرس والتقييم
          "lesson_topic": "موضوع عنوان الدرس المشاهد",
          "lesson_placeholder": "مثال: شرح درس الجملة الاسمية ونواسخها...",
          "evaluation_title": "معايير التقييم والتمكين الفني",
          "clarity": "وضوح أهداف الدرس",
          "participation": "مشاركة الطلاب",
          "time_management": "إدارة وقت الحصة",
          "engagement": "تفاعل المدرس",
          "environment": "بيئة الصف",
          
          // التوصيات والأولويات
          "recommendations": "التوجيهات والتوصيات الفنية (نقاط القوة وفرص التحسين)",
          "recommendations_placeholder": "اكتب التوجيهات الفنية الداعمة للمعلم هنا...",
          "priority": "مستوى أولوية المتابعة والزيارة القادمة",
          "high": "🔴 عالية (تحتاج متابعة عاجلة)",
          "medium": "🟡 متوسطة (متابعة دورية منتظمة)",
          "low": "🟢 منخفضة (شكر وتدعيم فني)",
          
          // الأزرار والحالات
          "save_button": "حفظ واعتماد تقرير الزيارة الصفية",
          "saving_status": "جاري حفظ وثيقة الزيارة...",
          "cancel": "إلغاء",
          "yes_delete": "نعم، حذف",
          
          // الإشعارات والرسائل
          "fill_required": "يرجى ملء كافة الحقول المطلوبة",
          "save_success": "تم حفظ تقرير الزيارة بنجاح",
          "save_error": "خطأ في الحفظ: ",
          "delete_success": "تم حذف التقرير بنجاح",
          
          // النافذة المنبثقة (الحذف)
          "delete_confirm_title": "هل أنت متأكد من الحذف؟",
          "delete_confirm_desc": "سيتم حذف هذا التقرير نهائياً من سجل الزيارات ولا يمكن استعادته لاحقاً.",
          
          // قسم الزيارات السابقة
          "recent_visits_title": "آخر 5 زيارات توجيهية تم رصدها",
          "no_recent_visits": "لا توجد زيارات مسجلة مؤخراً.",
          "unknown_teacher": "معلم غير معرف",
          "performance_ratio": "نسبة الأداء",
          "lesson_label": "الدرس:",
          
          // تقرير الطباعة
          "print_title": "تقرير زيارة صفية",
          "print_subtitle": "Classroom Visit Report",
          "final_score": "التقييم النهائي",
          "visit_date": "تاريخ الزيارة",
          "educational_supervisor": "المشرف التربوي",
          "resident_teacher": "المعلم / المدرس",
          "stage_and_grade": "المرحلة والصف",
          "priority_level": "درجة الأولوية",
          "technical_recommendations": "التوجيهات والتوصيات الفنية:",
          "no_recommendations": "لا توجد توصيات مسجلة.",
          "supervisor_signature": "توقيع المشرف التربوي",
          "teacher_signature": "توقيع المعلم المقيم",
          
          // مراحل تعليمية
          "ابتدائي": "ابتدائي",
          "إعدادي": "إعدادي",
          "ثانوي": "ثانوي"
        }
      },
      en: {
        translation: {
          // ====== New Login Section Keys ======
          "login_title": "Login",
          "login_subtitle": "Smart School Operations Platform",
          "username": "Username",
          "password": "Password",
          "remember_me": "Remember my data",
          "show_password": "Show Password",
          "hide_password": "Hide Password",
          "login_btn": "Login",
          "verifying": "Verifying...",
          "login_error_empty": "Please enter username and password",
          "login_error_invalid": "Incorrect credentials, or account is inactive",
          "login_error_unexpected": "An unexpected error occurred during connection",

          // ====== Main Titles (Classroom Visits) ======
          "visits_title": "Classroom Visits Log",
          "subtitle": "Document and evaluate teacher performance to improve educational quality",
          
          // Fields & Dropdowns
          "stage": "Stage",
          "grade": "Grade",
          "class": "Class",
          "teacher": "Teacher",
          "supervisor": "Supervisor",
          "choose_stage": "Select Stage",
          "choose_grade": "Select Grade",
          "choose_class": "Select Class",
          "choose_teacher": "Select Teacher",
          "choose_supervisor": "Select Supervisor",
          "class_prefix": "Class",
          "grade_prefix": "Grade",
          
          // Lesson & Evaluation
          "lesson_topic": "Lesson Topic",
          "lesson_placeholder": "e.g., Explanation of the nominal sentence...",
          "evaluation_title": "Evaluation Criteria & Technical Support",
          "clarity": "Lesson Clarity",
          "participation": "Student Participation",
          "time_management": "Time Management",
          "engagement": "Teacher Engagement",
          "environment": "Classroom Environment",
          
          // Recommendations & Priorities
          "recommendations": "Technical Recommendations (Strengths & Improvements)",
          "recommendations_placeholder": "Write technical recommendations here...",
          "priority": "Follow-up Priority Level",
          "high": "🔴 High (Urgent follow-up needed)",
          "medium": "🟡 Medium (Regular follow-up)",
          "low": "🟢 Low (Recognition and support)",
          
          // Buttons & Statuses
          "save_button": "Save and Submit Report",
          "saving_status": "Saving document...",
          "cancel": "Cancel",
          "yes_delete": "Yes, Delete",
          
          // Toasts & Messages
          "fill_required": "Please fill in all required fields",
          "save_success": "Visit report saved successfully",
          "save_error": "Error saving: ",
          "delete_success": "Report deleted successfully",
          
          // Delete Modal
          "delete_confirm_title": "Are you sure you want to delete?",
          "delete_confirm_desc": "This report will be permanently deleted and cannot be recovered.",
          
          // Recent Visits
          "recent_visits_title": "Last 5 Recorded Visits",
          "no_recent_visits": "No recent visits recorded.",
          "unknown_teacher": "Unknown Teacher",
          "performance_ratio": "Performance Ratio",
          "lesson_label": "Lesson:",
          
          // Print Report
          "print_title": "Classroom Visit Report",
          "print_subtitle": "Smart Operations Report",
          "final_score": "Final Score",
          "visit_date": "Visit Date",
          "educational_supervisor": "Educational Supervisor",
          "resident_teacher": "Teacher",
          "stage_and_grade": "Stage & Grade",
          "priority_level": "Priority Level",
          "technical_recommendations": "Technical Recommendations:",
          "no_recommendations": "No recommendations recorded.",
          "supervisor_signature": "Supervisor Signature",
          "teacher_signature": "Teacher Signature",
          
          // Stages
          "ابتدائي": "Primary",
          "إعدادي": "Preparatory",
          "ثانوي": "Secondary"
        }
      }
    },
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  });

export default i18n;