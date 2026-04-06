import type { AnalysisOutput, ValidationResult } from '../types/signal.types';

export interface InstitutionalValidationSettings {
  minConfidenceThreshold: number;
  maxSlPercentMajorCaps: number;
  maxSlPercentAltcoins: number;
  minRR: number;
  fundingRateCrowdedThreshold: number;
  fundingRateExtremeThreshold: number;
  dxyHeadwindThreshold: number;
  tokenUnlockDaysThreshold: number;
  tokenUnlockSupplyThreshold: number;
  newsEventHoursThreshold: number;
  mtfScoreThreshold: number;
  phaseAlignmentMinimum: number;
}

// Institutional-grade validation settings
const INSTITUTIONAL_SETTINGS: InstitutionalValidationSettings = {
  minConfidenceThreshold: 55,
  maxSlPercentMajorCaps: 8,      // BTC, ETH, SOL, BNB, XRP
  maxSlPercentAltcoins: 15,      // All other assets
  minRR: 2.0,
  fundingRateCrowdedThreshold: 0.05,
  fundingRateExtremeThreshold: 0.10,
  dxyHeadwindThreshold: 102,
  tokenUnlockDaysThreshold: 7,
  tokenUnlockSupplyThreshold: 10,  // 10% of circulating supply
  newsEventHoursThreshold: 12,
  mtfScoreThreshold: 0.30,
  phaseAlignmentMinimum: 3
};

export function validateInstitutionalSignal(signal: AnalysisOutput, data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── MANDATORY NO_TRADE CONDITIONS ──────────────────────────────────────

  // 1. Phase alignment minimum
  const phaseCount = countPhaseAlignment(signal);
  if (phaseCount < INSTITUTIONAL_SETTINGS.phaseAlignmentMinimum) {
    errors.push(`Only ${phaseCount}/4 phases aligned toward trade direction — insufficient confluence`);
  }

  // 2. MTF confluence score threshold
  if (Math.abs(signal.phase5?.mtfConfluenceScore || 0) <= INSTITUTIONAL_SETTINGS.mtfScoreThreshold) {
    errors.push(`MTF confluence score in neutral zone (|${signal.phase5?.mtfConfluenceScore?.toFixed(2)}| ≤ ${INSTITUTIONAL_SETTINGS.mtfScoreThreshold}) — insufficient directional alignment`);
  }

  // 3. Confidence threshold
  if (signal.confidence < INSTITUTIONAL_SETTINGS.minConfidenceThreshold) {
    errors.push(`Confidence ${signal.confidence}% below ${INSTITUTIONAL_SETTINGS.minConfidenceThreshold}% institutional threshold`);
  }

  // 4. Risk/Reward minimum
  if (signal.riskReward < INSTITUTIONAL_SETTINGS.minRR) {
    errors.push(`Risk/Reward ${signal.riskReward.toFixed(1)} below 1:${INSTITUTIONAL_SETTINGS.minRR} minimum`);
  }

  // 5. Entry trigger requirement
  if (!signal.phase4?.entryTrigger || signal.phase4.entryTrigger === 'no specific trigger identified') {
    errors.push('No specific, identifiable entry trigger — cannot execute without clear timing');
  }

  // 6. Token unlock risk
  if (data.tokenUnlockWarning &&
      data.tokenUnlockWarning.percentOfCirculating > INSTITUTIONAL_SETTINGS.tokenUnlockSupplyThreshold) {
    errors.push(`Token unlock within 7 days represents ${data.tokenUnlockWarning.percentOfCirculating}% of supply — extreme bearish headwind`);
  }

  // 7. Stop loss hard cap
  const slPercent = calculateSLPercent(signal.entry, signal.stopLoss);
  const maxSL = getSLHardCap(signal.pair);
  if (slPercent > maxSL) {
    errors.push(`Stop loss ${slPercent.toFixed(1)}% exceeds ${maxSL}% hard cap for ${signal.pair.includes('BTC') || signal.pair.includes('ETH') ? 'major cap' : 'altcoin'}`);
  }

  // 8. Critical data availability
  if ((!data.onChainData || Object.keys(data.onChainData).length === 0) &&
      (!data.macroData || Object.keys(data.macroData).length === 0)) {
    errors.push('Critical data unavailable — both on-chain and macro data missing');
  }

  // ─── CONDITIONAL VALIDATION (warnings, not blocking) ───────────────────

  // Funding rate warnings
  if (signal.bias === 'LONG') {
    if ((data.fundingRate || 0) > INSTITUTIONAL_SETTINGS.fundingRateExtremeThreshold) {
      warnings.push('EXTREME WARNING: Funding rate >0.10% — entering extremely crowded long position, liquidation cascade risk elevated');
    } else if ((data.fundingRate || 0) > INSTITUTIONAL_SETTINGS.fundingRateCrowdedThreshold) {
      warnings.push('WARNING: Funding rate >0.05% — longs are crowded, reduce position size');
    }
  }

  // DXY headwind
  if (signal.bias === 'LONG' && (data.dxy || 100) > INSTITUTIONAL_SETTINGS.dxyHeadwindThreshold) {
    warnings.push(`DXY at ${(data.dxy || 100).toFixed(1)} — significant headwind for risk-on assets`);
  }

  // Fear & Greed context
  if (signal.bias === 'LONG' && (data.fearGreedIndex || 50) < 20) {
    warnings.push('POSITIVE: Extreme Fear (<20) historically creates excellent long opportunities');
  } else if (signal.bias === 'SHORT' && (data.fearGreedIndex || 50) < 20) {
    warnings.push('WARNING: Extreme Fear increases squeeze risk for shorts');
  }

  // OI at all-time highs
  if (signal.bias === 'LONG' && data.oiChange24h && data.oiChange24h > 50) {
    warnings.push('CAUTION: OI at elevated levels — leverage risk increased for longs');
  }

  // News event proximity
  if (data.majorNewsEventWithinHours && data.majorNewsEventWithinHours <= INSTITUTIONAL_SETTINGS.newsEventHoursThreshold) {
    warnings.push(`CAUTION: Major news event within ${data.majorNewsEventWithinHours} hours — price behavior unpredictable`);
  }

  // ─── PHASE CONFLICT DETECTION ──────────────────────────────────────────

  // HTF vs LTF conflict
  if (signal.phase3?.htfBias && signal.phase4?.ltfBias) {
    const htfDirection = signal.phase3.htfBias.toLowerCase();
    const ltfDirection = signal.phase4.ltfBias.toLowerCase();

    if ((htfDirection.includes('bearish') && ltfDirection.includes('bullish')) ||
        (htfDirection.includes('bullish') && ltfDirection.includes('bearish'))) {
      warnings.push('PHASE CONFLICT: HTF and LTF biases oppose each other — requires exceptional confluence to proceed');
    }
  }

  // ─── RESULT COMPILATION ─────────────────────────────────────────────────

  const isValid = errors.length === 0 || signal.bias === 'NO_TRADE';
  const overrideToNoTrade = errors.some(e => e.includes('insufficient') ||
                                             e.includes('below') ||
                                             e.includes('exceeds') ||
                                             e.includes('cannot execute') ||
                                             e.includes('extreme bearish'));

  return {
    isValid,
    warnings: [...errors, ...warnings],
    overrideToNoTrade,
    phaseAlignmentScore: phaseCount,
    riskRewardRatio: signal.riskReward,
    stopLossPercent: slPercent,
    confidenceScore: signal.confidence,
    mtfConfluenceScore: signal.phase5?.mtfConfluenceScore || 0
  };
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────

function countPhaseAlignment(signal: AnalysisOutput): number {
  let aligned = 0;
  const phases = [
    signal.phase1?.macroBias,
    signal.phase2?.fundamentalBias,
    signal.phase3?.htfBias,
    signal.phase4?.ltfBias
  ];

  const targetDirection = signal.bias === 'LONG' ? 'bullish' :
                         signal.bias === 'SHORT' ? 'bearish' : null;

  if (!targetDirection) return 0;

  phases.forEach(phase => {
    if (phase && phase.toLowerCase().includes(targetDirection)) aligned++;
  });

  return aligned;
}

function calculateSLPercent(entry: number | number[], stopLoss: number): number {
  if (!entry || !stopLoss) return 0;
  const entryPrice = Array.isArray(entry) ? entry[0] : entry;
  return Math.abs(entryPrice - stopLoss) / entryPrice * 100;
}

function getSLHardCap(pair: string): number {
  const majorCaps = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
  const isMajorCap = majorCaps.some(cap => pair.toUpperCase().includes(cap));
  return isMajorCap ? INSTITUTIONAL_SETTINGS.maxSlPercentMajorCaps : INSTITUTIONAL_SETTINGS.maxSlPercentAltcoins;
}

// ─── LEGACY COMPATIBILITY FUNCTIONS ──────────────────────────────────────

export function validateSignal(signal: AnalysisOutput, settings?: any): ValidationResult {
  // For backward compatibility, call the new institutional validator
  return validateInstitutionalSignal(signal, {});
}

export function applyCommonSenseRules(signal: AnalysisOutput, context: any): AnalysisOutput {
  // Legacy function - now handled in the main validation
  return signal;
}

