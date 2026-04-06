import { AlertTriangle, Lock, Info } from 'lucide-react';
import { useOnChainData } from '../../hooks/useOnChainData';

interface TokenomicsAlertProps {
  symbol: string;
}

export function TokenomicsAlert({ symbol }: TokenomicsAlertProps) {
  const { data, isLoading } = useOnChainData(symbol);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  if (!data?.tokenUnlockWarning) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-text-secondary font-body text-xs uppercase tracking-wider">Token Unlock Risk</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Info className="w-3.5 h-3.5 text-bullish" />
          <span className="font-mono text-xs text-bullish">No unlock events within 30 days</span>
        </div>
      </div>
    );
  }

  const { date, amountUSD, percentOfCirculating } = data.tokenUnlockWarning;
  const isCritical = percentOfCirculating >= 5;

  return (
    <div className={`rounded-xl p-4 border ${isCritical ? 'bg-bearish/10 border-bearish/40' : 'bg-warning/10 border-warning/40'}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-bearish' : 'text-warning'}`} />
        <span className={`font-heading text-xs uppercase tracking-wider font-bold ${isCritical ? 'text-bearish' : 'text-warning'}`}>
          Token Unlock Warning
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-text-secondary">Unlock Date</span>
          <span className="font-mono text-xs font-bold text-text-primary">{date}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-text-secondary">Amount (USD)</span>
          <span className={`font-mono text-xs font-bold ${isCritical ? 'text-bearish' : 'text-warning'}`}>
            ${amountUSD >= 1000 ? `${(amountUSD / 1000).toFixed(1)}B` : `${amountUSD.toFixed(0)}M`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-text-secondary">% of Circulating</span>
          <span className={`font-mono text-xs font-bold ${isCritical ? 'text-bearish' : 'text-warning'}`}>
            {percentOfCirculating.toFixed(2)}%
          </span>
        </div>
        <div className={`mt-2 pt-2 border-t ${isCritical ? 'border-bearish/20' : 'border-warning/20'}`}>
          <span className={`font-mono text-xs ${isCritical ? 'text-bearish' : 'text-warning'}`}>
            {isCritical
              ? '⚠ Critical: AI confidence -15pts. Large unlock may suppress price.'
              : '⚠ Moderate: Monitor post-unlock selling pressure.'}
          </span>
        </div>
      </div>
    </div>
  );
}
