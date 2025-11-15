import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoadingSpinner: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-center items-center p-8">
      <svg
        className="animate-spin -ml-1 mr-3 h-10 w-10 text-cyan-500 dark:text-cyan-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="progressbar"
        aria-label={t('analyzingMarket')}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="text-lg text-gray-600 dark:text-gray-300 mt-4">{t('analyzingMarket')}</span>
      {/* Indeterminate Progress Bar */}
      <div className="w-full max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden relative">
        <div className="absolute top-0 h-full bg-cyan-500 dark:bg-cyan-400 rounded-full animate-loading-bar"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;