import { useMarketStore } from '../../store/useMarketStore';
import { formatLargeNumber } from '../../utils/formatters';

export function BTCDominanceCard() {
  const { macroData } = useMarketStore();

  const btcD = macroData?.btcDominance || 52.3;
  const totalMC = macroData?.totalMarketCap || 2.5e12;
  const total2MC = macroData?.total2MarketCap || 1.2e12;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">Market Structure</div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-text-secondary font-mono text-xs">BTC Dominance</span>
            <span className="text-info font-mono text-sm font-bold">{btcD.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-warning rounded-full transition-all duration-700" style={{ width: `${btcD}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-text-secondary font-mono text-xs">Total MC</div>
            <div className="text-text-primary font-mono text-sm font-bold">{formatLargeNumber(totalMC)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-text-secondary font-mono text-xs">Alts MC</div>
            <div className="text-text-primary font-mono text-sm font-bold">{formatLargeNumber(total2MC)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
