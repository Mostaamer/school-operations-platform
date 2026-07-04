import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { io, Socket } from 'socket.io-client';

export type Role = 'ADMIN' | 'TEACHER' | 'SUPERVISOR' | 'DEVELOPER';

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

interface AuthContextType {
  user: User | null;
  login: (code: string, password?: string) => Promise<boolean>;
  logout: () => void;
  socket: Socket | null;
  // 🆕 دالة جديدة لتسجيل الدخول المباشر للسبورة بعد مسح الـ QR
  directLogin: (userData: User) => void; 
}

export const supabase = createClient(
  "https://wwgchgvykykeapbnivmr.supabase.co",
  "sb_publishable_O00HiI9X2Wpkw_NkbmAT2w_hsWocwBv"
);

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null); 

  useEffect(() => {
    // تركنا السوكت كما هو لكي لا نعطل أي أجزاء أخرى في مشروعك تعتمد عليه
    const newSocket = io('http://localhost:3000', {
      autoConnect: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const login = async (code: string, password?: string): Promise<boolean> => {
    try {
      const cleanCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('employeeCode', cleanCode)
        .maybeSingle();

      if (error || !data || String(data.password).trim() !== String(password).trim()) {
        return false;
      }

      if (data.isActive === false) return false;

      const userData: User = {
        id: String(data.id),
        employeeCode: data.employeeCode,
        name: data.name,
        role: data.role as Role,
        isActive: true,
        subject: data.subject,
        grade: data.grade,
        assignedClasses: data.assignedClasses
      };

      setUser(userData);
      return true;
    } catch (err) {
      console.error("حدث خطأ أثناء محاولة تسجيل الدخول:", err);
      return false;
    }
  };

  // 🆕 دالة الدخول المباشر
  const directLogin = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, socket, directLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};