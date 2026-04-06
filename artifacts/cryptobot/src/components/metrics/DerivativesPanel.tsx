import { useFundingRate, useOpenInterest } from '../../hooks/useMarketData';
import { formatFundingRate, formatLargeNumber } from '../../utils/formatters';
import { AlertTriangle } from 'lucide-react';

interface DerivativesPanelProps {
  pair: string;
}

export function DerivativesPanel({ pair }: DerivativesPanelProps) {
  const { data: fundingRate } = useFundingRate(pair);
  const { data: oiData } = useOpenInterest(pair);

  const fr = fundingRate ?? 0;
  const isOverheated = fundingRate != null && Math.abs(fundingRate) > 0.001;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">Derivatives</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary font-mono text-xs">Funding Rate</span>
          <div className="flex items-center gap-1">
            {fundingRate == null && <AlertTriangle className="w-3 h-3 text-error" />}
            {isOverheated && <AlertTriangle className="w-3 h-3 text-warning" />}
            <span className={`font-mono text-xs font-bold ${fr > 0 ? 'text-bullish' : fr < 0 ? 'text-bearish' : 'text-info'}`}>
              {fundingRate == null ? 'N/A' : formatFundingRate(fr)}
            </span>
          </div>
        </div>
        {oiData ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-mono text-xs">Open Interest</span>
              <span className="font-mono text-xs text-text-primary">{oiData.oi == null ? 'N/A' : formatLargeNumber(oiData.oi)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-mono text-xs">OI 24h Change</span>
              <span className={`font-mono text-xs font-bold ${oiData.change24h >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {oiData.change24h >= 0 ? '+' : ''}{oiData.change24h.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-mono text-xs">Open Interest</span>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-error" />
              <span className="font-mono text-xs text-error">Data Unavailable</span>
            </div>
          </div>
        )}
        {isOverheated && (
          <div className="mt-1 p-2 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="text-warning font-mono text-xs">⚠ Funding overheated — crowded trade risk</div>
          </div>
        )}
        {fundingRate == null && (
          <div className="mt-1 p-2 bg-error/10 border border-error/30 rounded-lg">
            <div className="text-error font-mono text-xs">⚠ Funding rate data unavailable — analysis may be unreliable</div>
          </div>
        )}
      </div>
    </div>
  );
}
