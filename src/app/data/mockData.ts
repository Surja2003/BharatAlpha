export const C = {
  bgPrimary: '#0A0F1E',
  bgSecondary: '#111827',
  bgTertiary: '#1C2537',
  border: '#1F2D45',
  green: '#00C896',
  red: '#FF4D6A',
  blue: '#3B82F6',
  gold: '#F59E0B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
};

export type Signal = 'BUY' | 'SELL' | 'HOLD' | 'WATCH';

export interface IndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePct: number;
}

export interface StockRow {
  rank: number;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  marketCap: number;
  pe: number;
  roe: number;
  signal: Signal;
  bharatAlphaScore: number;
  sparkline: number[];
  volume: number;
  high52w: number;
  low52w: number;
}

export interface MutualFund {
  id: string;
  name: string;
  amc: string;
  category: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  aum: number;
  expenseRatio: number;
  bharatAlphaScore: number;
  minSip: number;
  color: string;
}

export interface NewsItem {
  id: string;
  source: string;
  timeAgo: string;
  headline: string;
  ticker: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface AISignalCard {
  type: 'BUY' | 'SELL' | 'GEM' | 'SIP';
  symbol: string;
  name: string;
  sector: string;
  signalLabel: string;
  confidence: number;
  reason: string;
  target: number;
  stopLoss: number;
  price: number;
  color: string;
}

// ──────────────────────────────────────────────
// INDICES
// ──────────────────────────────────────────────
export const indices: IndexData[] = [
  { name: 'NIFTY 50', symbol: 'NIFTY', value: 22458.35, change: 187.45, changePct: 0.84 },
  { name: 'SENSEX', symbol: 'SENSEX', value: 73851.44, change: 612.30, changePct: 0.84 },
  { name: 'BANK NIFTY', symbol: 'BANKNIFTY', value: 48234.10, change: -134.20, changePct: -0.28 },
  { name: 'NIFTY IT', symbol: 'NIFTYIT', value: 35672.40, change: 456.80, changePct: 1.30 },
  { name: 'NIFTY MIDCAP', symbol: 'NIFTYMID', value: 41230.60, change: 312.50, changePct: 0.76 },
  { name: 'NIFTY SMALLCAP', symbol: 'NIFTYSC', value: 14892.30, change: 98.40, changePct: 0.67 },
];

// ──────────────────────────────────────────────
// PORTFOLIO SPARKLINE (7 days)
// ──────────────────────────────────────────────
export const portfolioSparkline = [
  { day: 'Mon', value: 120240 },
  { day: 'Tue', value: 119800 },
  { day: 'Wed', value: 121500 },
  { day: 'Thu', value: 122100 },
  { day: 'Fri', value: 121800 },
  { day: 'Sat', value: 123200 },
  { day: 'Sun', value: 124580 },
];

// ──────────────────────────────────────────────
// AI SIGNAL CARDS
// ──────────────────────────────────────────────
export const aiSignalCards: AISignalCard[] = [
  {
    type: 'BUY',
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    sector: 'Energy',
    signalLabel: 'Strong Buy',
    confidence: 87,
    reason: 'RSI oversold + earnings beat pattern',
    target: 3100,
    stopLoss: 2680,
    price: 2847.50,
    color: '#00C896',
  },
  {
    type: 'SELL',
    symbol: 'ADANIENT',
    name: 'Adani Enterprises',
    sector: 'Conglomerate',
    signalLabel: 'Avoid',
    confidence: 76,
    reason: 'Bearish divergence + FII selling pressure',
    target: 2200,
    stopLoss: 2680,
    price: 2480.30,
    color: '#FF4D6A',
  },
  {
    type: 'GEM',
    symbol: 'KPRMILL',
    name: 'KPR Mill Ltd',
    sector: 'Textiles',
    signalLabel: 'Hidden Gem',
    confidence: 82,
    reason: 'Strong Q3 results + export order book surge',
    target: 980,
    stopLoss: 780,
    price: 845.60,
    color: '#F59E0B',
  },
  {
    type: 'SIP',
    symbol: 'MIRAE_LC',
    name: 'Mirae Asset Large Cap',
    sector: 'Mutual Fund',
    signalLabel: 'SIP Pick',
    confidence: 91,
    reason: '5Y CAGR: 16.2% • Low expense ratio 0.54%',
    target: 0,
    stopLoss: 0,
    price: 0,
    color: '#3B82F6',
  },
];

// ──────────────────────────────────────────────
// STOCKS DATA
// ──────────────────────────────────────────────
const mkSparkline = (start: number, trend: 'up' | 'down' | 'flat') => {
  const pts: number[] = [];
  let v = start;
  for (let i = 0; i < 8; i++) {
    const bias = trend === 'up' ? 0.006 : trend === 'down' ? -0.006 : 0;
    v *= 1 + bias + (Math.random() - 0.5) * 0.012;
    pts.push(Math.round(v * 100) / 100);
  }
  return pts;
};

export const allStocks: StockRow[] = [
  { rank: 1, symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2847.50, change: 34.20, changePct: 1.22, marketCap: 1928430, pe: 27.4, roe: 8.9, signal: 'BUY', bharatAlphaScore: 84, sparkline: mkSparkline(2720, 'up'), volume: 8456293, high52w: 3024.90, low52w: 2220.30 },
  { rank: 2, symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 3542.30, change: 67.80, changePct: 1.95, marketCap: 1298760, pe: 29.8, roe: 44.2, signal: 'HOLD', bharatAlphaScore: 79, sparkline: mkSparkline(3420, 'up'), volume: 3218456, high52w: 4255.75, low52w: 3311.80 },
  { rank: 3, symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', price: 1623.45, change: -12.30, changePct: -0.75, marketCap: 1234560, pe: 18.2, roe: 16.4, signal: 'BUY', bharatAlphaScore: 88, sparkline: mkSparkline(1660, 'down'), volume: 12345678, high52w: 1794.00, low52w: 1363.45 },
  { rank: 4, symbol: 'INFY', name: 'Infosys', sector: 'IT', price: 1876.20, change: 23.45, changePct: 1.27, marketCap: 780234, pe: 26.1, roe: 32.6, signal: 'BUY', bharatAlphaScore: 81, sparkline: mkSparkline(1820, 'up'), volume: 5678234, high52w: 2006.45, low52w: 1358.35 },
  { rank: 5, symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', price: 1089.75, change: 15.60, changePct: 1.45, marketCap: 767890, pe: 17.9, roe: 17.8, signal: 'BUY', bharatAlphaScore: 86, sparkline: mkSparkline(1060, 'up'), volume: 9234567, high52w: 1196.90, low52w: 945.25 },
  { rank: 6, symbol: 'WIPRO', name: 'Wipro', sector: 'IT', price: 478.30, change: -8.90, changePct: -1.83, marketCap: 248790, pe: 20.3, roe: 17.2, signal: 'HOLD', bharatAlphaScore: 65, sparkline: mkSparkline(490, 'down'), volume: 6789012, high52w: 594.75, low52w: 406.40 },
  { rank: 7, symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', price: 2234.60, change: 18.75, changePct: 0.85, marketCap: 524780, pe: 55.2, roe: 22.8, signal: 'HOLD', bharatAlphaScore: 72, sparkline: mkSparkline(2200, 'up'), volume: 1234567, high52w: 2700.00, low52w: 2172.70 },
  { rank: 8, symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', price: 456.75, change: 3.25, changePct: 0.72, marketCap: 570890, pe: 27.8, roe: 27.4, signal: 'BUY', bharatAlphaScore: 76, sparkline: mkSparkline(445, 'up'), volume: 15234567, high52w: 517.90, low52w: 399.35 },
  { rank: 9, symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'NBFC', price: 6789.40, change: 125.60, changePct: 1.89, marketCap: 410234, pe: 32.5, roe: 21.3, signal: 'BUY', bharatAlphaScore: 83, sparkline: mkSparkline(6600, 'up'), volume: 876543, high52w: 7830.05, low52w: 6187.80 },
  { rank: 10, symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', price: 11234.50, change: -89.30, changePct: -0.79, marketCap: 339870, pe: 28.9, roe: 18.9, signal: 'HOLD', bharatAlphaScore: 71, sparkline: mkSparkline(11350, 'down'), volume: 345678, high52w: 13680.00, low52w: 9550.45 },
  { rank: 11, symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', price: 1567.80, change: 28.90, changePct: 1.88, marketCap: 376540, pe: 34.2, roe: 14.2, signal: 'BUY', bharatAlphaScore: 78, sparkline: mkSparkline(1520, 'up'), volume: 2345678, high52w: 1694.00, low52w: 1110.45 },
  { rank: 12, symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer', price: 3456.70, change: 45.20, changePct: 1.33, marketCap: 307650, pe: 88.4, roe: 28.7, signal: 'HOLD', bharatAlphaScore: 74, sparkline: mkSparkline(3390, 'up'), volume: 678901, high52w: 3886.45, low52w: 3055.80 },
  { rank: 13, symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure', price: 1234.50, change: -23.40, changePct: -1.86, marketCap: 266780, pe: 26.7, roe: 18.3, signal: 'WATCH', bharatAlphaScore: 62, sparkline: mkSparkline(1265, 'down'), volume: 4567890, high52w: 1622.50, low52w: 974.25 },
  { rank: 14, symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', price: 678.90, change: 12.30, changePct: 1.84, marketCap: 250340, pe: 8.9, roe: 33.1, signal: 'BUY', bharatAlphaScore: 80, sparkline: mkSparkline(654, 'up'), volume: 18456789, high52w: 1064.25, low52w: 600.25 },
  { rank: 15, symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', price: 267.45, change: -4.30, changePct: -1.58, marketCap: 336540, pe: 8.2, roe: 12.1, signal: 'HOLD', bharatAlphaScore: 58, sparkline: mkSparkline(274, 'down'), volume: 23456789, high52w: 345.00, low52w: 200.45 },
  { rank: 16, symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power', price: 356.70, change: 6.80, changePct: 1.94, marketCap: 345870, pe: 17.8, roe: 11.2, signal: 'BUY', bharatAlphaScore: 73, sparkline: mkSparkline(342, 'up'), volume: 12345678, high52w: 448.45, low52w: 275.65 },
  { rank: 17, symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', sector: 'Auto', price: 8945.30, change: 134.50, changePct: 1.53, marketCap: 258760, pe: 29.4, roe: 24.7, signal: 'BUY', bharatAlphaScore: 82, sparkline: mkSparkline(8750, 'up'), volume: 456789, high52w: 10200.00, low52w: 6750.45 },
  { rank: 18, symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', price: 23456.70, change: -234.50, changePct: -0.99, marketCap: 226780, pe: 72.4, roe: 108.2, signal: 'HOLD', bharatAlphaScore: 69, sparkline: mkSparkline(23700, 'down'), volume: 123456, high52w: 27000.00, low52w: 21320.50 },
  { rank: 19, symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metal', price: 156.70, change: 3.45, changePct: 2.25, marketCap: 196540, pe: 12.1, roe: 8.9, signal: 'BUY', bharatAlphaScore: 76, sparkline: mkSparkline(150, 'up'), volume: 34567890, high52w: 185.45, low52w: 118.90 },
  { rank: 20, symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', price: 1123.60, change: -8.70, changePct: -0.77, marketCap: 346780, pe: 14.2, roe: 16.9, signal: 'HOLD', bharatAlphaScore: 70, sparkline: mkSparkline(1135, 'down'), volume: 7890123, high52w: 1339.65, low52w: 995.65 },
  { rank: 21, symbol: 'LT', name: 'Larsen & Toubro', sector: 'Engineering', price: 3567.80, change: 56.70, changePct: 1.61, marketCap: 490870, pe: 34.7, roe: 15.4, signal: 'BUY', bharatAlphaScore: 85, sparkline: mkSparkline(3480, 'up'), volume: 2345678, high52w: 3963.35, low52w: 3006.20 },
  { rank: 22, symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power', price: 289.30, change: 4.20, changePct: 1.47, marketCap: 268940, pe: 14.8, roe: 17.6, signal: 'BUY', bharatAlphaScore: 77, sparkline: mkSparkline(280, 'up'), volume: 9012345, high52w: 366.25, low52w: 220.40 },
  { rank: 23, symbol: 'COALINDIA', name: 'Coal India', sector: 'Mining', price: 467.80, change: -6.30, changePct: -1.33, marketCap: 288340, pe: 6.4, roe: 52.3, signal: 'HOLD', bharatAlphaScore: 61, sparkline: mkSparkline(476, 'down'), volume: 7654321, high52w: 541.00, low52w: 323.00 },
  { rank: 24, symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', price: 1678.90, change: 34.50, changePct: 2.10, marketCap: 456780, pe: 24.3, roe: 25.7, signal: 'BUY', bharatAlphaScore: 80, sparkline: mkSparkline(1620, 'up'), volume: 3456789, high52w: 1978.90, low52w: 1235.45 },
  { rank: 25, symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', price: 9876.50, change: 123.40, changePct: 1.26, marketCap: 284560, pe: 36.2, roe: 14.8, signal: 'HOLD', bharatAlphaScore: 67, sparkline: mkSparkline(9720, 'up'), volume: 234567, high52w: 11999.75, low52w: 8320.00 },
];

// ──────────────────────────────────────────────
// GAINERS / LOSERS / MOST ACTIVE / 52W
// ──────────────────────────────────────────────
export const gainers = allStocks.filter(s => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 5);
export const losers = allStocks.filter(s => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 5);
export const mostActive = [...allStocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
export const high52w = allStocks.filter((s, i) => i % 4 === 0).slice(0, 5);

// ──────────────────────────────────────────────
// SECTOR HEATMAP
// ──────────────────────────────────────────────
export const sectors = [
  { name: 'IT', changePct: 1.89, stocks: 142 },
  { name: 'Banking', changePct: -0.34, stocks: 38 },
  { name: 'Pharma', changePct: 1.45, stocks: 89 },
  { name: 'Auto', changePct: 0.67, stocks: 54 },
  { name: 'FMCG', changePct: 0.52, stocks: 47 },
  { name: 'Metal', changePct: 2.12, stocks: 63 },
  { name: 'Energy', changePct: -0.87, stocks: 31 },
  { name: 'Realty', changePct: 3.24, stocks: 28 },
];

// ──────────────────────────────────────────────
// NEWS
// ──────────────────────────────────────────────
export const newsItems: NewsItem[] = [
  {
    id: '1',
    source: 'Economic Times',
    timeAgo: '12 min ago',
    headline: 'Reliance Industries Q3 profit surges 18% YoY on Jio and retail momentum',
    ticker: 'RELIANCE',
    sentiment: 'POSITIVE',
  },
  {
    id: '2',
    source: 'Mint',
    timeAgo: '34 min ago',
    headline: 'RBI holds rates steady, signals cautious stance amid global uncertainty',
    ticker: 'NIFTY',
    sentiment: 'NEUTRAL',
  },
  {
    id: '3',
    source: 'Business Standard',
    timeAgo: '1 hr ago',
    headline: 'Adani Group stocks under pressure as FII selling intensifies',
    ticker: 'ADANIENT',
    sentiment: 'NEGATIVE',
  },
];

// ──────────────────────────────────────────────
// STOCK DETAIL — RELIANCE
// ──────────────────────────────────────────────
export const stockDetail = {
  symbol: 'RELIANCE',
  name: 'Reliance Industries Ltd',
  sector: 'Energy',
  industry: 'Oil, Gas & Consumable Fuels',
  exchange: 'NSE',
  price: 2847.50,
  change: 34.20,
  changePct: 1.22,
  open: 2814.00,
  high: 2861.30,
  low: 2803.45,
  prevClose: 2813.30,
  volume: 8456293,
  avgVolume: 7234567,
  high52w: 3024.90,
  low52w: 2220.30,
  marketCap: 1928430,
  isInWatchlist: false,

  fundamentals: {
    pe: 27.4,
    pb: 2.1,
    evEbitda: 15.2,
    roe: 8.9,
    roce: 11.2,
    debtEquity: 0.42,
    currentRatio: 1.34,
    dividendYield: 0.34,
    sectorPe: 22.1,
    sectorPb: 1.8,
    sectorRoe: 12.4,
  },

  technicals: {
    rsi: 58.4,
    macd: 12.3,
    bbPosition: 0.62,
    trend: 'Bullish',
    ma20: 2798,
    ma50: 2745,
    ma200: 2612,
  },

  aiSignal: {
    signal: 'BUY' as Signal,
    confidence: 87,
    reasoningChain: [
      'Crude Oil ↓4%',
      'Input Cost Drops',
      'Margin Expansion',
      'EPS Upgrade',
      'Price Target ↑',
    ],
    targets: {
      shortTerm: { target: 2960, stopLoss: 2750, horizon: '< 1 month' },
      mediumTerm: { target: 3200, stopLoss: 2650, horizon: '3–6 months' },
      longTerm: { target: 3800, stopLoss: 2500, horizon: '1+ year' },
    },
    riskLevel: 'Medium',
  },

  financials: {
    quarterly: [
      { quarter: 'Q4 FY23', revenue: 232000, profit: 16003, margin: 6.9 },
      { quarter: 'Q1 FY24', revenue: 208668, profit: 16011, margin: 7.7 },
      { quarter: 'Q2 FY24', revenue: 236937, profit: 17394, margin: 7.3 },
      { quarter: 'Q3 FY24', revenue: 237084, profit: 19641, margin: 8.3 },
      { quarter: 'Q4 FY24', revenue: 240890, profit: 18951, margin: 7.9 },
      { quarter: 'Q1 FY25', revenue: 236467, profit: 15138, margin: 6.4 },
      { quarter: 'Q2 FY25', revenue: 258027, profit: 16563, margin: 6.4 },
      { quarter: 'Q3 FY25', revenue: 261200, profit: 21804, margin: 8.3 },
    ],
  },

  shareholding: {
    promoter: 50.3,
    fii: 23.4,
    dii: 16.8,
    public: 9.5,
    promoterChg: 0.0,
    fiiChg: 0.8,
    diiChg: -0.3,
    publicChg: -0.5,
  },

  peers: [
    { symbol: 'ONGC', name: 'ONGC', price: 267.45, changePct: -1.58, pe: 8.2, pb: 1.1, roe: 12.1, marketCap: 336540 },
    { symbol: 'BPCL', name: 'BPCL', price: 312.60, changePct: 0.45, pe: 7.8, pb: 1.4, roe: 15.3, marketCap: 135670 },
    { symbol: 'IOC', name: 'Indian Oil Corp', price: 156.80, changePct: -0.67, pe: 6.9, pb: 1.2, roe: 11.8, marketCap: 221340 },
    { symbol: 'GAIL', name: 'GAIL India', price: 213.40, changePct: 1.23, pe: 14.2, pb: 2.1, roe: 14.7, marketCap: 139870 },
    { symbol: 'HINDPETRO', name: 'HPCL', price: 378.90, changePct: -0.34, pe: 8.4, pb: 1.6, roe: 13.2, marketCap: 80450 },
  ],

  optionChain: {
    pcr: 1.24,
    maxPain: 2800,
    ivPercentile: 42,
    atm: 2850,
    strikes: [
      { strike: 2750, ceOI: 234567, pePcr: 1.8, peOI: 678234, cePcr: 0.56 },
      { strike: 2800, ceOI: 456789, pePcr: 1.5, peOI: 567890, cePcr: 0.81 },
      { strike: 2850, ceOI: 789012, pePcr: 1.2, peOI: 489012, cePcr: 1.61 },
      { strike: 2900, ceOI: 654321, pePcr: 0.9, peOI: 321098, cePcr: 2.04 },
      { strike: 2950, ceOI: 432109, pePcr: 0.7, peOI: 234567, cePcr: 1.84 },
    ],
  },
};

// Generate OHLCV mock data for chart
export function generateOHLCV(basePrice: number, days = 90) {
  const data: { time: string; open: number; high: number; low: number; close: number }[] = [];
  let price = basePrice * 0.88;
  const start = new Date('2024-12-01');

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const changePercent = (Math.random() - 0.47) * 0.025;
    const close = price * (1 + changePercent);
    const high = close * (1 + Math.random() * 0.008);
    const low = close * (1 - Math.random() * 0.008);
    const open = price;

    data.push({
      time: d.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    price = close;
  }
  return data;
}

// ──────────────────────────────────────────────
// MUTUAL FUNDS
// ──────────────────────────────────────────────
export const mutualFunds: MutualFund[] = [
  { id: 'mf1', name: 'Mirae Asset Large Cap Fund', amc: 'Mirae Asset', category: 'Large Cap', riskLevel: 'Moderate', returns1Y: 18.4, returns3Y: 16.2, returns5Y: 14.8, aum: 38456, expenseRatio: 0.54, bharatAlphaScore: 91, minSip: 1000, color: '#3B82F6' },
  { id: 'mf2', name: 'Parag Parikh Flexi Cap Fund', amc: 'PPFAS', category: 'Flexi Cap', riskLevel: 'Moderate', returns1Y: 22.1, returns3Y: 19.4, returns5Y: 18.2, aum: 67890, expenseRatio: 0.63, bharatAlphaScore: 94, minSip: 1000, color: '#00C896' },
  { id: 'mf3', name: 'Quant ELSS Tax Saver Fund', amc: 'Quant Mutual Fund', category: 'ELSS', riskLevel: 'Very High', returns1Y: 34.2, returns3Y: 28.7, returns5Y: 24.3, aum: 8967, expenseRatio: 0.75, bharatAlphaScore: 82, minSip: 500, color: '#F59E0B' },
  { id: 'mf4', name: 'HDFC Balanced Advantage Fund', amc: 'HDFC Mutual Fund', category: 'Hybrid', riskLevel: 'Moderate', returns1Y: 15.8, returns3Y: 14.2, returns5Y: 13.1, aum: 82345, expenseRatio: 0.71, bharatAlphaScore: 78, minSip: 100, color: '#8B5CF6' },
  { id: 'mf5', name: 'Navi Nifty 50 Index Fund', amc: 'Navi', category: 'Index', riskLevel: 'Moderate', returns1Y: 16.2, returns3Y: 14.8, returns5Y: 13.5, aum: 3456, expenseRatio: 0.06, bharatAlphaScore: 85, minSip: 10, color: '#06B6D4' },
  { id: 'mf6', name: 'ICICI Pru Debt Management Fund', amc: 'ICICI Prudential', category: 'Debt', riskLevel: 'Low', returns1Y: 7.8, returns3Y: 7.2, returns5Y: 7.4, aum: 12345, expenseRatio: 0.45, bharatAlphaScore: 72, minSip: 1000, color: '#10B981' },
  { id: 'mf7', name: 'SBI Small Cap Fund', amc: 'SBI Mutual Fund', category: 'Equity', riskLevel: 'Very High', returns1Y: 28.4, returns3Y: 24.1, returns5Y: 21.8, aum: 23456, expenseRatio: 0.68, bharatAlphaScore: 88, minSip: 500, color: '#EF4444' },
  { id: 'mf8', name: 'Axis Bluechip Fund', amc: 'Axis Mutual Fund', category: 'Large Cap', riskLevel: 'Moderate', returns1Y: 14.2, returns3Y: 12.8, returns5Y: 12.1, aum: 34567, expenseRatio: 0.52, bharatAlphaScore: 74, minSip: 500, color: '#F97316' },
];

// ──────────────────────────────────────────────
// SCREENER PRESETS
// ──────────────────────────────────────────────
export const screenerPresets = [
  { id: 's1', name: 'Value Picks', count: 47, updated: '2 hrs ago', color: '#00C896', icon: '💎', description: 'P/E < 15, ROE > 15%, low debt' },
  { id: 's2', name: 'Growth Stocks', count: 89, updated: '1 hr ago', color: '#3B82F6', icon: '🚀', description: 'Revenue growth > 20% QoQ' },
  { id: 's3', name: 'Dividend Kings', count: 34, updated: '3 hrs ago', color: '#F59E0B', icon: '👑', description: 'Dividend yield > 4%, consistent payout' },
  { id: 's4', name: 'Momentum Plays', count: 62, updated: '45 min ago', color: '#8B5CF6', icon: '⚡', description: 'RSI 50-70, above MA50, volume surge' },
  { id: 's5', name: 'Undervalued Giants', count: 18, updated: '5 hrs ago', color: '#EC4899', icon: '🏔️', description: 'Large cap, P/B < 2, near 52W low' },
  { id: 's6', name: 'F&O Favorites', count: 156, updated: '30 min ago', color: '#06B6D4', icon: '📊', description: 'High OI buildup, PCR > 1.2' },
];

export const screenerMetrics = [
  'P/E Ratio', 'P/B Ratio', 'EV/EBITDA', 'Market Cap (₹ Cr)', 'Revenue Growth %',
  'Net Profit Growth %', 'ROE %', 'ROCE %', 'Debt/Equity', 'Current Ratio',
  'Promoter Holding %', 'FII Holding %', 'DII Holding %', 'Dividend Yield %',
  '52W High Proximity %', '52W Low Proximity %', 'Volume vs Avg %', 'RSI',
  'MACD Signal', 'Bollinger Band Position', '1M Return %', '3M Return %',
  '6M Return %', '1Y Return %', 'Beta', 'Price to Sales', 'Interest Coverage',
];

// ──────────────────────────────────────────────
// PORTFOLIO ALLOCATION DATA
// ──────────────────────────────────────────────
export function getPortfolioAllocation(amount: number, risk: string) {
  const isAggressive = risk === 'Aggressive';
  const isConservative = risk === 'Conservative';

  const equityPct = isAggressive ? 70 : isConservative ? 40 : 55;
  const mfPct = isAggressive ? 20 : isConservative ? 35 : 28;
  const goldPct = isAggressive ? 5 : isConservative ? 15 : 10;
  const cashPct = 100 - equityPct - mfPct - goldPct;

  const equityAmt = (amount * equityPct) / 100;

  const stocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2847.50, signal: 'BUY' as Signal, expectedReturn: '18-24%', stopLoss: 2650 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1623.45, signal: 'BUY' as Signal, expectedReturn: '15-20%', stopLoss: 1480 },
    { symbol: 'TCS', name: 'TCS', price: 3542.30, signal: 'HOLD' as Signal, expectedReturn: '12-16%', stopLoss: 3200 },
    { symbol: 'INFY', name: 'Infosys', price: 1876.20, signal: 'BUY' as Signal, expectedReturn: '16-22%', stopLoss: 1700 },
    { symbol: 'NTPC', name: 'NTPC', price: 356.70, signal: 'BUY' as Signal, expectedReturn: '20-28%', stopLoss: 315 },
  ];

  const stockCount = isAggressive ? 5 : isConservative ? 3 : 4;
  const selectedStocks = stocks.slice(0, stockCount);
  const perStockAmt = equityAmt / stockCount;

  return {
    allocation: [
      { name: 'Direct Equity', pct: equityPct, amount: equityAmt, color: '#3B82F6' },
      { name: 'Mutual Funds', pct: mfPct, amount: (amount * mfPct) / 100, color: '#00C896' },
      { name: 'Gold ETF', pct: goldPct, amount: (amount * goldPct) / 100, color: '#F59E0B' },
      { name: 'Cash / FD', pct: cashPct, amount: (amount * cashPct) / 100, color: '#94A3B8' },
    ],
    stocks: selectedStocks.map(s => ({
      ...s,
      amount: perStockAmt,
      quantity: Math.floor(perStockAmt / s.price),
    })),
    mfs: mutualFunds.slice(0, 3),
    riskScore: isAggressive ? 72 : isConservative ? 28 : 52,
    expectedReturnRange: isAggressive ? { min: 18, max: 28 } : isConservative ? { min: 10, max: 14 } : { min: 14, max: 20 },
  };
}

// ──────────────────────────────────────────────
// GOVERNMENT BONDS
// ──────────────────────────────────────────────
export interface GovernmentBond {
  id: string;
  name: string;
  issuer: string;
  couponRate: number;       // % per annum
  maturityDate: string;
  yieldToMaturity: number;  // % p.a.
  faceValue: number;        // ₹
  creditRating: string;
  type: 'G-Sec' | 'T-Bill' | 'SDL' | 'Savings Bond' | 'SGB';
  liquidity: 'High' | 'Medium' | 'Low';
  taxable: boolean;
  minInvestment: number;
  color: string;
  interestFrequency?: string; // e.g. 'Semi-annual', 'Annual', 'At maturity'
  taxBenefit?: string;        // e.g. 'Tax-free on maturity'
  nse?: boolean;              // tradeable on exchange
}

export const governmentBonds: GovernmentBond[] = [
  {
    id: 'gb1',
    name: 'RBI 7.26% Govt Security 2033',
    issuer: 'Reserve Bank of India',
    couponRate: 7.26,
    maturityDate: '2033-06-22',
    yieldToMaturity: 7.18,
    faceValue: 100,
    creditRating: 'Sovereign',
    type: 'G-Sec',
    liquidity: 'High',
    taxable: true,
    minInvestment: 10000,
    color: '#3B82F6',
  },
  {
    id: 'gb2',
    name: 'RBI Savings Bond 8.05% 2031',
    issuer: 'Reserve Bank of India',
    couponRate: 8.05,
    maturityDate: '2031-04-01',
    yieldToMaturity: 8.05,
    faceValue: 1000,
    creditRating: 'Sovereign',
    type: 'Savings Bond',
    liquidity: 'Low',
    taxable: true,
    minInvestment: 1000,
    color: '#06B6D4',
  },
  {
    id: 'gb3',
    name: '91-Day Treasury Bill',
    issuer: 'Government of India',
    couponRate: 0,
    maturityDate: '2026-06-30',
    yieldToMaturity: 6.85,
    faceValue: 100,
    creditRating: 'Sovereign',
    type: 'T-Bill',
    liquidity: 'High',
    taxable: true,
    minInvestment: 25000,
    color: '#8B5CF6',
  },
  {
    id: 'gb4',
    name: 'Maharashtra SDL 7.45% 2030',
    issuer: 'State Government of Maharashtra',
    couponRate: 7.45,
    maturityDate: '2030-03-15',
    yieldToMaturity: 7.38,
    faceValue: 100,
    creditRating: 'Sovereign (State)',
    type: 'SDL',
    liquidity: 'Medium',
    taxable: true,
    minInvestment: 10000,
    color: '#10B981',
  },
  {
    id: 'gb5',
    name: 'RBI 7.10% Govt Security 2029',
    issuer: 'Reserve Bank of India',
    couponRate: 7.10,
    maturityDate: '2029-04-08',
    yieldToMaturity: 7.05,
    faceValue: 100,
    creditRating: 'Sovereign',
    type: 'G-Sec',
    liquidity: 'High',
    taxable: true,
    minInvestment: 10000,
    color: '#F59E0B',
  },
];

// ──────────────────────────────────────────────
// CORPORATE BONDS
// ──────────────────────────────────────────────
export interface CorporateBond {
  id: string;
  name: string;
  issuer: string;
  sector: string;
  couponRate: number;
  maturityDate: string;
  yieldToMaturity: number;
  faceValue: number;
  creditRating: string;
  secured: boolean;
  taxable: boolean;
  minInvestment: number;
  color: string;
}

export const corporateBonds: CorporateBond[] = [
  {
    id: 'cb1',
    name: 'HDFC Bank NCD 8.25% 2027',
    issuer: 'HDFC Bank Ltd',
    sector: 'Banking',
    couponRate: 8.25,
    maturityDate: '2027-09-15',
    yieldToMaturity: 8.10,
    faceValue: 1000,
    creditRating: 'AAA',
    secured: true,
    taxable: true,
    minInvestment: 10000,
    color: '#3B82F6',
  },
  {
    id: 'cb2',
    name: 'Power Finance Corp NCD 7.95% 2028',
    issuer: 'Power Finance Corporation',
    sector: 'NBFC (Govt)',
    couponRate: 7.95,
    maturityDate: '2028-12-20',
    yieldToMaturity: 7.88,
    faceValue: 1000,
    creditRating: 'AAA',
    secured: true,
    taxable: true,
    minInvestment: 5000,
    color: '#00C896',
  },
  {
    id: 'cb3',
    name: 'Tata Capital NCD 8.50% 2026',
    issuer: 'Tata Capital Ltd',
    sector: 'NBFC',
    couponRate: 8.50,
    maturityDate: '2026-08-10',
    yieldToMaturity: 8.42,
    faceValue: 1000,
    creditRating: 'AAA',
    secured: true,
    taxable: true,
    minInvestment: 10000,
    color: '#F59E0B',
  },
  {
    id: 'cb4',
    name: 'Bajaj Finance NCD 8.65% 2027',
    issuer: 'Bajaj Finance Ltd',
    sector: 'NBFC',
    couponRate: 8.65,
    maturityDate: '2027-03-25',
    yieldToMaturity: 8.55,
    faceValue: 1000,
    creditRating: 'AAA',
    secured: true,
    taxable: true,
    minInvestment: 10000,
    color: '#8B5CF6',
  },
  {
    id: 'cb5',
    name: 'REC Ltd NCD 7.88% 2029',
    issuer: 'REC Limited',
    sector: 'Power (Govt NBFC)',
    couponRate: 7.88,
    maturityDate: '2029-05-18',
    yieldToMaturity: 7.80,
    faceValue: 1000,
    creditRating: 'AAA',
    secured: true,
    taxable: true,
    minInvestment: 5000,
    color: '#EF4444',
  },
];

// ──────────────────────────────────────────────
// ETFs (Exchange Traded Funds)
// ──────────────────────────────────────────────
export interface ETF {
  id: string;
  name: string;
  symbol: string;
  amc: string;
  category: 'Equity' | 'Debt' | 'Gold' | 'Silver' | 'International' | 'Sectoral';
  trackingIndex: string;
  expenseRatio: number;
  nav: number;
  aum: number;               // ₹ Cr
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  trackingError: number;
  liquidity: 'Very High' | 'High' | 'Medium';
  color: string;
  niftyCorrelation?: number; // 0-1 correlation with Nifty 50
  nse?: boolean;             // listed on NSE
}


export const etfs: ETF[] = [
  {
    id: 'etf1',
    name: 'Nippon India Nifty 50 ETF',
    symbol: 'NIFTYBEES',
    amc: 'Nippon India',
    category: 'Equity',
    trackingIndex: 'NIFTY 50',
    expenseRatio: 0.04,
    nav: 248.32,
    aum: 24500,
    returns1Y: 16.2,
    returns3Y: 14.8,
    returns5Y: 13.5,
    trackingError: 0.03,
    liquidity: 'Very High',
    color: '#3B82F6',
  },
  {
    id: 'etf2',
    name: 'HDFC Gold ETF',
    symbol: 'HDFCMFGETF',
    amc: 'HDFC Mutual Fund',
    category: 'Gold',
    trackingIndex: 'Domestic Gold Price',
    expenseRatio: 0.55,
    nav: 68.45,
    aum: 3840,
    returns1Y: 18.7,
    returns3Y: 12.4,
    returns5Y: 10.8,
    trackingError: 0.08,
    liquidity: 'High',
    color: '#F59E0B',
  },
  {
    id: 'etf3',
    name: 'SBI Nifty Bank ETF',
    symbol: 'SETFNIFBK',
    amc: 'SBI Funds Management',
    category: 'Sectoral',
    trackingIndex: 'NIFTY Bank',
    expenseRatio: 0.18,
    nav: 512.75,
    aum: 8920,
    returns1Y: 12.3,
    returns3Y: 11.8,
    returns5Y: 10.2,
    trackingError: 0.10,
    liquidity: 'High',
    color: '#00C896',
  },
  {
    id: 'etf4',
    name: 'Mirae Asset Silver ETF',
    symbol: 'SILVERETF',
    amc: 'Mirae Asset',
    category: 'Silver',
    trackingIndex: 'Domestic Silver Price',
    expenseRatio: 0.50,
    nav: 92.18,
    aum: 890,
    returns1Y: 22.4,
    returns3Y: 9.8,
    returns5Y: 8.4,
    trackingError: 0.12,
    liquidity: 'Medium',
    color: '#94A3B8',
  },
  {
    id: 'etf5',
    name: 'Motilal Oswal Nasdaq 100 ETF',
    symbol: 'MON100',
    amc: 'Motilal Oswal',
    category: 'International',
    trackingIndex: 'Nasdaq 100',
    expenseRatio: 0.58,
    nav: 198.60,
    aum: 5340,
    returns1Y: 24.8,
    returns3Y: 18.2,
    returns5Y: 19.1,
    trackingError: 0.25,
    liquidity: 'High',
    color: '#8B5CF6',
  },
  {
    id: 'etf6',
    name: 'ICICI Pru Nifty Next 50 ETF',
    symbol: 'NEXT50',
    amc: 'ICICI Prudential',
    category: 'Equity',
    trackingIndex: 'NIFTY Next 50',
    expenseRatio: 0.09,
    nav: 76.34,
    aum: 4120,
    returns1Y: 14.5,
    returns3Y: 13.1,
    returns5Y: 12.4,
    trackingError: 0.05,
    liquidity: 'High',
    color: '#06B6D4',
  },
];

// ──────────────────────────────────────────────
// FIXED DEPOSITS
// ──────────────────────────────────────────────
export interface FixedDeposit {
  id: string;
  bankName: string;
  bankType: 'Public Sector' | 'Private Sector' | 'Small Finance' | 'NBFC';
  tenureOptions: { tenure: string; rate: number; seniorRate: number }[];
  minAmount: number;
  insuranceCover: number;   // ₹ (DICGC cover)
  creditRating?: string;
  color: string;
}

export const fixedDeposits: FixedDeposit[] = [
  {
    id: 'fd1',
    bankName: 'State Bank of India',
    bankType: 'Public Sector',
    tenureOptions: [
      { tenure: '1 Year', rate: 6.80, seniorRate: 7.30 },
      { tenure: '2 Years', rate: 7.00, seniorRate: 7.50 },
      { tenure: '3 Years', rate: 6.75, seniorRate: 7.25 },
      { tenure: '5 Years', rate: 6.50, seniorRate: 7.00 },
    ],
    minAmount: 1000,
    insuranceCover: 500000,
    color: '#3B82F6',
  },
  {
    id: 'fd2',
    bankName: 'HDFC Bank',
    bankType: 'Private Sector',
    tenureOptions: [
      { tenure: '1 Year', rate: 7.10, seniorRate: 7.60 },
      { tenure: '2 Years', rate: 7.25, seniorRate: 7.75 },
      { tenure: '3 Years', rate: 7.00, seniorRate: 7.50 },
      { tenure: '5 Years', rate: 7.00, seniorRate: 7.50 },
    ],
    minAmount: 5000,
    insuranceCover: 500000,
    color: '#00C896',
  },
  {
    id: 'fd3',
    bankName: 'ICICI Bank',
    bankType: 'Private Sector',
    tenureOptions: [
      { tenure: '1 Year', rate: 7.10, seniorRate: 7.60 },
      { tenure: '2 Years', rate: 7.25, seniorRate: 7.75 },
      { tenure: '3 Years', rate: 7.00, seniorRate: 7.50 },
      { tenure: '5 Years', rate: 7.00, seniorRate: 7.50 },
    ],
    minAmount: 10000,
    insuranceCover: 500000,
    color: '#F59E0B',
  },
  {
    id: 'fd4',
    bankName: 'Ujjivan Small Finance Bank',
    bankType: 'Small Finance',
    tenureOptions: [
      { tenure: '1 Year', rate: 8.25, seniorRate: 8.75 },
      { tenure: '2 Years', rate: 8.50, seniorRate: 9.00 },
      { tenure: '3 Years', rate: 8.25, seniorRate: 8.75 },
      { tenure: '5 Years', rate: 7.75, seniorRate: 8.25 },
    ],
    minAmount: 1000,
    insuranceCover: 500000,
    color: '#8B5CF6',
  },
  {
    id: 'fd5',
    bankName: 'Bajaj Finance FD',
    bankType: 'NBFC',
    tenureOptions: [
      { tenure: '1 Year', rate: 8.05, seniorRate: 8.30 },
      { tenure: '2 Years', rate: 8.15, seniorRate: 8.40 },
      { tenure: '3 Years', rate: 8.25, seniorRate: 8.50 },
      { tenure: '5 Years', rate: 8.35, seniorRate: 8.60 },
    ],
    minAmount: 15000,
    insuranceCover: 0,
    creditRating: 'AAA (CRISIL)',
    color: '#EF4444',
  },
];

// ──────────────────────────────────────────────
// INVESTMENT ADVISOR ENGINE
// ──────────────────────────────────────────────
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

export interface AllocationSlice {
  name: string;
  pct: number;
  amount: number;
  color: string;
  icon: string;
  expectedReturn: string;
  rationale: string;
}

export interface InvestmentRecommendation {
  riskProfile: RiskProfile;
  amount: number;
  horizonYears: number;
  riskScore: number;
  expectedReturnRange: { min: number; max: number };
  allocation: AllocationSlice[];
  recommendedStocks: typeof allStocks;
  recommendedMFs: MutualFund[];
  recommendedGovtBonds: GovernmentBond[];
  recommendedCorpBonds: CorporateBond[];
  recommendedETFs: ETF[];
  recommendedFDs: FixedDeposit[];
  goldAmount: number;
  silverAmount: number;
  summary: string;
}

export function getInvestmentRecommendation(
  amount: number,
  horizonYears: number,
  riskProfile: RiskProfile
): InvestmentRecommendation {
  const isConservative = riskProfile === 'Conservative';
  const isAggressive = riskProfile === 'Aggressive';
  const isShortTerm = horizonYears <= 3;
  const isLongTerm = horizonYears >= 7;

  // Base allocations by risk profile (%)
  let stocksPct = isAggressive ? 55 : isConservative ? 15 : 35;
  let mfPct = isAggressive ? 20 : isConservative ? 20 : 25;
  let govtBondPct = isAggressive ? 3 : isConservative ? 22 : 12;
  let corpBondPct = isAggressive ? 2 : isConservative ? 12 : 7;
  let etfPct = isAggressive ? 12 : isConservative ? 5 : 9;
  let fdPct = isAggressive ? 0 : isConservative ? 18 : 5;
  let goldPct = isAggressive ? 5 : isConservative ? 5 : 5;
  let silverPct = isAggressive ? 3 : isConservative ? 3 : 2;

  // Horizon adjustments
  if (isShortTerm) {
    // Shift from equity to safety
    const shift = isConservative ? 5 : isAggressive ? 10 : 8;
    stocksPct = Math.max(5, stocksPct - shift);
    mfPct = Math.max(5, mfPct - shift / 2);
    fdPct = Math.min(35, fdPct + shift);
    govtBondPct = Math.min(30, govtBondPct + shift / 2);
  } else if (isLongTerm) {
    // Boost equity / reduce cash instruments
    const boost = isAggressive ? 8 : isConservative ? 5 : 7;
    stocksPct = Math.min(70, stocksPct + boost);
    mfPct = Math.min(35, mfPct + boost / 2);
    fdPct = Math.max(0, fdPct - boost);
    govtBondPct = Math.max(2, govtBondPct - boost / 2);
  }

  // Normalise to 100%
  const total = stocksPct + mfPct + govtBondPct + corpBondPct + etfPct + fdPct + goldPct + silverPct;
  const scale = 100 / total;
  stocksPct = Math.round(stocksPct * scale);
  mfPct = Math.round(mfPct * scale);
  govtBondPct = Math.round(govtBondPct * scale);
  corpBondPct = Math.round(corpBondPct * scale);
  etfPct = Math.round(etfPct * scale);
  fdPct = Math.round(fdPct * scale);
  goldPct = Math.round(goldPct * scale);
  silverPct = 100 - stocksPct - mfPct - govtBondPct - corpBondPct - etfPct - fdPct - goldPct;

  const amt = (pct: number) => Math.round((amount * pct) / 100);

  const allocation: AllocationSlice[] = [
    {
      name: 'Direct Stocks',
      pct: stocksPct,
      amount: amt(stocksPct),
      color: '#3B82F6',
      icon: '📈',
      expectedReturn: isAggressive ? '18–28%' : isConservative ? '10–14%' : '14–20%',
      rationale: isLongTerm
        ? 'Long horizon allows full equity cycle participation'
        : isShortTerm
          ? 'Reduced exposure due to short horizon volatility risk'
          : 'Core equity allocation for wealth creation',
    },
    {
      name: 'Mutual Funds',
      pct: mfPct,
      amount: amt(mfPct),
      color: '#00C896',
      icon: '🏦',
      expectedReturn: isAggressive ? '16–24%' : isConservative ? '9–13%' : '13–18%',
      rationale: 'Professional fund management with diversified exposure across market caps',
    },
    {
      name: 'Govt Bonds',
      pct: govtBondPct,
      amount: amt(govtBondPct),
      color: '#06B6D4',
      icon: '🏛️',
      expectedReturn: '7.0–8.1%',
      rationale: 'Sovereign-backed, zero credit risk; ideal for capital preservation and stable income',
    },
    {
      name: 'Corp Bonds',
      pct: corpBondPct,
      amount: amt(corpBondPct),
      color: '#8B5CF6',
      icon: '🏢',
      expectedReturn: '7.8–8.7%',
      rationale: 'AAA-rated NCDs offering higher yield than G-Secs with acceptable credit risk',
    },
    {
      name: 'ETFs',
      pct: etfPct,
      amount: amt(etfPct),
      color: '#F59E0B',
      icon: '⚡',
      expectedReturn: isAggressive ? '14–22%' : isConservative ? '8–12%' : '12–17%',
      rationale: 'Low-cost index & commodity ETFs for broad diversification and transparency',
    },
    {
      name: 'Fixed Deposits',
      pct: fdPct,
      amount: amt(fdPct),
      color: '#10B981',
      icon: '🔒',
      expectedReturn: '6.8–8.5%',
      rationale: isShortTerm
        ? 'Short horizon demands capital safety; FDs offer guaranteed returns'
        : 'Liquidity buffer with guaranteed returns, DICGC insured up to ₹5 Lakh',
    },
    {
      name: 'Gold',
      pct: goldPct,
      amount: amt(goldPct),
      color: '#F59E0B',
      icon: '🪙',
      expectedReturn: '10–14% (historical)',
      rationale: 'Hedge against inflation and geopolitical uncertainty; negative correlation with equities',
    },
    {
      name: 'Silver',
      pct: silverPct,
      amount: amt(silverPct),
      color: '#94A3B8',
      icon: '🥈',
      expectedReturn: '8–20% (volatile)',
      rationale: 'Industrial demand growth driver; premium inflation hedge with higher upside than gold',
    },
  ].filter(s => s.pct > 0);

  // Select instruments by risk profile
  const stockCount = isAggressive ? 5 : isConservative ? 3 : 4;
  const mfPickIds = isAggressive
    ? ['mf3', 'mf7', 'mf2', 'mf5']
    : isConservative
      ? ['mf6', 'mf4', 'mf8']
      : ['mf2', 'mf5', 'mf4', 'mf1'];
  const bondCount = isConservative ? 3 : isAggressive ? 1 : 2;
  const corpBondCount = isConservative ? 3 : isAggressive ? 1 : 2;
  const etfCount = isAggressive ? 4 : isConservative ? 2 : 3;
  const fdCount = isConservative ? 4 : isAggressive ? 0 : 2;

  const riskScore = isAggressive ? 74 : isConservative ? 24 : 50;
  const expectedReturnRange = isAggressive
    ? { min: 16, max: 26 }
    : isConservative
      ? { min: 8, max: 12 }
      : { min: 12, max: 18 };

  const summary = isAggressive
    ? `Growth-oriented portfolio targeting ${expectedReturnRange.min}–${expectedReturnRange.max}% CAGR. Heavy equity bias (${stocksPct + mfPct}%) balanced with commodity inflation hedges. Ideal for ${horizonYears}+ year horizon.`
    : isConservative
      ? `Capital preservation portfolio targeting ${expectedReturnRange.min}–${expectedReturnRange.max}% CAGR. Bonds and FDs form the anchor (${govtBondPct + corpBondPct + fdPct}%). Designed to protect your corpus over ${horizonYears} years.`
      : `Balanced growth portfolio targeting ${expectedReturnRange.min}–${expectedReturnRange.max}% CAGR. Diversified across all asset classes to balance risk and growth over ${horizonYears} years.`;

  return {
    riskProfile,
    amount,
    horizonYears,
    riskScore,
    expectedReturnRange,
    allocation,
    recommendedStocks: allStocks
      .filter(s => isAggressive ? s.signal === 'BUY' : isConservative ? ['HOLD', 'BUY'].includes(s.signal) && s.bharatAlphaScore >= 75 : s.bharatAlphaScore >= 78)
      .slice(0, stockCount),
    recommendedMFs: mutualFunds.filter(f => mfPickIds.includes(f.id)),
    recommendedGovtBonds: governmentBonds.slice(0, bondCount),
    recommendedCorpBonds: corporateBonds.slice(0, corpBondCount),
    recommendedETFs: etfs.filter(e =>
      isAggressive
        ? ['Equity', 'International', 'Sectoral'].includes(e.category)
        : isConservative
          ? ['Equity', 'Gold'].includes(e.category)
          : true
    ).slice(0, etfCount),
    recommendedFDs: fdPct > 0 ? fixedDeposits.slice(0, fdCount) : [],
    goldAmount: amt(goldPct),
    silverAmount: amt(silverPct),
    summary,
  };
}
