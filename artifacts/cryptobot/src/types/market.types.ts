export interface OHLCVCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
}

export interface DerivativesData {
  fundingRate: number;
  fundingRateStatus: 'neutral' | 'overheated_long' | 'overheated_short';
  openInterest: number;
  oiChangePercent24h: number;
  longShortRatio: number;
  estimatedLiquidationLevels: { price: number; side: 'long' | 'short'; sizeMillion: number }[];
}

export interface OnChainMetrics {
  exchangeNetFlow: number;
  exchangeReserves: number;
  exchangeReservesTrend: 'rising' | 'falling' | 'neutral';
  mvrv: number;
  sopr: number | null;
  nvtRatio: number;
  whaleBehavior: 'accumulating' | 'distributing' | 'neutral';
  etfNetFlow24h?: number;
  etfNetFlowWeekly?: number;
  tokenUnlockWarning?: {
    date: string;
    amountUSD: number;
    percentOfCirculating: number;
  };
}

export interface NewsItem {
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
  timestamp: string;
}

export interface MacroSentimentData {
  fearGreedIndex: number;
  fearGreedLabel: string;
  btcDominance: number;
  totalMarketCap: number;
  total2MarketCap: number;
  dxy: number;
  dxyTrend: 'rising' | 'falling' | 'neutral';
  interestRateExpectation: 'hawkish' | 'neutral' | 'dovish';
  globalLiquidityTrend: 'expanding' | 'contracting' | 'neutral';
  socialVolume: number | null;
  socialSentimentScore: number;
  recentNewsHeadlines: NewsItem[];
  dominantNarrative: string;
  assetNarrativeTags: string[];
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  fundingRate?: number;
  openInterest?: number;
  onChainSignal?: 'bullish' | 'bearish' | 'neutral';
  narrativeTags?: string[];
}

export interface VolumeProfile {
  poc: number;
  vah: number;
  val: number;
  hvns: number[];
  lvns: number[];
}

export interface StructureEvent {
  type: 'BOS' | 'CHOCH' | 'FVG' | 'OB' | 'SWEEP';
  direction: 'bullish' | 'bearish';
  price: number;
  timestamp: number;
  timeframe: string;
}
