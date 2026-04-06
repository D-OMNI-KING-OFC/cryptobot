import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Check, Loader2, Clock } from 'lucide-react';

const phases = [
  { key: 'phase1', label: 'Macro Context', desc: 'DXY, sentiment, narratives' },
  { key: 'phase2', label: 'On-Chain & Fundamentals', desc: 'Exchange flows, whale activity' },
  { key: 'phase3', label: 'HTF Technical', desc: '1D & 1W structure, key levels' },
  { key: 'phase4', label: 'LTF Technical', desc: '15m, 1H, 4H entry triggers' },
  { key: 'phase5', label: 'Synthesis', desc: 'MTF confluence, confidence scoring' },
];

export function PhaseProgressTracker() {
  const { phaseProgress, isAnalyzing } = useAnalysisStore();

  if (!isAnalyzing && Object.values(phaseProgress).every(s => s === 'pending')) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-ai animate-pulse-slow" />
        <span className="font-heading text-ai text-sm tracking-wide uppercase">Analysis Engine</span>
      </div>
      <div className="space-y-2">
        {phases.map(({ key, label, desc }) => {
          const status = phaseProgress[key];
          return (
            <div key={key} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-500 ${
              status === 'running' ? 'bg-ai/10 border border-ai/30' :
              status === 'complete' ? 'bg-bullish/5 border border-bullish/20' :
              status === 'error' ? 'bg-bearish/10 border border-bearish/30' :
              'bg-white/2 border border-transparent opacity-50'
            }`}>
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {status === 'complete' && <Check className="w-4 h-4 text-bullish" />}
                {status === 'running' && <Loader2 className="w-4 h-4 text-ai animate-spin" />}
                {status === 'pending' && <Clock className="w-4 h-4 text-text-secondary" />}
                {status === 'error' && <span className="text-bearish text-xs">✗</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-body text-sm font-semibold ${
                  status === 'running' ? 'text-ai' :
                  status === 'complete' ? 'text-bullish' :
                  'text-text-secondary'
                }`}>{label}</div>
                <div className="text-text-secondary font-mono text-xs">{desc}</div>
              </div>
              <div className="font-mono text-xs shrink-0">
                {status === 'complete' && <span className="text-bullish">COMPLETE ✓</span>}
                {status === 'running' && <span className="text-ai animate-pulse-slow">RUNNING...</span>}
                {status === 'pending' && <span className="text-text-secondary">PENDING</span>}
                {status === 'error' && <span className="text-bearish">ERROR</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
