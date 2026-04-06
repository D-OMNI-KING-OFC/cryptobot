import type { AnalysisOutput } from '../../types/signal.types';
import { AlertCircle, Clock } from 'lucide-react';

export function NoTradeCard({ result }: { result: AnalysisOutput }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
      <div className="border-t border-b border-border/50 py-4 mb-6 text-center">
        <div className="font-heading text-xl text-text-secondary uppercase tracking-widest mb-1">{result.pair}</div>
        <div className="text-text-secondary font-mono text-xs mb-4">{result.timestamp}</div>
        <div className="flex items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-warning" />
          <span className="font-heading text-3xl text-warning tracking-widest">⊘ NO TRADE</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
          <div className="font-heading text-xs text-warning uppercase tracking-wider mb-3">Why No Trade</div>
          <p className="font-body text-text-primary text-sm leading-relaxed">
            {result.noTradeReason || result.phase5.alignmentCheck}
          </p>
          {result.phase5.contradictions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.phase5.contradictions.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-warning/80 font-mono">
                  <span>·</span><span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {result.noTradeWaitFor && result.noTradeWaitFor.length > 0 && (
          <div className="bg-info/5 border border-info/20 rounded-lg p-4">
            <div className="font-heading text-xs text-info uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" /> What to Wait For
            </div>
            <ul className="space-y-1.5">
              {result.noTradeWaitFor.map((condition, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-primary font-body">
                  <span className="text-info shrink-0">→</span><span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-5 gap-1 mt-4">
          {[
            { label: 'Phase 1 · Macro', bias: result.phase1.macroBias },
            { label: 'Phase 2 · On-Chain', bias: result.phase2.fundamentalBias },
            { label: 'Phase 3 · HTF', bias: result.phase3.htfBias },
            { label: 'Phase 4 · LTF', bias: result.phase4.ltfBias },
            { label: 'Phase 5 · MTF', bias: `Score: ${result.phase5.mtfConfluenceScore.toFixed(2)}` },
          ].map(({ label, bias }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-text-secondary font-mono text-xs mb-1">{label}</div>
              <div className={`font-mono text-xs font-bold capitalize ${
                bias.includes('bullish') ? 'text-bullish' :
                bias.includes('bearish') ? 'text-bearish' : 'text-info'
              }`}>{bias.replace('_', '\n')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
