export interface StockOpportunity {
  companyName: string;
  ticker: string;
  price: number;
  sector: string;
  volume: number;
  marketCap: number;
  reason: string;
  analysis: string;
  entryPoints: number[];
  stopLoss: number;
  targetPrice: number;
  debtToAssetsRatio: number;
  interestIncomeRatio: number;
  financialsDate: string;
  priceDataDate: string;
}