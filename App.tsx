import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { fetchStockOpportunities, fetchSingleStockAnalysis } from './services/geminiService';
import type { StockOpportunity } from './types';
import StockCard from './components/StockCard';
import LoadingSpinner from './components/LoadingSpinner';
import { useLanguage } from './contexts/LanguageContext';
import ThemeToggle from './components/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';

// This is a mock component to allow interpolation in the translation strings.
// A real library like react-i18next would provide this.
const I18nComponent = ({ i18nKey, values }: {i18nKey: string, values: any}) => {
    const { t } = useLanguage();
    const text = t(i18nKey, values);
    const parts = text.split(/<1>|<\/1>/);
    return (
        <p className='text-gray-500 dark:text-gray-400'>
            {parts.map((part, index) => 
                index === 1 
                ? <span key={index} className='font-bold text-cyan-600 dark:text-cyan-400'>{part}</span> 
                : part
            )}
        </p>
    );
};


const App: React.FC = () => {
  // State for opportunity discovery
  const [allStocks, setAllStocks] = useState<StockOpportunity[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for single stock analysis
  const [tickerInput, setTickerInput] = useState('');
  const [singleStockResult, setSingleStockResult] = useState<StockOpportunity | null>(null);
  const [isSingleStockLoading, setIsSingleStockLoading] = useState(false);
  const [singleStockError, setSingleStockError] = useState<string | null>(null);

  const { t, language } = useLanguage();

  // Filter state for actionable opportunities
  // Removed filtersVisible state as per user request to always show actionable opportunities
  const [showOnlyActionableOpportunities, setShowOnlyActionableOpportunities] = useState<boolean>(true);


  // Removed all sector, sort, market cap, volume, debt, interest filters
  // const sectors = useMemo(() => {
  //   if (allStocks.length === 0) return [];
  //   const uniqueSectors = new Set(allStocks.map(stock => stock.sector));
  //   return ['all', ...Array.from(uniqueSectors).sort()];
  // }, [allStocks]);

  const resetFilters = () => {
    setShowOnlyActionableOpportunities(true);
  };
  
  const handleFetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAllStocks([]);
    setSingleStockResult(null); // Clear single stock result
    resetFilters();
    try {
      const opportunities = await fetchStockOpportunities(language);
      setAllStocks(opportunities);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [language]);
  
  const handleAnalyzeSingleStock = useCallback(async () => {
    if (!tickerInput.trim()) return;
    setIsSingleStockLoading(true);
    setSingleStockError(null);
    setSingleStockResult(null);
    setAllStocks([]); // Clear opportunity list
    try {
      const result = await fetchSingleStockAnalysis(tickerInput.trim().toUpperCase(), language);
      setSingleStockResult(result);
    } catch (err) {
       if (err instanceof Error) {
        setSingleStockError(err.message);
      } else {
        setSingleStockError("An unexpected error occurred during analysis.");
      }
    } finally {
      setIsSingleStockLoading(false);
    }
  }, [tickerInput, language]);


  // applyShariaDefaults is no longer relevant without numerical filters
  // const applyShariaDefaults = () => {
  //   setMaxDebtRatio('30');
  //   setMaxInterestRatio('5');
  //   setMinVolume('1000000');
  // };

  useEffect(() => {
    let stocksToProcess = [...allStocks];
    // Filter for actionable opportunities (always active)
    // This filter is always active now as per user request to only show swing low opportunities
    if (showOnlyActionableOpportunities) { // This condition will always be true
        stocksToProcess = stocksToProcess.filter(stock => 
            Array.isArray(stock.entryPoints) && stock.entryPoints.length > 0 && stock.entryPoints[0] > 0
        );
    }

    // Sort by the lowest entry price first
    stocksToProcess.sort((a, b) => {
        const priceA = a.entryPoints && a.entryPoints.length > 0 ? a.entryPoints[0] : Infinity;
        const priceB = b.entryPoints && b.entryPoints.length > 0 ? b.entryPoints[0] : Infinity;
        return priceA - priceB;
    });

    // Removed all other filtering logic
    setFilteredStocks(stocksToProcess);
  }, [allStocks, showOnlyActionableOpportunities]);

  // Removed FilterInput component as numerical filters are gone
  // const FilterInput: React.FC<{label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, placeholder?: string, min?: number, max?: number}> = 
  //   ({label, id, value, onChange, type="number", placeholder, min, max}) => (
  //   <div>
  //     <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
  //     <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max}
  //            className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500" />
  //   </div>
  // );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className='text-left rtl:text-right'>
           <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('pageDescription')}
          </p>
        </div>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
      
        {/* --- Single Stock Analysis Section --- */}
        <div className="mb-12 p-6 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-2 text-center">{t('analyzeSpecificStockTitle')}</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{t('analyzeSpecificStockDescription')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    placeholder={t('tickerPlaceholder')}
                    className="flex-grow w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500 uppercase"
                />
                <button
                    onClick={handleAnalyzeSingleStock}
                    disabled={isSingleStockLoading || !tickerInput}
                    className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-400 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isSingleStockLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('analyzingButton')}</span>
                        </>
                    ) : (
                        <span>{t('analyzeButton')}</span>
                    )}
                </button>
            </div>
        </div>
        
        <div className="text-center mb-12 text-gray-500 dark:text-gray-400">{t('or')}</div>

        <div className="flex justify-center mb-12">
          <button
            onClick={handleFetchStocks}
            disabled={isLoading}
            className="px-8 py-4 bg-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-400 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-3"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('searchingButton')}</span>
              </>
            ) : (
              <span>{t('updateButton')}</span>
            )}
          </button>
        </div>
        
        {(isSingleStockLoading || isLoading) && <LoadingSpinner />}
        
        {singleStockError && (
             <div className="text-center bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto mb-8" role="alert">
                <strong className="font-bold">{t('errorOccurred')}</strong>
                <span className="block sm:inline ltr:ml-2 rtl:mr-2">{singleStockError}</span>
            </div>
        )}

        {singleStockResult && !isSingleStockLoading && (
            <div className="max-w-3xl mx-auto mb-8">
                <h2 className="text-2xl font-bold mb-4 text-center">{t('analysisResultTitle')}</h2>
                <StockCard stock={singleStockResult} initialShowChart={true} />
            </div>
        )}


        {allStocks.length > 0 && !isLoading && (
          <div className="max-w-5xl mx-auto mb-8">
            {/* Removed filter visibility button and filter UI as only actionable opportunities are shown */}
            {/* <div className="text-center mb-4">
              <button onClick={() => setFiltersVisible(!filtersVisible)} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                {filtersVisible ? t('hideFilters') : t('showFilters')}
              </button>
            </div>
            {filtersVisible && (
              <div className="p-6 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-center">{t('filterAndSort')}</h3>
                <div className="flex flex-wrap gap-4 justify-center mb-6">
                   <label htmlFor="actionable-filter" className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
                        <input
                            id="actionable-filter"
                            type="checkbox"
                            checked={showOnlyActionableOpportunities}
                            onChange={(e) => setShowOnlyActionableOpportunities(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-cyan-600 dark:text-cyan-400 rounded focus:ring-cyan-500"
                        />
                        <span>{t('showOnlyActionableOpportunities')}</span>
                    </label>
                </div>
                <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={resetFilters} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">
                    {t('resetFilters')}
                  </button>
                </div>
              </div>
            )} */}
          </div>
        )}

        {error && (
          <div className="text-center bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">
            <strong className="font-bold">{t('errorOccurred')}</strong>
            <span className="block sm:inline ltr:ml-2 rtl:mr-2">{error}</span>
          </div>
        )}
        
        {!isLoading && !isSingleStockLoading && !error && !singleStockError && allStocks.length === 0 && !singleStockResult && (
           <div className="text-center text-gray-500 dark:text-gray-500 py-16">
             <p className="text-xl">{t('getStarted')}</p>
           </div>
        )}

        {!isLoading && allStocks.length > 0 && (
          <>
            <div className='text-center mb-6'>
                <I18nComponent i18nKey="foundOpportunities" values={{ count: filteredStocks.length }} />
            </div>
            {filteredStocks.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-500 py-16">
                    <p className="text-xl">{t('noResults')}</p>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredStocks.map((stock, index) => (
                <StockCard key={`${stock.ticker}-${index}`} stock={stock} isListContext={true} initialShowChart={true} style={{ animationDelay: `${index * 0.1}s` }} />
            ))}
            </div>
          </>
        )}

      </main>

       <footer className="text-center mt-12 py-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          {t('footerText')}
        </p>
      </footer>
    </div>
  );
};

export default App;