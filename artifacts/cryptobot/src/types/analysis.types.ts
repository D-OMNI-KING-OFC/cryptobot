export type Timeframe = '15m' | '1H' | '4H' | '1D' | '1W';

export interface TimeframeBias {
  timeframe: Timeframe;
  bias: 1 | 0 | -1;
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  emaAlignment: 'bullish' | 'bearish' | 'mixed';
  bbPosition: 'above' | 'below' | 'inside';
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  bb: { upper: number; middle: number; lower: number };
  atr: number;
  ema20: number;
  ema50: number;
  ema200: number;
  vwap: number;
  stochRsi: { k: number; d: number };
  volumeSMA20: number;
  currentVolume: number;
  volumeRatio: number;
  close: number;
}

export interface FibonacciLevels {
  swingHigh: number;
  swingLow: number;
  retracements: Record<string, number>;
  extensions: Record<string, number>;
}

export interface MarketDataPayload {
  pair: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fundingRate: number | null;
  fundingRateStatus: 'neutral' | 'overheated_long' | 'overheated_short' | 'unavailable';
  openInterest: number | null;
  oiChange24h: number;
  longShortRatio: number | null;
  liquidationLevels: string;
  dxy: number | null;
  dxyTrend: string;
  interestRateExpectation: string;
  globalLiquidityTrend: string;
  btcDominance: number;
  totalMarketCap: number;
  total2MarketCap?: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  dominantNarrative: string;
  assetNarrativeTags: string[];
  socialSentimentScore: number;
  socialVolume?: number;
  recentNewsHeadlines: unknown[];
  exchangeNetFlow: number;
  exchangeReservesTrend: string;
  whaleBehavior: string;
  mvrv: number;
  sopr: number | null;
  nvtRatio?: number;
  etfNetFlow24h?: number | null;
  etfNetFlowWeekly?: number | null;
  tokenUnlockWarning?: {
    date: string;
    amountUSD: number;
    percentOfCirculating: number;
  };
  technicalByTimeframe: Record<string, unknown>;
  volumeProfile: { poc: number; vah: number; val: number; hvns: number[] };
  structureEvents: unknown[];
  fvgZones: unknown[];
  orderBlocks: unknown[];
  liquiditySweeps: unknown[];
  mtfConfluenceScore: number;
  fibonacciLevels: unknown;
  correlations?: Record<string, number>;

  // Advanced Analytics Extensions
  advancedAnalytics?: {
    riskMetrics?: {
      sharpeRatio: number;
      sortinoRatio: number;
      valueAtRisk: number;
      expectedShortfall: number;
      maximumDrawdown: number;
      zScore: number;
    };
    regimeAnalysis?: {
      currentRegime: 'trending' | 'ranging' | 'volatile';
      momentumHalfLife: number;
      betaVsBtc: number;
      betaVsEth: number;
    };
    optionsData?: unknown;
    supplyDistribution?: unknown;
    hodlWaves?: unknown;
    networkHealth?: unknown;
    liquidityAnalysis?: unknown;
    etfActivity?: unknown;
    statisticalSignificance?: {
      signalZScore: number;
      confidenceInterval: string;
    };
  };
}

export type AnalysisPhase = 'idle' | 'fetching' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'validating' | 'complete' | 'error';
