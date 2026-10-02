export type AssetClass = 'Forex' | 'Crypto' | 'Metals' | 'Indices' | 'Commodities' | 'Stocks';

export type Instrument = {
  symbol: string;
  display: string;
  assetClass: AssetClass;
  providerSymbol?: string;
  status: 'HISTORICAL AVAILABLE' | 'UNAVAILABLE';
  quoteCurrency?: string;
};

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export interface MarketDataProvider {
  getInstruments(): Promise<Instrument[]>;
  searchInstruments(query: string, assetClass?: AssetClass | 'All'): Promise<Instrument[]>;
  getHistoricalBars(symbol: string, timeframe: string): Promise<{ bars: Bar[]; state: 'HISTORICAL DATA' | 'UNAVAILABLE'; source?: string }>;
}

export const instrumentRegistry: Instrument[] = [
  { symbol: 'BTC/USDT', display: 'BTC/USDT', assetClass: 'Crypto', providerSymbol: 'BTCUSDT', status: 'HISTORICAL AVAILABLE', quoteCurrency: 'USDT' },
  { symbol: 'ETH/USDT', display: 'ETH/USDT', assetClass: 'Crypto', providerSymbol: 'ETHUSDT', status: 'HISTORICAL AVAILABLE', quoteCurrency: 'USDT' },
  { symbol: 'BNB/USDT', display: 'BNB/USDT', assetClass: 'Crypto', providerSymbol: 'BNBUSDT', status: 'HISTORICAL AVAILABLE', quoteCurrency: 'USDT' },
  { symbol: 'SOL/USDT', display: 'SOL/USDT', assetClass: 'Crypto', providerSymbol: 'SOLUSDT', status: 'HISTORICAL AVAILABLE', quoteCurrency: 'USDT' },
  { symbol: 'EUR/USD', display: 'EUR/USD', assetClass: 'Forex', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
  { symbol: 'GBP/USD', display: 'GBP/USD', assetClass: 'Forex', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
  { symbol: 'USD/JPY', display: 'USD/JPY', assetClass: 'Forex', status: 'UNAVAILABLE', quoteCurrency: 'JPY' },
  { symbol: 'XAU/USD', display: 'XAU/USD', assetClass: 'Metals', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
  { symbol: 'XAG/USD', display: 'XAG/USD', assetClass: 'Metals', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
  { symbol: 'US 500', display: 'US 500', assetClass: 'Indices', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
  { symbol: 'Brent', display: 'Brent', assetClass: 'Commodities', status: 'UNAVAILABLE', quoteCurrency: 'USD' },
];

export const browserMarketDataProvider: MarketDataProvider = {
  async getInstruments() { return instrumentRegistry; },
  async searchInstruments(query, assetClass = 'All') {
    const needle = query.trim().toLowerCase();
    return instrumentRegistry.filter((item) => (assetClass === 'All' || item.assetClass === assetClass) && (!needle || `${item.symbol} ${item.display} ${item.assetClass}`.toLowerCase().includes(needle)));
  },
  async getHistoricalBars(symbol, timeframe) {
    const response = await fetch(`/api/market/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(timeframe)}`);
    if (!response.ok) return { bars: [], state: 'UNAVAILABLE' };
    const payload = await response.json() as { bars?: Bar[]; state?: 'HISTORICAL DATA' | 'UNAVAILABLE'; source?: string };
    return { bars: payload.bars || [], state: payload.state || 'UNAVAILABLE', source: payload.source };
  },
};
