import { useState } from 'react';
import { useAnalysisEngine } from '../../hooks/useAnalysisEngine';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { Zap, ChevronDown } from 'lucide-react';

const PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
  'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT', 'MATIC/USDT',
  'NEAR/USDT', 'DOGE/USDT', 'UNI/USDT', 'ATOM/USDT', 'LTC/USDT',
];

export function AnalysisTrigger() {
  const { currentPair, setCurrentPair, isAnalyzing, resetAnalysis } = useAnalysisStore();
  const { runFullAnalysis } = useAnalysisEngine();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRunAnalysis = async () => {
    resetAnalysis();
    await runFullAnalysis(currentPair);
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-surface border-b border-border">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-lg text-text-primary font-mono text-sm hover:bg-white/10 transition-colors"
        >
          <span>{currentPair}</span>
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[140px] max-h-60 overflow-y-auto">
            {PAIRS.map(pair => (
              <button
                key={pair}
                onClick={() => { setCurrentPair(pair); setShowDropdown(false); }}
                className={`w-full text-left px-4 py-2 font-mono text-sm hover:bg-white/10 transition-colors ${
                  pair === currentPair ? 'text-accent bg-accent/5' : 'text-text-primary'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleRunAnalysis}
        disabled={isAnalyzing}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-heading text-sm uppercase tracking-wider transition-all ${
          isAnalyzing
            ? 'bg-ai/20 border border-ai/30 text-ai cursor-not-allowed animate-pulse-slow'
            : 'bg-ai hover:bg-ai/80 text-background font-bold cursor-pointer'
        }`}
      >
        <Zap className="w-4 h-4" />
        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
      </button>
    </div>
  );
}
