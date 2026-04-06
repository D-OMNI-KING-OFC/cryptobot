import type { TimeframeBias } from '../types/analysis.types';

const WEIGHTS: Record<string, number> = {
  '1W': 0.30,
  '1D': 0.25,
  '4H': 0.20,
  '1H': 0.15,
  '15m': 0.10,
};

export function computeMTFConfluenceScore(signals: TimeframeBias[]): number {
  let score = 0;
  for (const signal of signals) {
    const weight = WEIGHTS[signal.timeframe] || 0.1;
    score += signal.bias * weight;
  }
  return Math.max(-1, Math.min(1, score));
}

export function interpretConfluenceScore(score: number): string {
  if (score > 0.5) return 'Strong Bullish Confluence';
  if (score > 0.2) return 'Moderate Bullish';
  if (score > -0.2) return 'Neutral / No Bias';
  if (score > -0.5) return 'Moderate Bearish';
  return 'Strong Bearish Confluence';
}

export function confluenceToTimeframeBias(data: {
  rsi: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema200: number;
  close: number;
  timeframe: string;
}): 1 | 0 | -1 {
  let bullishSignals = 0;
  let bearishSignals = 0;

  if (data.rsi > 55) bullishSignals++;
  else if (data.rsi < 45) bearishSignals++;

  if (data.macdHistogram > 0) bullishSignals++;
  else if (data.macdHistogram < 0) bearishSignals++;

  if (data.close > data.ema20 && data.ema20 > data.ema50) bullishSignals++;
  else if (data.close < data.ema20 && data.ema20 < data.ema50) bearishSignals++;

  if (data.close > data.ema200) bullishSignals++;
  else bearishSignals++;

  if (bullishSignals >= 3) return 1;
  if (bearishSignals >= 3) return -1;
  return 0;
}
