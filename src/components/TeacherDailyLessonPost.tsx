import React from 'react';
import { teacherStyles } from './TeacherStyles'; // تأكد من صحة المسار (ربما يحتاج إلى ../components/TeacherStyles)

export default function DailyLessonPost() {
  return (
    <div className={teacherStyles.container}>
      <h2 className={teacherStyles.title}>نشر خطة الدرس</h2>
      <textarea 
        className={teacherStyles.input} 
        rows={4} 
        placeholder="اكتب تفاصيل خطة الدرس هنا..." 
      />
      <button className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
        حفظ ونشر الخطة
      </button>
    </div>
  );
}