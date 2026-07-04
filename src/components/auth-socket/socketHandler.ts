import { io, Socket } from "socket.io-client";

// دالة لتهيئة السوكت في جانب العميل (Client-side)
export const initSocket = (): Socket => {
  // 🆕 تم التعديل إلى بورت 3000
  return io('http://localhost:3000', {
    autoConnect: true,
  });
};

// دالة مساعدة لربط هاتف المدرس بالسمارت بورد
export const verifyQRLogin = (socket: Socket, sessionId: string, userData: any) => {
  socket.emit('verify-login', { 
    sessionId: sessionId, 
    userData: userData 
  });
};