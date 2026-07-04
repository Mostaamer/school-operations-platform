import { io, Socket } from "socket.io-client";

// دالة لتهيئة السوكت في جانب العميل (Client-side)
export const initSocket = (): Socket => {
  // تلميح: عند رفع المشروع الفعلي (Production)، قم بتغيير هذا الرابط إلى رابط السيرفر الحقيقي
  return io('http://localhost:5000', {
    autoConnect: true,
  });
};

// 🆕 دالة مساعدة لربط هاتف المدرس بالسمارت بورد
// تأخذ هذه الدالة: السوكت، كود الجلسة (الذي تم مسحه)، وبيانات المدرس الذي قام بالمسح
export const verifyQRLogin = (socket: Socket, sessionId: string, userData: any) => {
  socket.emit('verify-login', { 
    sessionId: sessionId, 
    userData: userData 
  });
};