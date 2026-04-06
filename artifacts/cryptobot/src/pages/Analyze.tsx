import { useAnalysisStore } from '../store/useAnalysisStore';
import { AnalysisTrigger } from '../components/analysis/AnalysisTrigger';
import { PhaseProgressTracker } from '../components/analysis/PhaseProgressTracker';
import { SignalReport } from '../components/analysis/SignalReport';
import { PriceChart } from '../components/charts/PriceChart';
import { OIFundingChart } from '../components/charts/OIFundingChart';
import { OnChainPanel } from '../components/metrics/OnChainPanel';
import { DerivativesPanel } from '../components/metrics/DerivativesPanel';
import { TokenomicsAlert } from '../components/metrics/TokenomicsAlert';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import type { SignalRecord } from '../types/signal.types';

function saveSignalToHistory(result: import('../types/signal.types').AnalysisOutput | null) {
  if (!result) return;
  const record: SignalRecord = {
    id: Date.now().toString(),
    timestamp: result.timestamp,
    pair: result.pair,
    signal: result,
    outcome: 'open',
  };
  const existing = JSON.parse(localStorage.getItem('cryptobot-history') || '[]');
  const updated = [record, ...existing].slice(0, 100);
  localStorage.setItem('cryptobot-history', JSON.stringify(updated));
}

export function Analyze() {
  const { currentPair, isAnalyzing, result, error, phase } = useAnalysisStore();
  const symbol = currentPair.split('/')[0];

  useEffect(() => {
    if (phase === 'complete' && result) {
      saveSignalToHistory(result);
    }
  }, [phase, result]);

  return (
    <div className="flex flex-col h-full">
      <AnalysisTrigger />
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 space-y-4">
            <PriceChart pair={currentPair} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OIFundingChart pair={currentPair} />
              <TokenomicsAlert symbol={symbol} />
            </div>

            {isAnalyzing && <PhaseProgressTracker />}

            {error && (
              <div className="bg-bearish/10 border border-bearish/30 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-bearish shrink-0 mt-0.5" />
                <div>
                  <div className="font-heading text-bearish text-sm uppercase tracking-wide mb-1">Analysis Error</div>
                  <div className="font-body text-text-primary text-sm">{error}</div>
                </div>
              </div>
            )}

            {!isAnalyzing && result && phase === 'complete' && (
              <SignalReport result={result} />
            )}

            {!isAnalyzing && !result && !error && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-5xl mb-4">⚡</div>
                <div className="font-heading text-lg mb-2">Ready for Analysis</div>
                <p className="font-body text-sm">Select a pair and click "Run Analysis" to begin the 5-phase AI assessment.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <DerivativesPanel pair={currentPair} />
            <OnChainPanel symbol={symbol} />
          </div>
        </div>
      </div>
    </div>
  );
}
