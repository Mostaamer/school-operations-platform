import React from 'react';
import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Placeholder() {
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
      <div className="w-20 h-20 bg-brand-light/10 rounded-3xl flex items-center justify-center mb-6 text-brand-light">
        <Construction className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">قريباً</h1>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
        هذه الوحدة (<span className="font-mono text-brand-light" dir="ltr">{location.pathname}</span>) قيد التطوير حالياً وسيتم إطلاقها في التحديثات القادمة.
      </p>
    </div>
  );
}
