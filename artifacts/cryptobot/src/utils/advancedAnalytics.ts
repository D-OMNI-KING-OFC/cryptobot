import _ from 'lodash';
import moment from 'moment';

// ─── ADVANCED STATISTICAL FUNCTIONS ───────────────────────────────

export function calculateZScore(value: number, mean: number, std: number): number {
  return std > 0 ? (value - mean) / std : 0;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
  if (returns.length < 2) return 0;
  const avgReturn = _.mean(returns);
  const volatility = Math.sqrt(_.mean(returns.map(r => Math.pow(r - avgReturn, 2))));
  return volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
}

export function calculateSortinoRatio(returns: number[], riskFreeRate = 0.02): number {
  if (returns.length < 2) return 0;
  const avgReturn = _.mean(returns);
  const downsideReturns = returns.filter(r => r < riskFreeRate);
  const downsideVolatility = downsideReturns.length > 0
    ? Math.sqrt(_.mean(downsideReturns.map(r => Math.pow(r - riskFreeRate, 2))))
    : 0;
  return downsideVolatility > 0 ? (avgReturn - riskFreeRate) / downsideVolatility : 0;
}

export function calculateValueAtRisk(returns: number[], confidence = 0.95): number {
  if (returns.length < 10) return 0;
  const sortedReturns = _.sortBy(returns);
  const index = Math.floor((1 - confidence) * returns.length);
  return -sortedReturns[index]; // Negative because VaR is loss
}

export function calculateExpectedShortfall(returns: number[], confidence = 0.95): number {
  if (returns.length < 10) return 0;
  const sortedReturns = _.sortBy(returns);
  const varIndex = Math.floor((1 - confidence) * returns.length);
  const tailReturns = sortedReturns.slice(0, varIndex + 1);
  return -_.mean(tailReturns); // Average of losses beyond VaR
}

export function calculateMaximumDrawdown(prices: number[]): number {
  if (prices.length < 2) return 0;
  let maxDrawdown = 0;
  let peak = prices[0];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    }
    const drawdown = (peak - prices[i]) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return maxDrawdown;
}

export function calculateBeta(assetReturns: number[], marketReturns: number[]): number {
  if (assetReturns.length !== marketReturns.length || assetReturns.length < 2) return 1;

  const assetMean = _.mean(assetReturns);
  const marketMean = _.mean(marketReturns);

  const covariance = _.mean(assetReturns.map((r, i) => (r - assetMean) * (marketReturns[i] - marketMean)));
  const marketVariance = _.mean(marketReturns.map(r => Math.pow(r - marketMean, 2)));

  return marketVariance > 0 ? covariance / marketVariance : 1;
}

export function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length < 2) return 0;

  const mean1 = _.mean(returns1);
  const mean2 = _.mean(returns2);

  const covariance = _.mean(returns1.map((r, i) => (r - mean1) * (returns2[i] - mean2)));
  const std1 = Math.sqrt(_.mean(returns1.map(r => Math.pow(r - mean1, 2))));
  const std2 = Math.sqrt(_.mean(returns2.map(r => Math.pow(r - mean2, 2))));

  return (std1 > 0 && std2 > 0) ? covariance / (std1 * std2) : 0;
}

export function calculateAutocorrelation(returns: number[], lag = 1): number {
  if (returns.length <= lag) return 0;

  const current = returns.slice(lag);
  const lagged = returns.slice(0, -lag);

  return calculateCorrelation(current, lagged);
}

export function detectRegime(prices: number[]): 'trending' | 'ranging' | 'volatile' {
  if (prices.length < 20) return 'ranging';

  // Calculate trend strength (linear regression slope)
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;

  const sumX = _.sum(x);
  const sumY = _.sum(y);
  const sumXY = _.sum(x.map((xi, i) => xi * y[i]));
  const sumXX = _.sum(x.map(xi => xi * xi));

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = _.sum(y.map((yi, i) => Math.pow(yi - (slope * x[i] + intercept), 2)));
  const ssTot = _.sum(y.map(yi => Math.pow(yi - yMean, 2)));
  const rSquared = 1 - (ssRes / ssTot);

  // Calculate volatility (coefficient of variation)
  const volatility = Math.sqrt(_.mean(y.map(price => Math.pow(price - yMean, 2)))) / yMean;

  // Classify regime
  if (rSquared > 0.7 && Math.abs(slope) > volatility * 0.1) {
    return 'trending';
  } else if (volatility > 0.05) {
    return 'volatile';
  } else {
    return 'ranging';
  }
}

export function calculateMomentumHalfLife(returns: number[]): number {
  if (returns.length < 10) return 0;

  // Estimate mean-reversion speed using Ornstein-Uhlenbeck process
  // This is a simplified approximation
  const autocorr = calculateAutocorrelation(returns, 1);
  if (autocorr <= 0) return 0;

  // Half-life formula: ln(0.5) / ln(autocorrelation)
  return Math.log(0.5) / Math.log(Math.abs(autocorr));
}

// ─── ADVANCED ON-CHAIN ANALYTICS ───────────────────────────────

export interface SupplyDistribution {
  top10: number;      // % held by top 10 addresses
  top100: number;     // % held by top 100 addresses
  top1000: number;    // % held by top 1000 addresses
  top10k: number;     // % held by top 10k addresses
}

export interface HodlWaves {
  hodl_1d_to_1w: number;    // % of supply held 1 day to 1 week
  hodl_1w_to_1m: number;    // % of supply held 1 week to 1 month
  hodl_1m_to_3m: number;    // % of supply held 1 month to 3 months
  hodl_3m_to_6m: number;    // % of supply held 3 months to 6 months
  hodl_6m_to_1y: number;    // % of supply held 6 months to 1 year
  hodl_1y_to_2y: number;    // % of supply held 1 year to 2 years
  hodl_2y_plus: number;     // % of supply held more than 2 years
}

export interface NetworkHealthScore {
  developerActivity: number;    // GitHub commits, issues, PRs (0-100)
  securityIncidents: number;    // Recent security events (inverse scored)
  upgradeReadiness: number;     // Network upgrade progress
  decentralization: number;     // Node distribution, stake concentration
  adoption: number;            // Daily active users, transaction volume
  overall: number;             // Composite score
}

export function calculateNetworkHealthScore(metrics: {
  githubActivity?: number;
  securityIncidents?: number;
  upgradeProgress?: number;
  nodeCount?: number;
  stakeConcentration?: number;
  dau?: number;
  txVolume?: number;
}): NetworkHealthScore {
  const developerActivity = Math.min(100, (metrics.githubActivity || 0) * 10);
  const securityIncidents = Math.max(0, 100 - (metrics.securityIncidents || 0) * 20);
  const upgradeReadiness = metrics.upgradeProgress || 0;
  const decentralization = Math.max(0, 100 - (metrics.stakeConcentration || 0));
  const adoption = Math.min(100, Math.log10((metrics.dau || 1) * (metrics.txVolume || 1)) * 10);

  const overall = _.mean([developerActivity, securityIncidents, upgradeReadiness, decentralization, adoption]);

  return {
    developerActivity,
    securityIncidents,
    upgradeReadiness,
    decentralization,
    adoption,
    overall
  };
}

// ─── OPTIONS MARKET INTELLIGENCE ───────────────────────────────

export interface OptionsIntelligence {
  putCallRatio: number;
  impliedVolatility: number;
  volatilitySkew: number;
  openInterestByStrike: Record<number, number>;
  gammaExposure: number;
  deltaHedgingFlow: 'bullish' | 'bearish' | 'neutral';
  maxPain: number;
}

export function analyzeOptionsData(optionsData: any[]): OptionsIntelligence {
  if (!optionsData || optionsData.length === 0) {
    return {
      putCallRatio: 1,
      impliedVolatility: 0,
      volatilitySkew: 0,
      openInterestByStrike: {},
      gammaExposure: 0,
      deltaHedgingFlow: 'neutral',
      maxPain: 0
    };
  }

  // This would require actual options data from Deribit or similar
  // For now, return placeholder structure
  const calls = optionsData.filter(o => o.type === 'call');
  const puts = optionsData.filter(o => o.type === 'put');

  const callOI = _.sum(calls.map(c => c.openInterest || 0));
  const putOI = _.sum(puts.map(p => p.openInterest || 0));

  const putCallRatio = callOI > 0 ? putOI / callOI : 1;

  return {
    putCallRatio,
    impliedVolatility: _.mean(optionsData.map(o => o.impliedVolatility || 0)),
    volatilitySkew: 0, // Would calculate put vs call IV skew
    openInterestByStrike: {}, // Would need actual options data
    gammaExposure: 0, // Would calculate gamma exposure
    deltaHedgingFlow: putCallRatio > 1.5 ? 'bearish' : putCallRatio < 0.7 ? 'bullish' : 'neutral',
    maxPain: 0 // Would calculate maximum pain price
  };
}

// ─── LIQUIDITY ANALYSIS ───────────────────────────────

export interface LiquidityAnalysis {
  orderBookDepth: { bids: number[][]; asks: number[][] };
  slippageSimulation: (size: number) => number;
  marketImpact: number;
  spreadAnalysis: { effective: number; realized: number };
  liquidityScore: number;
}

export function analyzeLiquidity(orderBook: { bids: number[][]; asks: number[][] }, spotPrice: number): LiquidityAnalysis {
  const bids = orderBook.bids || [];
  const asks = orderBook.asks || [];

  // Calculate order book depth (top 10 levels)
  const bidDepth = bids.slice(0, 10);
  const askDepth = asks.slice(0, 10);

  // Calculate spread
  const bestBid = bidDepth[0]?.[0] || spotPrice;
  const bestAsk = askDepth[0]?.[0] || spotPrice;
  const effectiveSpread = (bestAsk - bestBid) / spotPrice;

  // Calculate slippage simulation
  const slippageSimulation = (size: number): number => {
    let remainingSize = size;
    let totalCost = 0;
    let weightedPrice = 0;

    // Simulate market buy order
    for (const [price, volume] of asks) {
      if (remainingSize <= 0) break;
      const fillSize = Math.min(remainingSize, volume);
      totalCost += fillSize * price;
      weightedPrice += fillSize;
      remainingSize -= fillSize;
    }

    return remainingSize > 0 ? 0 : totalCost / (size - remainingSize) / spotPrice - 1;
  };

  // Calculate market impact (simplified)
  const totalBidVolume = _.sum(bidDepth.map(b => b[1]));
  const totalAskVolume = _.sum(askDepth.map(a => a[1]));
  const marketImpact = Math.abs(totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume);

  // Liquidity score (0-100)
  const liquidityScore = Math.min(100, (totalBidVolume + totalAskVolume) / 1000 * effectiveSpread * -100 + 100);

  return {
    orderBookDepth: { bids: bidDepth, asks: askDepth },
    slippageSimulation,
    marketImpact,
    spreadAnalysis: {
      effective: effectiveSpread,
      realized: effectiveSpread * 1.2 // Simplified
    },
    liquidityScore
  };
}

// ─── PORTFOLIO OPTIMIZATION ───────────────────────────────

export interface PortfolioOptimization {
  optimalWeights: Record<string, number>;
  riskParityWeights: Record<string, number>;
  correlationMatrix: number[][];
  expectedReturns: Record<string, number>;
  volatilities: Record<string, number>;
  sharpeOptimal: Record<string, number>;
}

export function optimizePortfolio(
  assets: string[],
  returns: Record<string, number[]>,
  riskTolerance = 0.5
): PortfolioOptimization {
  const n = assets.length;
  const correlationMatrix: number[][] = [];

  // Calculate correlation matrix
  for (let i = 0; i < n; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      correlationMatrix[i][j] = calculateCorrelation(returns[assets[i]], returns[assets[j]]);
    }
  }

  // Calculate expected returns and volatilities
  const expectedReturns: Record<string, number> = {};
  const volatilities: Record<string, number> = {};

  for (const asset of assets) {
    expectedReturns[asset] = _.mean(returns[asset]);
    volatilities[asset] = Math.sqrt(_.mean(returns[asset].map(r => Math.pow(r - expectedReturns[asset], 2))));
  }

  // Simple risk parity weights (equal risk contribution)
  const riskParityWeights: Record<string, number> = {};
  const totalVolatility = _.sum(Object.values(volatilities));
  for (const asset of assets) {
    riskParityWeights[asset] = volatilities[asset] / totalVolatility;
  }

  // Markowitz optimization (simplified - equal weight for now)
  const optimalWeights: Record<string, number> = {};
  const equalWeight = 1 / n;
  for (const asset of assets) {
    optimalWeights[asset] = equalWeight;
  }

  // Sharpe-optimal (simplified)
  const sharpeOptimal: Record<string, number> = {};
  const riskFreeRate = 0.02;
  let totalSharpeWeight = 0;

  for (const asset of assets) {
    const sharpe = (expectedReturns[asset] - riskFreeRate) / volatilities[asset];
    sharpeOptimal[asset] = Math.max(0, sharpe);
    totalSharpeWeight += sharpeOptimal[asset];
  }

  if (totalSharpeWeight > 0) {
    for (const asset of assets) {
      sharpeOptimal[asset] /= totalSharpeWeight;
    }
  }

  return {
    optimalWeights,
    riskParityWeights,
    correlationMatrix,
    expectedReturns,
    volatilities,
    sharpeOptimal
  };
}