import React, { useState } from 'react';
import type { StockOpportunity } from '../types';
import { formatNumber } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

interface StockCardProps {
  stock: StockOpportunity;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const [showChart, setShowChart] = useState(false);
  const { t, language, isRTL } = useLanguage();

  const isDebtCompliant = stock.debtToAssetsRatio <= 30;
  const isInterestCompliant = stock.interestIncomeRatio <= 5;
  // Ensure entryPoints is an array before checking its length and values
  const hasOpportunity = Array.isArray(stock.entryPoints) && stock.entryPoints.length > 0 && stock.entryPoints[0] > 0;


  const numberSuffixes = {
    trillion: t('trillion'),
    billion: t('billion'),
    million: t('million'),
    thousand: t('thousand'),
  };

  const ComplianceIndicator: React.FC<{ isCompliant: boolean, label: string, value: string }> = ({ isCompliant, label, value }) => (
    <div className={`flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-lg ${isCompliant ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
      {isCompliant ? (
        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className={`font-mono font-bold ${isCompliant ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{stock.companyName}</h2>
          <p className="text-lg font-mono text-cyan-600 dark:text-cyan-400">{stock.ticker}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-400 mb-2">
          <div className="p-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg"><span className="font-semibold text-gray-600 dark:text-gray-300">{t('stockPrice')}:</span> <span className="font-mono">${stock.price.toFixed(2)}</span></div>
          <div className="p-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg"><span className="font-semibold text-gray-600 dark:text-gray-300">{t('stockLiquidity')}:</span> <span className="font-mono">{formatNumber(stock.volume, language, numberSuffixes)}</span></div>
          <div className="p-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg col-span-2 md:col-span-1"><span className="font-semibold text-gray-600 dark:text-gray-300">{t('stockMarketCap')}:</span> <span className="font-mono">{formatNumber(stock.marketCap, language, numberSuffixes)}</span></div>
      </div>

      {stock.priceDataDate && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">
            {t('priceAsOf', { date: stock.priceDataDate })}
          </p>
      )}

       <div className="mb-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('shariaCompliance')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ComplianceIndicator isCompliant={isDebtCompliant} label={t('debt')} value={`${stock.debtToAssetsRatio.toFixed(1)}%`} />
            <ComplianceIndicator isCompliant={isInterestCompliant} label={t('interest')} value={`${stock.interestIncomeRatio.toFixed(1)}%`} />
        </div>
         {stock.financialsDate && (
             <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                {t('financialsAsOf', { date: stock.financialsDate })}
            </p>
        )}
      </div>
      
      <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('technicalSummary')}</h3>
          <p className="text-gray-600 dark:text-gray-400 font-medium p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">{stock.reason}</p>
      </div>

      {hasOpportunity && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('tradingPlan')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-md bg-green-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('entryPoints')}</div>
                    <div className="flex flex-wrap justify-center items-baseline gap-x-2">
                        {stock.entryPoints.map((point, index) => (
                            <span key={index} className="text-green-600 dark:text-green-300 font-mono text-lg font-bold">${point.toFixed(2)}</span>
                        ))}
                    </div>
                </div>
                <div className="p-2 rounded-md bg-cyan-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('targetPrice')}</div>
                    <span className="text-cyan-600 dark:text-cyan-300 font-mono text-lg font-bold">${stock.targetPrice.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-md bg-red-500/10">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('stopLoss')}</div>
                    <span className="text-red-600 dark:text-red-400 font-mono text-lg font-bold">${stock.stopLoss.toFixed(2)}</span>
                </div>
            </div>
            <p className="text-xs text-center text-gray-500 pt-2">{t('disclaimer')}</p>
        </div>
      )}

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

      {showChart && (
        <div className="mt-4 h-96 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=${stock.ticker}&interval=D&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=[]&disabled_features=[]&locale=${isRTL ? 'ar_AE' : 'en'}&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${stock.ticker}`}
            className="w-full h-full border-0"
            title={`${stock.ticker} Chart`}
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default StockCard;