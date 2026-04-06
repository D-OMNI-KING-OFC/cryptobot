import type { AnalysisOutput } from '../../types/signal.types';
import { formatPrice, formatPercent, getConfidenceColor, getBiasColor } from '../../utils/formatters';
import { NoTradeCard } from './NoTradeCard';
import { TrendingUp, TrendingDown, Check, X, Minus } from 'lucide-react';

function BiasIcon({ bias }: { bias: string }) {
  if (bias.includes('bullish')) return <Check className="w-3 h-3 text-bullish" />;
  if (bias.includes('bearish')) return <X className="w-3 h-3 text-bearish" />;
  return <Minus className="w-3 h-3 text-info" />;
}

export function SignalReport({ result }: { result: AnalysisOutput }) {
  if (result.bias === 'NO_TRADE') return <NoTradeCard result={result} />;

  const isLong = result.bias === 'LONG';
  const biasColor = getBiasColor(result.bias);
  const confidenceColor = getConfidenceColor(result.confidence);
  const entry = Array.isArray(result.entry) ? result.entry : [result.entry, result.entry];
  const entryDisplay = Array.isArray(result.entry)
    ? `${formatPrice(result.entry[0])} — ${formatPrice(result.entry[1])}`
    : formatPrice(result.entry);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in space-y-5">
      <div className="border-t border-b border-border/50 py-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-heading text-xl text-text-primary uppercase tracking-widest">{result.pair}</div>
            <div className="text-text-secondary font-mono text-xs mt-1">{result.timestamp}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end" style={{ color: biasColor }}>
              {isLong ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="font-heading text-2xl tracking-widest">{isLong ? '▲ LONG' : '▼ SHORT'}</span>
            </div>
            <div className="font-mono text-sm mt-1" style={{ color: confidenceColor }}>
              CONFIDENCE: {result.confidence}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {[
            { label: 'SETUP', value: result.setup, mono: false },
            { label: 'ENTRY', value: entryDisplay, mono: true },
            { label: 'STOP LOSS', value: formatPrice(result.stopLoss), mono: true, color: '#ff2d55' },
            { label: 'TAKE PROFIT 1', value: formatPrice(result.tp1), mono: true, color: '#00ff9d' },
            { label: 'TAKE PROFIT 2', value: formatPrice(result.tp2), mono: true, color: '#00ff9d' },
            ...(result.tp3 ? [{ label: 'TAKE PROFIT 3', value: formatPrice(result.tp3), mono: true, color: '#00ff9d' }] : []),
          ].map(({ label, value, mono, color }) => (
            <div key={label} className="flex justify-between items-start gap-2">
              <span className="text-text-secondary font-mono text-xs uppercase shrink-0">{label}</span>
              <span className={`${mono ? 'font-mono' : 'font-body'} text-sm text-right`} style={color ? { color } : {}}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            { label: 'RISK / REWARD', value: `1 : ${result.riskReward.toFixed(2)}`, color: '#00e5ff' },
            { label: 'PROBABILITY', value: `${result.probability}%` },
            { label: 'HOLDING TIME', value: result.holdingTime.toUpperCase() },
            { label: 'INVALIDATION', value: formatPrice(result.invalidation), color: '#ff2d55' },
            { label: 'MTF SCORE', value: result.phase5.mtfConfluenceScore.toFixed(3) },
            { label: 'VERDICT', value: result.finalVerdict, color: result.finalVerdict === 'EXECUTE' ? '#00ff9d' : '#ffe600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-start gap-2">
              <span className="text-text-secondary font-mono text-xs uppercase shrink-0">{label}</span>
              <span className="font-mono text-sm text-right" style={color ? { color } : {}}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <div className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-3">Why This Trade</div>
        <div className="space-y-2">
          {[
            { label: 'MACRO', value: result.whyThisTrade.macro },
            { label: 'ON-CHAIN', value: result.whyThisTrade.onChain },
            { label: 'HTF TECH', value: result.whyThisTrade.htfTech },
            { label: 'LTF TECH', value: result.whyThisTrade.ltfTech },
            { label: 'SENTIMENT', value: result.whyThisTrade.sentiment },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="text-text-secondary font-mono text-xs uppercase w-20 shrink-0 pt-0.5">{label}:</span>
              <span className="text-text-primary font-body leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {result.cancellationConditions.length > 0 && (
        <div className="border-t border-border/50 pt-4">
          <div className="font-heading text-xs text-warning uppercase tracking-wider mb-3">What Cancels This Trade</div>
          <ul className="space-y-1.5">
            {result.cancellationConditions.map((cond, i) => (
              <li key={i} className="flex gap-2 text-xs font-body text-text-primary">
                <span className="text-warning shrink-0">·</span><span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-border/50 pt-4">
        <div className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-3">Phase Alignment</div>
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: 'Macro', bias: result.phase1.macroBias },
            { label: 'On-Chain', bias: result.phase2.fundamentalBias },
            { label: 'HTF', bias: result.phase3.htfBias },
            { label: 'LTF', bias: result.phase4.ltfBias },
            { label: 'MTF', bias: `${result.phase5.mtfConfluenceScore.toFixed(2)}` },
          ].map(({ label, bias }) => (
            <div key={label} className={`rounded-lg p-2 text-center border ${
              bias.includes('bullish') ? 'bg-bullish/5 border-bullish/20' :
              bias.includes('bearish') ? 'bg-bearish/5 border-bearish/20' : 'bg-white/5 border-border'
            }`}>
              <BiasIcon bias={bias} />
              <div className="text-text-secondary font-mono text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50 pt-3">
        <div className="font-heading text-xs text-ai uppercase tracking-wider mb-1">Best Trade Now</div>
        <p className="text-text-primary font-body text-sm">{result.bestTradeNow}</p>
      </div>
    </div>
  );
}
