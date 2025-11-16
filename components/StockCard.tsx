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
  // Removed chartInterval state as it's no longer controlled by custom buttons
  const { t, language, isRTL } = useLanguage();

  // Ensure entryPoints is an array before checking its length and values
  const hasOpportunity = Array.isArray(stock.entryPoints) && stock.entryPoints.length > 0 && stock.entryPoints[0] > 0;

  // Construct the TradingView symbol using exchange if available
  const tradingViewSymbol = stock.exchange ? `${stock.exchange}:${stock.ticker}` : stock.ticker;

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
            <>
              {/* Removed custom interval buttons. User will use native TradingView controls. */}
              <iframe
                src={`https://s.tradingview.com/widgetembed/?symbol=${tradingViewSymbol}&interval=240&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=[]&disabled_features=[]&locale=${isRTL ? 'ar_AE' : 'en'}&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${tradingViewSymbol}`}
                className="w-full h-[280px] border-0"
                title={`${stock.ticker} Chart`}
                allowFullScreen
              ></iframe>
            </>
          )}
        </div>
    </div>
  );
};

export default StockCard;