import { useCallback } from 'react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { runAnalysis } from '../api/aiEngine';
import { fetchOHLCV, fetchFundingRate, fetchOpenInterest } from '../api/marketData';
import { fetchMacroSentiment } from '../api/sentiment';
import { fetchOnChainMetrics } from '../api/onChain';
import { computeMTFConfluenceScore, confluenceToTimeframeBias } from '../utils/confluenceScorer';
import { validateInstitutionalSignal } from '../utils/signalValidator';
import {
  calculateZScore,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateValueAtRisk,
  calculateExpectedShortfall,
  calculateMaximumDrawdown,
  calculateBeta,
  calculateCorrelation,
  calculateAutocorrelation,
  detectRegime,
  calculateMomentumHalfLife,
  calculateNetworkHealthScore,
  analyzeLiquidity,
  optimizePortfolio
} from '../utils/advancedAnalytics';
import {
  analyzeOptionsIntelligence,
  fetchSupplyDistribution,
  fetchHodlWaves,
  fetchNetworkHealthMetrics,
  fetchOrderBook
} from '../api/advancedData';
import type { MarketDataPayload } from '../types/analysis.types';
import type { AnalysisOutput } from '../types/signal.types';
import type { OHLCVCandle } from '../types/market.types';

// ─── EMA Array (returns full array of EMA values) ────────────────────────────

function computeEMAArray(values: number[], period: number): number[] {
  if (values.length < period) return values.map(() => values[values.length - 1] || 0);
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) result.push(ema);
  result.push(ema);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function computeEMA(closes: number[], period: number): number {
  const arr = computeEMAArray(closes, period);
  return parseFloat((arr[arr.length - 1] || 0).toFixed(8));
}

// ─── RSI ─────────────────────────────────────────────────────────────────────

function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  if (avgLoss === 0) return 100;

  // Wilder's smoothing for subsequent values
  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  for (let i = closes.length - period - 1; i >= 0; i--) {
    const diff = closes[i + 1] - closes[i];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    if (avgLoss === 0) return 100;
    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
  }
  return parseFloat(rsi.toFixed(2));
}

// ─── MACD with proper 9-period EMA signal line ───────────────────────────────

function computeMACD(closes: number[]): { value: number; signal: number; histogram: number } {
  if (closes.length < 35) {
    return { value: 0, signal: 0, histogram: 0 };
  }

  const ema12Array = computeEMAArray(closes, 12);
  const ema26Array = computeEMAArray(closes, 26);

  const minLen = Math.min(ema12Array.length, ema26Array.length);
  const macdArray: number[] = [];
  for (let i = 0; i < minLen; i++) {
    macdArray.push(ema12Array[i] - ema26Array[i]);
  }

  const signalArray = computeEMAArray(macdArray, 9);
  const macdLine = macdArray[macdArray.length - 1] || 0;
  const signalLine = signalArray[signalArray.length - 1] || 0;

  return {
    value: parseFloat(macdLine.toFixed(8)),
    signal: parseFloat(signalLine.toFixed(8)),
    histogram: parseFloat((macdLine - signalLine).toFixed(8)),
  };
}

// ─── ATR ─────────────────────────────────────────────────────────────────────

function computeATR(candles: { high: number; low: number; close: number }[], period = 14): number {
  if (candles.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(8));
}

// ─── Bollinger Bands ─────────────────────────────────────────────────────────

function computeBollingerBands(closes: number[], period = 20, stdDevMult = 2): { upper: number; middle: number; lower: number } {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: parseFloat((mean + stdDevMult * sd).toFixed(8)),
    middle: parseFloat(mean.toFixed(8)),
    lower: parseFloat((mean - stdDevMult * sd).toFixed(8)),
  };
}

// ─── VWAP ────────────────────────────────────────────────────────────────────

function computeVWAP(candles: { high: number; low: number; close: number; volume: number }[]): number {
  if (!candles.length) return 0;
  let cumTPV = 0, cumVol = 0;
  for (const c of candles) {
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * c.volume;
    cumVol += c.volume;
  }
  return cumVol > 0 ? parseFloat((cumTPV / cumVol).toFixed(8)) : 0;
}

// ─── Stochastic RSI ──────────────────────────────────────────────────────────

function computeStochRSI(closes: number[], rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3): { k: number; d: number } {
  if (closes.length < rsiPeriod + stochPeriod + Math.max(kSmooth, dSmooth) + 2) {
    return { k: 50, d: 50 };
  }

  // Build RSI array for all close values
  const rsiArr: number[] = [];
  for (let i = rsiPeriod; i <= closes.length; i++) {
    rsiArr.push(computeRSI(closes.slice(0, i), rsiPeriod));
  }

  // Compute raw StochRSI values
  const stochRawArr: number[] = [];
  for (let i = stochPeriod - 1; i < rsiArr.length; i++) {
    const window = rsiArr.slice(i - stochPeriod + 1, i + 1);
    const minRSI = Math.min(...window);
    const maxRSI = Math.max(...window);
    const range = maxRSI - minRSI;
    stochRawArr.push(range === 0 ? 0 : ((rsiArr[i] - minRSI) / range) * 100);
  }

  if (stochRawArr.length < kSmooth) return { k: 50, d: 50 };

  // K = SMA of raw stoch
  const kValues: number[] = [];
  for (let i = kSmooth - 1; i < stochRawArr.length; i++) {
    const slice = stochRawArr.slice(i - kSmooth + 1, i + 1);
    kValues.push(slice.reduce((a, b) => a + b, 0) / kSmooth);
  }

  if (kValues.length < dSmooth) return { k: kValues[kValues.length - 1] || 50, d: 50 };

  // D = SMA of K
  const dSlice = kValues.slice(-dSmooth);
  const d = dSlice.reduce((a, b) => a + b, 0) / dSmooth;
  const k = kValues[kValues.length - 1];

  return {
    k: parseFloat(k.toFixed(2)),
    d: parseFloat(d.toFixed(2)),
  };
}

// ─── Composite Indicators ────────────────────────────────────────────────────

function computeIndicators(candles: OHLCVCandle[]) {
  if (candles.length < 20) return null;
  const closes = candles.map(c => c.close);
  const rsi = computeRSI(closes);
  const ema20 = computeEMA(closes, 20);
  const ema50 = computeEMA(closes, 50);
  const ema200 = computeEMA(closes, 200);
  const macd = computeMACD(closes);
  const bb = computeBollingerBands(closes);
  const atr = computeATR(candles);
  const vwap = computeVWAP(candles);
  const stochRsi = computeStochRSI(closes);
  const close = closes[closes.length - 1];
  const volumeSMA20 = candles.slice(-20).reduce((a, c) => a + c.volume, 0) / 20;
  const currentVolume = candles[candles.length - 1].volume;
  const volumeRatio = volumeSMA20 > 0 ? parseFloat((currentVolume / volumeSMA20).toFixed(2)) : 1;
  return { rsi, ema20, ema50, ema200, macd, bb, atr, vwap, stochRsi, close, volumeSMA20, currentVolume, volumeRatio };
}

// ─── Market Structure Detection ───────────────────────────────────────────────

function detectFVGs(candles: OHLCVCandle[]) {
  const fvgs: Array<{ type: 'bullish' | 'bearish'; high: number; low: number; midpoint: number; index: number }> = [];
  for (let i = 2; i < candles.length; i++) {
    const c0 = candles[i - 2];
    const c2 = candles[i];
    if (c2.low > c0.high) {
      fvgs.push({ type: 'bullish', low: c0.high, high: c2.low, midpoint: parseFloat(((c0.high + c2.low) / 2).toFixed(2)), index: i });
    }
    if (c2.high < c0.low) {
      fvgs.push({ type: 'bearish', high: c0.low, low: c2.high, midpoint: parseFloat(((c0.low + c2.high) / 2).toFixed(2)), index: i });
    }
  }
  return fvgs.slice(-8);
}

function detectStructureEvents(candles: OHLCVCandle[]) {
  const events: Array<{ type: 'BOS' | 'CHOCH'; direction: 'bullish' | 'bearish'; price: number; index: number }> = [];
  const lookback = 10;

  let prevTrend: 'bullish' | 'bearish' | null = null;

  for (let i = lookback + 1; i < candles.length; i++) {
    const window = candles.slice(i - lookback - 1, i - 1);
    const swingHigh = Math.max(...window.map(c => c.high));
    const swingLow = Math.min(...window.map(c => c.low));
    const curr = candles[i];

    if (curr.close > swingHigh) {
      const type = prevTrend === 'bearish' ? 'CHOCH' : 'BOS';
      events.push({ type, direction: 'bullish', price: parseFloat(swingHigh.toFixed(2)), index: i });
      prevTrend = 'bullish';
    } else if (curr.close < swingLow) {
      const type = prevTrend === 'bullish' ? 'CHOCH' : 'BOS';
      events.push({ type, direction: 'bearish', price: parseFloat(swingLow.toFixed(2)), index: i });
      prevTrend = 'bearish';
    }
  }
  return events.slice(-8);
}

function detectOrderBlocks(candles: OHLCVCandle[]) {
  const obs: Array<{ type: 'demand' | 'supply'; high: number; low: number; midpoint: number; index: number }> = [];
  for (let i = 1; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    const isBullishMove = next1.close > next1.open && next2.close > next2.open && next1.close > prev.high;
    const isBearishMove = next1.close < next1.open && next2.close < next2.open && next1.close < prev.low;

    if (curr.close < curr.open && isBullishMove) {
      obs.push({ type: 'demand', high: parseFloat(curr.high.toFixed(2)), low: parseFloat(curr.low.toFixed(2)), midpoint: parseFloat(((curr.high + curr.low) / 2).toFixed(2)), index: i });
    }
    if (curr.close > curr.open && isBearishMove) {
      obs.push({ type: 'supply', high: parseFloat(curr.high.toFixed(2)), low: parseFloat(curr.low.toFixed(2)), midpoint: parseFloat(((curr.high + curr.low) / 2).toFixed(2)), index: i });
    }
  }
  return obs.slice(-6);
}

function detectLiquiditySweeps(candles: OHLCVCandle[]) {
  const sweeps: Array<{ type: 'high_sweep' | 'low_sweep'; level: number; index: number; closeDirection: 'bullish' | 'bearish' }> = [];
  const lookback = 20;
  for (let i = lookback + 1; i < candles.length; i++) {
    const window = candles.slice(i - lookback - 1, i - 1);
    const prevHigh = Math.max(...window.map(c => c.high));
    const prevLow = Math.min(...window.map(c => c.low));
    const curr = candles[i];

    if (curr.high > prevHigh && curr.close < prevHigh) {
      sweeps.push({ type: 'high_sweep', level: parseFloat(prevHigh.toFixed(2)), index: i, closeDirection: curr.close > curr.open ? 'bullish' : 'bearish' });
    }
    if (curr.low < prevLow && curr.close > prevLow) {
      sweeps.push({ type: 'low_sweep', level: parseFloat(prevLow.toFixed(2)), index: i, closeDirection: curr.close > curr.open ? 'bullish' : 'bearish' });
    }
  }
  return sweeps.slice(-6);
}

// ─── Volume Profile ───────────────────────────────────────────────────────────

function computeVolumeProfile(candles: OHLCVCandle[]) {
  if (!candles.length) return { poc: 0, vah: 0, val: 0, hvns: [] as number[] };

  const minPrice = Math.min(...candles.map(c => c.low));
  const maxPrice = Math.max(...candles.map(c => c.high));
  const numBuckets = 50;
  const bucketSize = (maxPrice - minPrice) / numBuckets;
  if (bucketSize <= 0) return { poc: candles[0].close, vah: candles[0].close, val: candles[0].close, hvns: [] };

  const buckets = new Array(numBuckets).fill(0);

  for (const c of candles) {
    const midPrice = (c.high + c.low + c.close) / 3;
    const idx = Math.min(Math.floor((midPrice - minPrice) / bucketSize), numBuckets - 1);
    if (idx >= 0 && idx < numBuckets) buckets[idx] += c.volume;
  }

  const maxVol = Math.max(...buckets);
  const pocIdx = buckets.indexOf(maxVol);
  const poc = minPrice + (pocIdx + 0.5) * bucketSize;

  const totalVol = buckets.reduce((a, b) => a + b, 0);
  const valueAreaTarget = totalVol * 0.7;
  let accum = maxVol;
  let lo = pocIdx, hi = pocIdx;

  while (accum < valueAreaTarget && (lo > 0 || hi < numBuckets - 1)) {
    const addLo = lo > 0 ? buckets[lo - 1] : -1;
    const addHi = hi < numBuckets - 1 ? buckets[hi + 1] : -1;
    if (addLo >= addHi && lo > 0) { accum += addLo; lo--; }
    else if (addHi > addLo && hi < numBuckets - 1) { accum += addHi; hi++; }
    else break;
  }

  const val = minPrice + lo * bucketSize;
  const vah = minPrice + (hi + 1) * bucketSize;

  const hvns = buckets
    .map((v, i) => ({ vol: v, price: minPrice + (i + 0.5) * bucketSize }))
    .filter(b => b.vol > maxVol * 0.70 && Math.abs(b.price - poc) > bucketSize * 2)
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 5)
    .map(b => parseFloat(b.price.toFixed(2)));

  return {
    poc: parseFloat(poc.toFixed(2)),
    vah: parseFloat(vah.toFixed(2)),
    val: parseFloat(val.toFixed(2)),
    hvns,
  };
}

// ─── Fibonacci Levels ─────────────────────────────────────────────────────────

function computeFibonacciLevels(candles: OHLCVCandle[]) {
  if (!candles.length) return {};
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const diff = swingHigh - swingLow;
  if (diff === 0) return {};

  return {
    swingHigh: parseFloat(swingHigh.toFixed(2)),
    swingLow: parseFloat(swingLow.toFixed(2)),
    retracements: {
      '0.236': parseFloat((swingHigh - diff * 0.236).toFixed(2)),
      '0.382': parseFloat((swingHigh - diff * 0.382).toFixed(2)),
      '0.5':   parseFloat((swingHigh - diff * 0.5).toFixed(2)),
      '0.618': parseFloat((swingHigh - diff * 0.618).toFixed(2)),
      '0.786': parseFloat((swingHigh - diff * 0.786).toFixed(2)),
    },
    extensions: {
      '1.0':   parseFloat(swingHigh.toFixed(2)),
      '1.272': parseFloat((swingHigh + diff * 0.272).toFixed(2)),
      '1.618': parseFloat((swingHigh + diff * 0.618).toFixed(2)),
      '2.0':   parseFloat((swingHigh + diff * 1.0).toFixed(2)),
      '2.618': parseFloat((swingHigh + diff * 1.618).toFixed(2)),
    },
  };
}

// ─── Pearson Correlation Engine ───────────────────────────────────────────────

function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;
  const xs = x.slice(-n);
  const ys = y.slice(-n);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    denX += Math.pow(xs[i] - meanX, 2);
    denY += Math.pow(ys[i] - meanY, 2);
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : parseFloat((num / den).toFixed(3));
}

async function computeCorrelations(pair: string, targetCloses: number[]): Promise<Record<string, number>> {
  const symbol = pair.split('/')[0];
  if (symbol === 'BTC' || targetCloses.length < 5) {
    return {};
  }

  try {
    const [btcCandles, ethCandles] = await Promise.allSettled([
      fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=30`).then(r => r.json()),
      fetch(`https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1d&limit=30`).then(r => r.json()),
    ]);

    const correlations: Record<string, number> = {};

    if (btcCandles.status === 'fulfilled' && Array.isArray(btcCandles.value)) {
      const btcCloses = btcCandles.value.map((k: unknown[]) => parseFloat(k[4] as string));
      correlations['BTC'] = computePearsonCorrelation(targetCloses.slice(-30), btcCloses);
    }
    if (ethCandles.status === 'fulfilled' && Array.isArray(ethCandles.value)) {
      const ethCloses = ethCandles.value.map((k: unknown[]) => parseFloat(k[4] as string));
      correlations['ETH'] = computePearsonCorrelation(targetCloses.slice(-30), ethCloses);
    }

    return correlations;
  } catch {
    return {};
  }
}

// ─── Long/Short Ratio ─────────────────────────────────────────────────────────

async function fetchLongShortRatio(pair: string): Promise<number> {
  try {
    const symbol = pair.replace('/', '');
    const res = await fetch(`/api/binance/lsratio/${symbol}`);
    if (!res.ok) throw new Error(`LS ratio error: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return parseFloat(data[0].longShortRatio);
    }
    return 1.0;
  } catch {
    return 1.0;
  }
}

// ─── OI 24h Change ────────────────────────────────────────────────────────────

async function fetchOIChange24h(pair: string): Promise<number> {
  try {
    const symbol = pair.replace('/', '');
    const res = await fetch(`/api/binance/oihistory/${symbol}`);
    if (!res.ok) throw new Error(`OI history error: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length >= 2) {
      const latest = parseFloat(data[data.length - 1].sumOpenInterest);
      const oldest = parseFloat(data[0].sumOpenInterest);
      if (oldest > 0) {
        return parseFloat(((latest - oldest) / oldest * 100).toFixed(2));
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

// ─── HUMAN JUDGMENT OVERRIDES ──────────────────────────────────────────────

function applyHumanJudgmentOverrides(result: AnalysisOutput, data: MarketDataPayload): AnalysisOutput {
  const processed = { ...result };

  // Override 1: Everything bearish but LTF shows bullish CHOCH
  if (result.bias === 'LONG' &&
      result.phase1?.macroBias?.includes('BEARISH') &&
      result.phase2?.fundamentalBias?.includes('BEARISH') &&
      result.phase3?.htfBias?.includes('BEARISH') &&
      result.phase4?.ltfBias?.includes('BULLISH') &&
      result.phase4?.recentCHOCH) {
    processed.confidence = Math.max(0, processed.confidence - 15);
    if (!processed.noTradeWaitFor) processed.noTradeWaitFor = [];
    processed.noTradeWaitFor.push('Liquidity sweep + volume confirmation + MTF score >+0.45 for CHOCH vs trend signal');
  }

  // Override 2: Extreme Fear trinity (Fear <20 + on-chain accumulation + HTF support + LTF reversal)
  if (result.bias === 'LONG' &&
      (data.fearGreedIndex || 50) < 20 &&
      result.phase2?.fundamentalBias?.includes('BULLISH') &&
      result.phase3?.htfBias?.includes('BULLISH') &&
      result.phase4?.ltfBias?.includes('BULLISH')) {
    // Allow confidence 58-65 to still signal despite other imperfections
    if (processed.confidence >= 58 && processed.confidence <= 65) {
      processed.whyThisTrade = {
        ...processed.whyThisTrade,
        macro: `${processed.whyThisTrade?.macro} | EXTREME FEAR TRINITY: Historically reliable contrarian setup`,
        onChain: `${processed.whyThisTrade?.onChain} | Whale accumulation at Fear <20`,
        htfTech: `${processed.whyThisTrade?.htfTech} | HTF support holding in capitulation`,
        ltfTech: `${processed.whyThisTrade?.ltfTech} | LTF reversal confirmation`,
        sentiment: `${processed.whyThisTrade?.sentiment} | Fear & Greed ${data.fearGreedIndex}: Extreme Fear creates generational entries`
      };
    }
  }

  // Override 3: Funding rate extreme warning
  if (result.bias === 'LONG' && (data.fundingRate || 0) > 0.08) {
    if (!processed.cancellationConditions) processed.cancellationConditions = [];
    processed.cancellationConditions.push('Funding rate spikes above 0.12% — liquidation cascade risk');
    processed.whyThisTrade = {
      ...processed.whyThisTrade,
      sentiment: `${processed.whyThisTrade?.sentiment} | WARNING: Funding rate ${(data.fundingRate || 0).toFixed(3)}% — entering crowded longs, conservative sizing mandatory`
    };
  }

  // Override 4: Distance-to-level sanity check
  if (processed.noTradeWaitFor) {
    processed.noTradeWaitFor = processed.noTradeWaitFor.filter(condition => {
      // Remove conditions waiting for levels >40% away
      const levelMatch = condition.match(/\$([0-9,]+)/);
      if (levelMatch) {
        const level = parseFloat(levelMatch[1].replace(/,/g, ''));
        const currentPrice = data.price || 0;
        const distance = Math.abs(level - currentPrice) / currentPrice;
        return distance <= 0.4; // Keep only levels within 40%
      }
      return true;
    });
  }

  return processed;
}

// ─── Main Analysis Hook ───────────────────────────────────────────────────────

export function useAnalysisEngine() {
  const store = useAnalysisStore();

  const runFullAnalysis = useCallback(async (pair: string) => {
    store.resetAnalysis();
    store.setIsAnalyzing(true);

    try {
      // ── PHASE 1: Macro & Market Context ────────────────────────────────────
      store.setPhaseProgress('phase1', 'running');
      const symbol = pair.split('/')[0];

      const [macroRes, fearGreedExtra] = await Promise.allSettled([
        fetchMacroSentiment(symbol),
        Promise.resolve(null),
      ]);

      const macroData = macroRes.status === 'fulfilled' ? macroRes.value : null;
      store.setPhaseProgress('phase1', 'complete');

      // ── PHASE 2: On-Chain & Fundamentals ───────────────────────────────────
      store.setPhaseProgress('phase2', 'running');

      const [onChainRes, fundingRateRes, oiDataRes, lsRatioRes, oiChange24hRes] = await Promise.allSettled([
        fetchOnChainMetrics(symbol),
        fetchFundingRate(pair),
        fetchOpenInterest(pair),
        fetchLongShortRatio(pair),
        fetchOIChange24h(pair),
      ]);

      const onChainData = onChainRes.status === 'fulfilled' ? onChainRes.value : null;
      const fr = fundingRateRes.status === 'fulfilled' ? fundingRateRes.value : 0;
      const oi = oiDataRes.status === 'fulfilled' ? oiDataRes.value : { oi: null, change24h: 0 };
      const lsRatio = lsRatioRes.status === 'fulfilled' ? lsRatioRes.value : 1.0;
      const oiChange24h = oiChange24hRes.status === 'fulfilled' ? oiChange24hRes.value : 0;

      store.setPhaseProgress('phase2', 'complete');

      // ── PHASE 3: HTF Technical Analysis (1D, 1W) ──────────────────────────
      store.setPhaseProgress('phase3', 'running');

      const [c1dRes, c1wRes] = await Promise.allSettled([
        fetchOHLCV(pair, '1D', 200),
        fetchOHLCV(pair, '1W', 52),
      ]);
      const c1d = c1dRes.status === 'fulfilled' ? c1dRes.value : [];
      const c1w = c1wRes.status === 'fulfilled' ? c1wRes.value : [];

      const ind1d = computeIndicators(c1d);
      const ind1w = computeIndicators(c1w);

      const volProfile = computeVolumeProfile(c1d.length >= 20 ? c1d : c1w);
      const fibLevels = computeFibonacciLevels(c1w.length >= 5 ? c1w : c1d);

      const latestPrice = c1d.length > 0 ? c1d[c1d.length - 1].close : 0;
      const priceChange24h = c1d.length > 1
        ? parseFloat(((c1d[c1d.length - 1].close - c1d[c1d.length - 2].close) / c1d[c1d.length - 2].close * 100).toFixed(2))
        : 0;
      const volume24h = c1d.length > 0
        ? parseFloat((c1d[c1d.length - 1].volume * c1d[c1d.length - 1].close).toFixed(2))
        : 0;

      store.setPhaseProgress('phase3', 'complete');

      // ── PHASE 4: LTF Technical Analysis (15m, 1H, 4H) ────────────────────
      store.setPhaseProgress('phase4', 'running');

      const [c15mRes, c1hRes, c4hRes] = await Promise.allSettled([
        fetchOHLCV(pair, '15m', 200),
        fetchOHLCV(pair, '1H', 200),
        fetchOHLCV(pair, '4H', 200),
      ]);
      const c15m = c15mRes.status === 'fulfilled' ? c15mRes.value : [];
      const c1h  = c1hRes.status  === 'fulfilled' ? c1hRes.value  : [];
      const c4h  = c4hRes.status  === 'fulfilled' ? c4hRes.value  : [];

      const ind15m = computeIndicators(c15m);
      const ind1h  = computeIndicators(c1h);
      const ind4h  = computeIndicators(c4h);

      const structureCandles = c1h.length >= 11 ? c1h : c4h;
      const structureEvents = detectStructureEvents(structureCandles);
      const fvgZones = detectFVGs(c1h.length >= 3 ? c1h : c4h);
      const orderBlocks = detectOrderBlocks(c4h.length >= 3 ? c4h : c1d);
      const liquiditySweeps = detectLiquiditySweeps(c1h.length >= 21 ? c1h : c4h);

      // Correlation engine: 30-day daily closes
      const targetCloses = c1d.slice(-30).map(c => c.close);
      const correlations = await computeCorrelations(pair, targetCloses);

      // MTF confluence
      const timeframeBiases = [
        { timeframe: '15m' as const, bias: ind15m ? confluenceToTimeframeBias({ ...ind15m, macdHistogram: ind15m.macd.histogram, timeframe: '15m' }) : 0 as const, rsi: ind15m?.rsi || 50, macdSignal: 'neutral' as const, emaAlignment: 'mixed' as const, bbPosition: 'inside' as const },
        { timeframe: '1H'  as const, bias: ind1h  ? confluenceToTimeframeBias({ ...ind1h,  macdHistogram: ind1h.macd.histogram,  timeframe: '1H'  }) : 0 as const, rsi: ind1h?.rsi  || 50, macdSignal: 'neutral' as const, emaAlignment: 'mixed' as const, bbPosition: 'inside' as const },
        { timeframe: '4H'  as const, bias: ind4h  ? confluenceToTimeframeBias({ ...ind4h,  macdHistogram: ind4h.macd.histogram,  timeframe: '4H'  }) : 0 as const, rsi: ind4h?.rsi  || 50, macdSignal: 'neutral' as const, emaAlignment: 'mixed' as const, bbPosition: 'inside' as const },
        { timeframe: '1D'  as const, bias: ind1d  ? confluenceToTimeframeBias({ ...ind1d,  macdHistogram: ind1d.macd.histogram,  timeframe: '1D'  }) : 0 as const, rsi: ind1d?.rsi  || 50, macdSignal: 'neutral' as const, emaAlignment: 'mixed' as const, bbPosition: 'inside' as const },
        { timeframe: '1W'  as const, bias: ind1w  ? confluenceToTimeframeBias({ ...ind1w,  macdHistogram: ind1w.macd.histogram,  timeframe: '1W'  }) : 0 as const, rsi: ind1w?.rsi  || 50, macdSignal: 'neutral' as const, emaAlignment: 'mixed' as const, bbPosition: 'inside' as const },
      ];
      const mtfScore = computeMTFConfluenceScore(timeframeBiases);

      store.setPhaseProgress('phase4', 'complete');

      // ── PHASE 5: Synthesis — send to Claude ─────────────────────────────
      store.setPhaseProgress('phase5', 'running');

      const fundingRateStatus: 'neutral' | 'overheated_long' | 'overheated_short' | 'unavailable' =
        fr === null ? 'unavailable' : fr > 0.001 ? 'overheated_long' : fr < -0.001 ? 'overheated_short' : 'neutral';

      // Validate we have enough data
      const availableTimeframes = [c15m, c1h, c4h, c1d, c1w].filter(c => c.length > 0).length;
      if (availableTimeframes < 3) {
        throw new Error('Insufficient data: fewer than 3 timeframes available. Analysis aborted.');
      }
      if (!macroData && !onChainData) {
        throw new Error('Both macro and on-chain data unavailable. Analysis aborted per risk management rules.');
      }

      // Fetch advanced analytics data
      const [optionsData, supplyDist, hodlWaves, networkHealth, orderBookData] = await Promise.allSettled([
        analyzeOptionsIntelligence(symbol),
        fetchSupplyDistribution(symbol),
        fetchHodlWaves(symbol),
        fetchNetworkHealthMetrics(symbol),
        fetchOrderBook(pair)
      ]);

      const optionsIntel = optionsData.status === 'fulfilled' ? optionsData.value : null;
      const supplyDistribution = supplyDist.status === 'fulfilled' ? supplyDist.value : null;
      const hodlWavesData = hodlWaves.status === 'fulfilled' ? hodlWaves.value : null;
      const networkHealthData = networkHealth.status === 'fulfilled' ? networkHealth.value : null;
      const orderBook = orderBookData.status === 'fulfilled' ? orderBookData.value : { bids: [], asks: [] };

      // Calculate advanced risk metrics
      const dailyReturns = c1d.slice(-30).map((c, i) => i > 0 ? (c.close - c1d[i-1].close) / c1d[i-1].close : 0).filter(r => r !== 0);
      const sharpeRatio = calculateSharpeRatio(dailyReturns);
      const sortinoRatio = calculateSortinoRatio(dailyReturns);
      const valueAtRisk = calculateValueAtRisk(dailyReturns);
      const expectedShortfall = calculateExpectedShortfall(dailyReturns);
      const maxDrawdown = calculateMaximumDrawdown(c1d.map(c => c.close));

      // Calculate regime and momentum analytics
      const regime = detectRegime(c1d.map(c => c.close));
      const momentumHalfLife = calculateMomentumHalfLife(dailyReturns);

      // Calculate beta vs BTC and ETH
      const btcReturns = correlations['BTC'] !== undefined ? [] : dailyReturns; // Simplified
      const ethReturns = correlations['ETH'] !== undefined ? [] : dailyReturns; // Simplified
      const betaVsBtc = btcReturns.length > 0 ? calculateBeta(dailyReturns, btcReturns) : 1;
      const betaVsEth = ethReturns.length > 0 ? calculateBeta(dailyReturns, ethReturns) : 1;

      // Analyze liquidity
      const liquidityAnalysis = analyzeLiquidity(orderBook, latestPrice);

      // Calculate statistical significance
      const zScore = dailyReturns.length > 0 ? calculateZScore(
        dailyReturns[dailyReturns.length - 1],
        dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length,
        Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - (dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length), 2), 0) / dailyReturns.length)
      ) : 0;

      const payload: MarketDataPayload = {
        pair,
        price: latestPrice,
        priceChange24h,
        volume24h,
        fundingRate: fr,
        fundingRateStatus,
        openInterest: oi.oi,
        oiChange24h,
        longShortRatio: lsRatio,
        liquidationLevels: JSON.stringify([]),
        dxy: macroData?.dxy || 0,
        dxyTrend: macroData?.dxyTrend || 'neutral',
        interestRateExpectation: macroData?.interestRateExpectation || 'neutral',
        globalLiquidityTrend: macroData?.globalLiquidityTrend || 'neutral',
        btcDominance: macroData?.btcDominance || 0,
        totalMarketCap: macroData?.totalMarketCap || 0,
        total2MarketCap: macroData?.total2MarketCap || 0,
        fearGreedIndex: macroData?.fearGreedIndex || 50,
        fearGreedLabel: macroData?.fearGreedLabel || 'Neutral',
        dominantNarrative: macroData?.dominantNarrative || 'Unknown',
        assetNarrativeTags: macroData?.assetNarrativeTags || [],
        socialSentimentScore: macroData?.socialSentimentScore || 0,
        socialVolume: macroData?.socialVolume || 0,
        recentNewsHeadlines: macroData?.recentNewsHeadlines || [],
        exchangeNetFlow: onChainData?.exchangeNetFlow || 0,
        exchangeReservesTrend: onChainData?.exchangeReservesTrend || 'neutral',
        whaleBehavior: onChainData?.whaleBehavior || 'neutral',
        mvrv: onChainData?.mvrv ?? 1.0,
        // sopr: null means the metric is unavailable on this data tier — Claude will see it as such
        sopr: onChainData ? (onChainData.sopr !== undefined ? onChainData.sopr : null) : null,
        nvtRatio: onChainData?.nvtRatio,
        etfNetFlow24h: onChainData?.etfNetFlow24h,
        etfNetFlowWeekly: onChainData?.etfNetFlowWeekly,
        tokenUnlockWarning: onChainData?.tokenUnlockWarning,
        technicalByTimeframe: {
          '15m': ind15m,
          '1H':  ind1h,
          '4H':  ind4h,
          '1D':  ind1d,
          '1W':  ind1w,
        },
        volumeProfile: volProfile,
        structureEvents,
        fvgZones,
        orderBlocks,
        liquiditySweeps,
        mtfConfluenceScore: mtfScore,
        fibonacciLevels: fibLevels,
        correlations,

        // Advanced Analytics Extensions
        advancedAnalytics: {
          // Risk Metrics
          riskMetrics: {
            sharpeRatio,
            sortinoRatio,
            valueAtRisk,
            expectedShortfall,
            maximumDrawdown: maxDrawdown,
            zScore
          },

          // Market Regime & Momentum
          regimeAnalysis: {
            currentRegime: regime,
            momentumHalfLife,
            betaVsBtc,
            betaVsEth
          },

          // Options Intelligence
          optionsData: optionsIntel,

          // Enhanced On-Chain
          supplyDistribution,
          hodlWaves: hodlWavesData,
          networkHealth: networkHealthData,

          // Liquidity Analysis
          liquidityAnalysis,

          // Statistical Significance
          statisticalSignificance: {
            signalZScore: zScore,
            confidenceInterval: zScore > 2 ? '99%' : zScore > 1.96 ? '95%' : zScore > 1.64 ? '90%' : '<90%'
          }
        }
      };

      const result = await runAnalysis(pair, payload);

      // Apply human judgment overrides
      const processedResult = applyHumanJudgmentOverrides(result, payload);

      // Validate signal integrity
      const validation = validateInstitutionalSignal(processedResult, payload);
      let finalResult: AnalysisOutput = processedResult;
      if (validation.overrideToNoTrade) {
        finalResult = {
          ...processedResult,
          bias: 'NO_TRADE',
          finalVerdict: 'NO_TRADE',
          noTradeReason: validation.warnings.join('; ')
        };
      }

      // Add validation metadata
      finalResult.validationResult = validation;

      store.setPhaseProgress('phase5', 'complete');
      store.setResult(finalResult);
      store.setPhase('complete');
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Analysis failed');
      store.setPhase('error');
      store.setPhaseProgress('phase1', 'pending');
    } finally {
      store.setIsAnalyzing(false);
    }
  }, [store]);

  return { runFullAnalysis };
}
