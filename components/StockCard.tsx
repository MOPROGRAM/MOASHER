import React, { useState } from 'react';
import type { StockOpportunity } from '../types';
import { formatNumber } from '../utils/formatters';

interface StockCardProps {
  stock: StockOpportunity;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-lg p-6 transition-all duration-300 hover:border-cyan-400 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{stock.companyName}</h2>
          <p className="text-lg font-mono text-cyan-400">{stock.ticker}</p>
        </div>
        <div className="bg-cyan-500/20 text-cyan-300 text-sm font-bold px-4 py-2 rounded-full border border-cyan-500 whitespace-nowrap">
          فرصة قاع السوينج
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 mb-4">
        <span className="bg-gray-700 px-3 py-1 rounded-full">القطاع: {stock.sector}</span>
        <span className="bg-gray-700 px-3 py-1 rounded-full">السعر: ${stock.price.toFixed(2)}</span>
        <span className="bg-gray-700 px-3 py-1 rounded-full">السيولة: {formatNumber(stock.volume)}</span>
        <span className="bg-gray-700 px-3 py-1 rounded-full">القيمة السوقية: {formatNumber(stock.marketCap)}</span>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">سبب الفرصة:</h3>
        <p className="text-gray-400">{stock.reason}</p>
      </div>

      <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">خطة التداول المقترحة:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {/* Entry Points */}
            <div className="p-2 rounded-md bg-gray-600/50">
                <div className="text-sm text-gray-400">🎯 نقاط الدخول</div>
                <div className="flex flex-wrap justify-center items-baseline gap-x-2">
                    {stock.entryPoints.map((point, index) => (
                        <span key={index} className="text-green-300 font-mono text-lg font-bold">
                            ${point.toFixed(2)}
                        </span>
                    ))}
                </div>
            </div>
            {/* Target Price */}
            <div className="p-2 rounded-md bg-gray-600/50">
                <div className="text-sm text-gray-400">📈 السعر المستهدف</div>
                <span className="text-cyan-300 font-mono text-lg font-bold">
                    ${stock.targetPrice.toFixed(2)}
                </span>
            </div>
            {/* Stop Loss */}
            <div className="p-2 rounded-md bg-gray-600/50">
                <div className="text-sm text-gray-400">🛑 وقف الخسارة</div>
                <span className="text-red-400 font-mono text-lg font-bold">
                    ${stock.stopLoss.toFixed(2)}
                </span>
            </div>
        </div>
         <p className="text-xs text-center text-gray-500 pt-2">الأسعار تتغير باستمرار. قم بتقييم الخطة بناءً على السعر الحالي في الشارت.</p>
      </div>


      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">التحليل المفصل:</h3>
        <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{stock.analysis}</p>
      </div>

      <div className="mt-auto pt-4">
         <button
            onClick={() => setShowChart(!showChart)}
            className="w-full text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold rounded-lg transition-colors duration-300"
        >
            {showChart ? 'إخفاء شارت TradingView' : 'إظهار شارت TradingView'}
        </button>
      </div>

      {showChart && (
        <div className="mt-4 h-96 w-full rounded-lg overflow-hidden border border-gray-600">
          <iframe
            src={`https://s.tradingview.com/widgetembed/?symbol=${stock.ticker}&interval=D&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=[]&disabled_features=[]&locale=ar_AE&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${stock.ticker}`}
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