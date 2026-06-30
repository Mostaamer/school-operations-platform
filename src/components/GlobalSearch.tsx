import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, BookOpen, Users, FileText, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  link: string;
}

export default function GlobalSearch() {
  const { t, i18n } = useTranslation();
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'student': return <Users className="w-4 h-4 text-blue-400" />;
      case 'teacher': return <Users className="w-4 h-4 text-purple-400" />;
      case 'course': return <BookOpen className="w-4 h-4 text-green-400" />;
      case 'exam': return <FileText className="w-4 h-4 text-orange-400" />;
      default: return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case 'student': return t('student_type');
      case 'teacher': return t('teacher_type');
      case 'exam': return t('exam_type');
      case 'course': return t('course_type');
      default: return t('resources_type');
    }
  };

  const handleSelect = (r: SearchResult) => {
    navigate(r.link);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative z-50 w-full max-w-xs sm:max-w-md hidden md:block" ref={wrapperRef} dir={direction}>
      <div className={cn(
        "relative flex items-center transition-all duration-500 rounded-full border border-white/40 dark:border-white/10",
        "bg-white/20 dark:bg-black/20 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-white/30 dark:hover:bg-black/30",
        isOpen && "ring-2 ring-white/50 dark:ring-white/20"
      )}>
        <Search className={cn("w-4 h-4 text-gray-600 dark:text-gray-300 absolute", direction === 'rtl' ? 'right-4' : 'left-4')} />
        <input
          type="text"
          placeholder={t('global_search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          className={cn(
            "w-full bg-transparent border-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-full py-3 focus:outline-none",
            direction === 'rtl' ? 'pl-4 pr-11' : 'pr-4 pl-11'
          )}
        />
        {isSearching && (
          <Loader2 className={cn("w-4 h-4 text-indigo-500 animate-spin absolute", direction === 'rtl' ? 'left-4' : 'right-4')} />
        )}
      </div>

      {(isOpen && (results.length > 0 || (query.trim() !== '' && !isSearching))) && (
        <div className="absolute top-full mt-3 w-full bg-white/40 dark:bg-black/30 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-[0_16px_40px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="max-h-72 overflow-y-auto p-3">
            {results.length > 0 ? (
              results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(r)}
                  className={cn("w-full flex items-center gap-4 px-4 py-3 hover:bg-white/40 dark:hover:bg-white/10 rounded-2xl transition-all duration-300", direction === 'rtl' ? 'text-right' : 'text-left')}
                >
                  <div className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/50 dark:border-white/20">
                    {getIcon(r.type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.title}</div>
                    <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      {getTypeName(r.type)}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">{t('no_search_results')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}