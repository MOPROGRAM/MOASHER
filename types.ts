export interface StockOpportunity {
  companyName: string;
  ticker: string;
  exchange: string | null; // Added to help TradingView resolve symbols
  price: number | null; // Will not be provided by Gemini
  sector: string | null; // Will not be provided by Gemini
  volume: number | null; // Will not be provided by Gemini
  marketCap: number | null; // Will not be provided by Gemini
  reason: string;
  analysis: string;
  entryPoints: number[];
  stopLoss: number;
  targetPrice: number;
  debtToAssetsRatio: number | null; // Will not be provided by Gemini
  interestIncomeRatio: number | null; // Will not be provided by Gemini
  financialsDate: string | null; // Will not be provided by Gemini
  priceDataDate: string | null; // Will not be provided by Gemini
}