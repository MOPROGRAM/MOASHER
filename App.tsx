import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { fetchStockOpportunities, fetchSingleStockAnalysis, PriceRange } from './services/geminiService';
import type { StockOpportunity } from './types';
import StockCard from './components/StockCard';
import LoadingSpinner from './components/LoadingSpinner';
import { useLanguage } from './contexts/LanguageContext';
import ThemeToggle from './components/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher';
import ApiKeyRequiredPrompt from './components/ApiKeyRequiredPrompt';


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
  const [currentSearchAbortController, setCurrentSearchAbortController] = useState<AbortController | null>(null);
  
  // State for single stock analysis
  const [tickerInput, setTickerInput] = useState('');
  const [singleStockResult, setSingleStockResult] = useState<StockOpportunity | null>(null);
  const [isSingleStockLoading, setIsSingleStockLoading] = useState(false);
  const [singleStockError, setErrorSingleStockError] = useState<string | null>(null);
  const [currentSingleStockAbortController, setCurrentSingleStockAbortController] = useState<AbortController | null>(null);


  const { t, language } = useLanguage();

  // Filter state for actionable opportunities
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false); // Filters start hidden now
  const [showOnlyActionableOpportunities, setShowOnlyActionableOpportunities] = useState<boolean>(true); // Always true and disabled

  // Price range is now a PRE-FETCH parameter
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange>('all');

  // API Key selection state
  const [hasApiKeySelected, setHasApiKeySelected] = useState<boolean>(false);

  // Reusable function to check API key status
  const checkApiKeyStatus = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const keySelected = await window.aistudio.hasSelectedApiKey();
      setHasApiKeySelected(keySelected);
    } else {
      // If window.aistudio is not available, it means we are likely not in the expected environment
      // or there's an issue with the iframe integration.
      // In this case, we MUST set it to false to ensure the prompt is shown.
      console.warn("window.aistudio or hasSelectedApiKey is not available. Forcing API key prompt.");
      setHasApiKeySelected(false);
    }
  }, []);

  // Effect to check API key on mount and when dependencies change (though checkApiKeyStatus is stable)
  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]); // Run on mount

  const resetFilters = () => {
    setShowOnlyActionableOpportunities(true);
    // Note: selectedPriceRange is now a pre-fetch parameter, so resetting it here
    // would only affect the next fetch, not current filtered results.
    // For now, it's explicitly reset before fetch.
  };
  
  const handleCancelSearch = useCallback(() => {
    if (currentSearchAbortController) {
      currentSearchAbortController.abort();
      setError(t('searchCancelled'));
      setIsLoading(false);
      setCurrentSearchAbortController(null);
    }
  }, [currentSearchAbortController, t]);

  const handleFetchStocks = useCallback(async () => {
    if (!hasApiKeySelected) {
        setError(t('apiKeyRequired')); // Error before even trying to call service
        return;
    }
    setIsLoading(true);
    setError(null);
    setAllStocks([]);
    setSingleStockResult(null); // Clear single stock result
    resetFilters(); // Reset client-side filters

    const controller = new AbortController();
    setCurrentSearchAbortController(controller);

    try {
      // Pass selectedPriceRange to the service
      const opportunities = await fetchStockOpportunities(language, selectedPriceRange, controller.signal);
      setAllStocks(opportunities);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(t('searchCancelled'));
        } else if (err.message === "API_KEY_NOT_SET") { // Handle specific error from service
          setError(t('apiKeyNotSetError'));
          setHasApiKeySelected(false); // Reset key selection state
        } else if (err.message === "API_KEY_PERMISSION_DENIED") { // Handle specific error from service
          setError(t('apiKeyPermissionDeniedError'));
          setHasApiKeySelected(false); // Reset key selection state
        }
        else {
          // For any other error, assume API key might be the issue or connection problem
          setError(err.message);
          setHasApiKeySelected(false); // Force re-selection prompt
        }
      } else {
        setError("An unexpected error occurred.");
        setHasApiKeySelected(false); // Force re-selection prompt
      }
    } finally {
      setIsLoading(false);
      setCurrentSearchAbortController(null);
    }
  }, [language, selectedPriceRange, hasApiKeySelected, t]);
  
  const handleCancelSingleStockAnalysis = useCallback(() => {
    if (currentSingleStockAbortController) {
      currentSingleStockAbortController.abort();
      setErrorSingleStockError(t('analysisCancelled'));
      setIsSingleStockLoading(false);
      setCurrentSingleStockAbortController(null);
    }
  }, [currentSingleStockAbortController, t]);

  const handleAnalyzeSingleStock = useCallback(async () => {
    if (!tickerInput.trim()) return;
    if (!hasApiKeySelected) {
        setErrorSingleStockError(t('apiKeyRequired')); // Error before even trying to call service
        return;
    }
    setIsSingleStockLoading(true);
    setErrorSingleStockError(null);
    setSingleStockResult(null);
    setAllStocks([]); // Clear opportunity list

    const controller = new AbortController();
    setCurrentSingleStockAbortController(controller);

    try {
      const result = await fetchSingleStockAnalysis(tickerInput.trim().toUpperCase(), language, controller.signal);
      setSingleStockResult(result);
    } catch (err) {
       if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setErrorSingleStockError(t('analysisCancelled'));
        } else if (err.message === "API_KEY_NOT_SET") { // Handle specific error from service
          setErrorSingleStockError(t('apiKeyNotSetError'));
          setHasApiKeySelected(false); // Reset key selection state
        } else if (err.message === "API_KEY_PERMISSION_DENIED") { // Handle specific error from service
          setErrorSingleStockError(t('apiKeyPermissionDeniedError'));
          setHasApiKeySelected(false); // Reset key selection state
        }
        else {
          // For any other error, assume API key might be the issue or connection problem
          setErrorSingleStockError(err.message);
          setHasApiKeySelected(false); // Force re-selection prompt
        }
      } else {
        setErrorSingleStockError("An unexpected error occurred during analysis.");
        setHasApiKeySelected(false); // Force re-selection prompt
      }
    } finally {
      setIsSingleStockLoading(false);
      setCurrentSingleStockAbortController(null);
    }
  }, [tickerInput, language, hasApiKeySelected, t]);


  useEffect(() => {
    let stocksToProcess = [...allStocks];
    
    // Filter for actionable opportunities (always active)
    if (showOnlyActionableOpportunities) { 
        stocksToProcess = stocksToProcess.filter(stock => 
            Array.isArray(stock.entryPoints) && stock.entryPoints.length > 0 && stock.entryPoints[0] > 0
        );
    }

    // Client-side price range filter is REMOVED as it's now a pre-fetch parameter
    // The Gemini API should already return stocks within the selected price range.

    // Sort by the lowest entry price first
    stocksToProcess.sort((a, b) => {
        const priceA = a.entryPoints && a.entryPoints.length > 0 ? a.entryPoints[0] : Infinity;
        const priceB = b.entryPoints && b.entryPoints.length > 0 ? b.entryPoints[0] : Infinity;
        return priceA - priceB;
    });

    setFilteredStocks(stocksToProcess);
  }, [allStocks, showOnlyActionableOpportunities]); // selectedPriceRange removed from dependencies here

  // Effect to re-fetch data when language changes, only if API key is selected
  useEffect(() => {
    // Only attempt to re-fetch if an API key has been selected AND
    // if there was previous content to avoid unnecessary re-fetches on initial load or if no content was ever loaded.
    // Also, ensure no loading is currently active to prevent multiple calls
    if (hasApiKeySelected && !isLoading && !isSingleStockLoading && (allStocks.length > 0 || singleStockResult)) {
        // If there's currently a single stock analysis result, re-analyze it
        if (singleStockResult && tickerInput.trim()) {
            handleAnalyzeSingleStock();
        } 
        // Otherwise, if there are general stock opportunities, re-fetch them
        else if (allStocks.length > 0) {
            handleFetchStocks();
        }
    }
  }, [language, handleFetchStocks, handleAnalyzeSingleStock, allStocks.length, singleStockResult, tickerInput, isLoading, isSingleStockLoading, hasApiKeySelected]);


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
      
        {/* API Key Required Prompt */}
        {!hasApiKeySelected && (
            <div className="mb-12">
                <ApiKeyRequiredPrompt onApiKeySelected={checkApiKeyStatus} />
            </div>
        )}
      
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
                    disabled={!hasApiKeySelected || isSingleStockLoading}
                />
                <button
                    onClick={isSingleStockLoading ? handleCancelSingleStockAnalysis : handleAnalyzeSingleStock}
                    disabled={!tickerInput || !hasApiKeySelected}
                    className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-400 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                    aria-label={isSingleStockLoading ? t('cancelButton') : t('analyzeButton')}
                >
                    {isSingleStockLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('cancelButton')}</span>
                        </>
                    ) : (
                        <span>{t('analyzeButton')}</span>
                    )}
                </button>
            </div>
        </div>
        
        <div className="text-center mb-12 text-gray-500 dark:text-gray-400">{t('or')}</div>

        {/* --- Price Range Selection (Pre-fetch) --- */}
        <div className="mb-8 p-6 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg max-w-xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-center">{t('selectPriceRangeForSearch')}</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <select
                    id="price-range-pre-fetch"
                    value={selectedPriceRange}
                    onChange={(e) => setSelectedPriceRange(e.target.value as PriceRange)}
                    className="flex-grow w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-cyan-500 focus:border-cyan-500"
                    aria-label={t('priceRange')}
                    disabled={!hasApiKeySelected || isLoading}
                >
                    <option value="all">{t('allPrices')}</option>
                    <option value="0-5">{t('priceRange0_5')}</option>
                    <option value="5-10">{t('priceRange5_10')}</option>
                    <option value="10-20">{t('priceRange10_20')}</option>
                    <option value="20-50">{t('priceRange20_50')}</option>
                    <option value="50-100">{t('priceRange50_100')}</option>
                    <option value="100-200">{t('priceRange100_200')}</option>
                    <option value="200+">{t('priceRange200_plus')}</option>
                </select>
            </div>
        </div>

        <div className="flex justify-center mb-12">
          <button
            onClick={isLoading ? handleCancelSearch : handleFetchStocks}
            disabled={!hasApiKeySelected}
            className="px-8 py-4 bg-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-400 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-3"
            aria-label={isLoading ? t('cancelButton') : t('updateButton')}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('cancelButton')}</span>
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
                {/* Add a specific message/action if the error suggests API key re-selection */}
                {(!hasApiKeySelected && window.aistudio && typeof window.aistudio.openSelectKey === 'function') && (
                    <button 
                        onClick={async () => {
                            if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                                await window.aistudio.openSelectKey();
                                await checkApiKeyStatus(); // Re-check after user interacts with dialog
                            }
                        }}
                        className="mt-4 block mx-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-300 transform hover:scale-105"
                        aria-label={t('selectApiKeyAgain')}
                    >
                        {t('selectApiKeyAgain')}
                    </button>
                )}
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
            <div className="text-center mb-4">
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
                            // Always true for this app as per user request to only show actionable
                            onChange={() => setShowOnlyActionableOpportunities(true)} 
                            className="form-checkbox h-5 w-5 text-cyan-600 dark:text-cyan-400 rounded focus:ring-cyan-500"
                            aria-label={t('showOnlyActionableOpportunities')}
                            disabled // Disable checkbox as it's always true
                        />
                        <span>{t('showOnlyActionableOpportunities')}</span>
                    </label>
                    {/* Price Range Filter removed from here, now a pre-fetch parameter */}
                </div>
                <div className="flex flex-wrap gap-4 justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={resetFilters} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">
                    {t('resetFilters')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-center bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">
            <strong className="font-bold">{t('errorOccurred')}</strong>
            <span className="block sm:inline ltr:ml-2 rtl:mr-2">{error}</span>
            {/* Add a specific message/action if the error suggests API key re-selection */}
            {(!hasApiKeySelected && window.aistudio && typeof window.aistudio.openSelectKey === 'function') && (
                <button 
                    onClick={async () => {
                        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                            await window.aistudio.openSelectKey();
                            await checkApiKeyStatus(); // Re-check after user interacts with dialog
                        }
                    }}
                    className="mt-4 block mx-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-300 transform hover:scale-105"
                    aria-label={t('selectApiKeyAgain')}
                >
                    {t('selectApiKeyAgain')}
                </button>
            )}
          </div>
        )}
        
        {!isLoading && !isSingleStockLoading && !error && !singleStockError && allStocks.length === 0 && !singleStockResult && hasApiKeySelected && (
           <div className="text-center text-gray-500 dark:text-gray-500 py-16">
             <p className="text-xl">{t('getStarted')}</p>
           </div>
        )}
         {!isLoading && !isSingleStockLoading && !error && !singleStockError && allStocks.length === 0 && !singleStockResult && !hasApiKeySelected && (
           <div className="text-center text-gray-500 dark:text-gray-500 py-16">
             <p className="text-xl">{t('apiKeyInstructionsInitial')}</p>
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
        {/* Sharia Compliance Disclaimer moved to the footer */}
        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg flex flex-col items-center space-y-2 rtl:space-x-reverse shadow-sm max-w-2xl mx-auto" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium leading-relaxed max-w-prose text-center">{t('shariaDisclaimer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;