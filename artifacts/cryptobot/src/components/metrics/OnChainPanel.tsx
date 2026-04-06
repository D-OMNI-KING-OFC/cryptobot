import { useQuery } from '@tanstack/react-query';
import { fetchOnChainMetrics } from '../../api/onChain';
import { formatLargeNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OnChainPanelProps {
  symbol: string;
}

export function OnChainPanel({ symbol }: OnChainPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['on-chain', symbol],
    queryFn: () => fetchOnChainMetrics(symbol),
    staleTime: 300000,
  });

  if (isLoading || !data) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">On-Chain Metrics</div>
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-white/5 rounded" />)}
        </div>
      </div>
    );
  }

  const soprValue = data.sopr != null ? data.sopr : null;
  const metrics = [
    { label: 'Exchange Net Flow', value: `${data.exchangeNetFlow > 0 ? '+' : ''}${data.exchangeNetFlow.toLocaleString()}`, status: data.exchangeNetFlow < 0 ? 'bullish' : 'bearish' },
    { label: 'Exchange Reserves', value: formatLargeNumber(data.exchangeReserves), status: data.exchangeReservesTrend === 'falling' ? 'bullish' : data.exchangeReservesTrend === 'rising' ? 'bearish' : 'neutral' },
    { label: 'MVRV Ratio', value: data.mvrv.toFixed(2), status: data.mvrv < 1 ? 'bullish' : data.mvrv > 3.5 ? 'bearish' : 'neutral' },
    { label: 'SOPR', value: soprValue != null ? soprValue.toFixed(3) : 'N/A', status: soprValue == null ? 'neutral' : soprValue > 1 ? 'bullish' : 'bearish' },
    { label: 'Whale Behavior', value: data.whaleBehavior, status: data.whaleBehavior === 'accumulating' ? 'bullish' : data.whaleBehavior === 'distributing' ? 'bearish' : 'neutral' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">On-Chain Metrics</div>
      <div className="space-y-2">
        {metrics.map(({ label, value, status }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-text-secondary font-mono text-xs">{label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-xs font-bold capitalize ${
                status === 'bullish' ? 'text-bullish' :
                status === 'bearish' ? 'text-bearish' : 'text-info'
              }`}>{value}</span>
              {status === 'bullish' ? <TrendingUp className="w-2.5 h-2.5 text-bullish" /> :
               status === 'bearish' ? <TrendingDown className="w-2.5 h-2.5 text-bearish" /> :
               <Minus className="w-2.5 h-2.5 text-info" />}
            </div>
          </div>
        ))}
        {data.etfNetFlow24h !== undefined && (
          <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-2">
            <span className="text-text-secondary font-mono text-xs">ETF Flow 24h</span>
            <span className={`font-mono text-xs font-bold ${data.etfNetFlow24h >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              ${data.etfNetFlow24h > 0 ? '+' : ''}{data.etfNetFlow24h}M
            </span>
          </div>
        )}
        {data.tokenUnlockWarning && (
          <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="text-warning font-mono text-xs font-bold">⚠ TOKEN UNLOCK</div>
            <div className="text-text-secondary font-mono text-xs">{data.tokenUnlockWarning.date} · {data.tokenUnlockWarning.percentOfCirculating.toFixed(1)}% supply</div>
          </div>
        )}
      </div>
    </div>
  );
}
