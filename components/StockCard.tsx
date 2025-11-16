import React, { useState } from 'react';
import type { StockOpportunity } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface StockCardProps {
  stock: StockOpportunity;
  isListContext?: boolean; // New prop to indicate if used in the list context
  style?: React.CSSProperties; // Add style prop for staggered animations
  initialShowChart?: boolean; // New prop to control initial chart visibility
}

const StockCard: React.FC<StockCardProps> = ({ stock, isListContext = false, style, initialShowChart = false }) => {
  const [showChart, setShowChart] = useState(initialShowChart);
  const { t, language, isRTL } = useLanguage();

  // Ensure entryPoints is an array before checking its length and values
  const hasOpportunity = Array.isArray(stock.entryPoints) && stock.entryPoints.length > 0 && stock.entryPoints[0] > 0;

  return (
    <div 
      className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col animate-fadeInUp"
      style={style}
    >
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{stock.companyName}</h2>
          <p className="text-lg font-mono text-cyan-600 dark:text-cyan-400">{stock.ticker}</p>
        </div>
      </div>

      {/* Removed all numerical data display */}
      {/* Removed priceDataDate display */}
      {/* Removed Sharia compliance section with ratios */}
      
      <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('technicalSummary')}</h3>
          <p className="text-gray-600 dark:text-gray-400 font-medium p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">{stock.reason}</p>
      </div>

      {/* Proposed Trading Plan section removed as per user request */}
      {/* {hasOpportunity && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('tradingPlan')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-md bg-green-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block ltr:mr-1 rtl:ml-1 text-green-600 dark:text-green-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                      {t('buySignal')}
                    </div>
                    <div className="flex flex-wrap justify-center items-baseline gap-x-2">
                        {stock.entryPoints.map((point, index) => (
                            <span key={index} className="text-green-600 dark:text-green-300 font-mono text-lg font-bold">${point.toFixed(2)}</span>
                        ))}
                    </div>
                </div>
                <div className="p-2 rounded-md bg-cyan-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block ltr:mr-1 rtl:ml-1 text-cyan-600 dark:text-cyan-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                      {t('targetPriceSellSignal')}
                    </div>
                    <span className="text-cyan-600 dark:text-cyan-300 font-mono text-lg font-bold">${stock.targetPrice.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-md bg-red-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block ltr:mr-1 rtl:ml-1 text-red-600 dark:text-red-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                      {t('stopLossSellSignal')}
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-mono text-lg font-bold">${stock.stopLoss.toFixed(2)}</span>
                </div>
            </div>
            <p className="text-xs text-center text-gray-500 pt-2">{t('disclaimer')}</p>
        </div>
      )} */}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('detailedAnalysis')}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{stock.analysis}</p>
      </div>

      <div className="mt-auto pt-4">
         <button
            onClick={() => setShowChart(!showChart)}
            className="w-full text-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-cyan-700 dark:text-cyan-300 font-semibold rounded-lg transition-colors duration-300"
        >
            {showChart ? t('hideChart') : t('showChart')}
        </button>
      </div>

      <div className={`mt-4 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 transition-all duration-500 ease-in-out
        ${showChart ? 'max-h-[320px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
          {showChart && (
            // Removed chart interval selection buttons as per user request
            <iframe
              src={`https://s.tradingview.com/widgetembed/?symbol=${stock.ticker}&interval=D&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=[]&disabled_features=[]&locale=${isRTL ? 'ar_AE' : 'en'}&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${stock.ticker}`}
              className="w-full h-[280px] border-0"
              title={`${stock.ticker} Chart`}
              allowFullScreen
            ></iframe>
          )}
        </div>
    </div>
  );
};

export default StockCard;