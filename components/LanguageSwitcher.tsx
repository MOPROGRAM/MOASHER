import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const switchLanguage = (lang: 'ar' | 'en') => {
    if (language !== lang) {
      setLanguage(lang);
    }
  };

  return (
    <div className="flex items-center space-x-1 rtl:space-x-reverse bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
          language === 'en'
            ? 'bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('ar')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${
          language === 'ar'
            ? 'bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
        }`}
      >
        AR
      </button>
    </div>
  );
};

export default LanguageSwitcher;
