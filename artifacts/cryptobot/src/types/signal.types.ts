export interface HTFLevel {
  price: number;
  type: 'support' | 'resistance' | 'poc' | 'liquidity_pool' | 'fvg' | 'ob';
  description: string;
}

export interface AnalysisOutput {
  pair: string;
  timestamp: string;
  phase1: {
    macroBias: string;
    reasoning: string;
    keyFactors: string[];
  };
  phase2: {
    fundamentalBias: string;
    reasoning: string;
    risks: string[];
  };
  phase3: {
    htfBias: string;
    dominantTrend: string;
    keyLevels: HTFLevel[];
    reasoning: string;
  };
  phase4: {
    ltfBias: string;
    recentBOS: string | null;
    recentCHOCH: string | null;
    entryTrigger: string;
    reasoning: string;
  };
  phase5: {
    alignmentCheck: string;
    contradictions: string[];
    mtfConfluenceScore: number;
  };
  bias: 'LONG' | 'SHORT' | 'NO_TRADE';
  setup: string;
  entry: number | [number, number];
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3?: number;
  riskReward: number;
  probability: number;
  confidence: number;
  confidenceRating: number;
  holdingTime: 'scalp' | 'intraday' | 'swing';
  invalidation: number;
  whyThisTrade: {
    macro: string;
    onChain: string;
    htfTech: string;
    ltfTech: string;
    sentiment: string;
  };
  cancellationConditions: string[];
  finalVerdict: 'EXECUTE' | 'WATCH' | 'NO_TRADE';
  bestTradeNow: string;
  noTradeReason?: string;
  noTradeWaitFor?: string[];
  validationResult?: ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  overrideToNoTrade: boolean;
  phaseAlignmentScore?: number;
  riskRewardRatio?: number;
  stopLossPercent?: number;
  confidenceScore?: number;
  mtfConfluenceScore?: number;
}

export interface SignalRecord {
  id: string;
  timestamp: string;
  pair: string;
  signal: AnalysisOutput;
  outcome?: 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'sl_hit' | 'cancelled' | 'open';
  outcomePrice?: number;
  outcomeTimestamp?: string;
  actualRR?: number;
  notes?: string;
}
