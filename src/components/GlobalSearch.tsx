import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="relative w-full md:w-80 group">
      {/* تأثير الإضاءة الخلفية الناعمة */}
      <div 
        className={`absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-xl blur-lg transition-all duration-500 ease-in-out ${
          isFocused ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
        }`}
      ></div>

      <div className="relative flex items-center">
        {/* أيقونة البحث */}
        <div className={`absolute inset-y-0 ${document.documentElement.dir === 'ltr' ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center pointer-events-none`}>
          <Search 
            className={`w-5 h-5 transition-colors duration-300 ${
              isFocused ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`} 
          />
        </div>

        <input
          type="text"
          className={`block w-full py-2.5 ${document.documentElement.dir === 'ltr' ? 'pl-11 pr-10' : 'pr-11 pl-10'} text-sm font-medium text-gray-900 dark:text-white bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] focus:border-blue-500/50 dark:focus:border-blue-400/50 outline-none transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400`}
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* زر مسح النص */}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className={`absolute inset-y-0 ${document.documentElement.dir === 'ltr' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-gray-400 hover:text-red-500 transition-colors duration-300`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}