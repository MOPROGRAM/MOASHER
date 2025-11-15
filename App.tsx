import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { fetchStockOpportunities } from './services/geminiService';
import type { StockOpportunity } from './types';
import StockCard from './components/StockCard';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [allStocks, setAllStocks] = useState<StockOpportunity[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('default');

  const sectors = useMemo(() => {
    if (allStocks.length === 0) return [];
    const uniqueSectors = new Set(allStocks.map(stock => stock.sector));
    return ['all', ...Array.from(uniqueSectors).sort()];
  }, [allStocks]);

  const handleFetchStocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAllStocks([]);
    setSelectedSector('all');
    setSortOption('default');
    try {
      const opportunities = await fetchStockOpportunities();
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
  }, []);

  useEffect(() => {
    let stocksToProcess = [...allStocks];

    if (selectedSector !== 'all') {
      stocksToProcess = stocksToProcess.filter(stock => stock.sector === selectedSector);
    }

    switch (sortOption) {
      case 'price_desc':
        stocksToProcess.sort((a, b) => b.price - a.price);
        break;
      case 'price_asc':
        stocksToProcess.sort((a, b) => a.price - b.price);
        break;
      case 'volume_desc':
        stocksToProcess.sort((a, b) => b.volume - a.volume);
        break;
      case 'marketcap_desc':
        stocksToProcess.sort((a, b) => b.marketCap - b.marketCap);
        break;
      default:
        break;
    }
    
    setFilteredStocks(stocksToProcess);
  }, [allStocks, selectedSector, sortOption]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500 mb-2">
          مؤشر الفرص
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          تحليل يومي لفرص "قاع السوينج" في سوق الأسهم الأمريكي وفق الضوابط الشرعية
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-12">
          <button
            onClick={handleFetchStocks}
            disabled={isLoading}
            className="px-8 py-4 bg-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-3"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>جاري البحث...</span>
              </>
            ) : (
              <span>📈 تحديث مؤشر الفرص</span>
            )}
          </button>
        </div>
        
        {allStocks.length > 0 && !isLoading && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex-1 w-full sm:w-auto">
              <label htmlFor="sector-filter" className="block text-sm font-medium text-gray-300 mb-1">
                فرز حسب القطاع
              </label>
              <select 
                id="sector-filter"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {sectors.map(sector => (
                  <option key={sector} value={sector}>
                    {sector === 'all' ? 'كل القطاعات' : sector}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-300 mb-1">
                ترتيب حسب
              </label>
              <select
                id="sort-filter"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="default">الترتيب الأساسي</option>
                <option value="price_desc">السعر (الأعلى أولاً)</option>
                <option value="price_asc">السعر (الأدنى أولاً)</option>
                <option value="volume_desc">السيولة (الأعلى أولاً)</option>
                <option value="marketcap_desc">القيمة السوقية (الأعلى أولاً)</option>
              </select>
            </div>
          </div>
        )}

        {isLoading && <LoadingSpinner />}

        {error && (
          <div className="text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg max-w-2xl mx-auto" role="alert">
            <strong className="font-bold">حدث خطأ!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {!isLoading && !error && allStocks.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <p className="text-xl">اضغط على الزر أعلاه لبدء تحليل السوق وإيجاد أفضل الفرص.</p>
          </div>
        )}

        {!isLoading && allStocks.length > 0 && filteredStocks.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <p className="text-xl">لا توجد نتائج تطابق فلاتر البحث الحالية.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredStocks.map((stock, index) => (
            <StockCard key={`${stock.ticker}-${index}`} stock={stock} />
          ))}
        </div>
      </main>

       <footer className="text-center mt-12 py-4 border-t border-gray-800">
        <p className="text-gray-500">
          تم التطوير بواسطة مهندس React خبير. المحتوى مقدم لأغراض تعليمية فقط وليس نصيحة استثمارية.
        </p>
      </footer>
    </div>
  );
};

export default App;