import { useMarketStore } from '../../store/useMarketStore';
import { formatPercent, getFearGreedColor } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp className="w-3 h-3 text-bearish" />;
  if (trend === 'falling') return <TrendingDown className="w-3 h-3 text-bullish" />;
  return <Minus className="w-3 h-3 text-info" />;
}

export function MacroContextBar() {
  const { macroData } = useMarketStore();

  if (!macroData) {
    return (
      <div className="h-10 bg-surface border-b border-border flex items-center px-4 gap-6 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-20 bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  const fgColor = getFearGreedColor(macroData.fearGreedIndex);

  return (
    <div className="h-10 bg-surface border-b border-border flex items-center px-4 gap-4 overflow-x-auto whitespace-nowrap text-xs font-mono shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">DXY</span>
        <span className="text-text-primary font-semibold">{macroData.dxy.toFixed(2)}</span>
        <TrendIcon trend={macroData.dxyTrend} />
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">BTC.D</span>
        <span className="text-info font-semibold">{macroData.btcDominance.toFixed(1)}%</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">MCAP</span>
        <span className="text-text-primary font-semibold">
          ${(macroData.totalMarketCap / 1e12).toFixed(2)}T
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">F&G</span>
        <span style={{ color: fgColor }} className="font-semibold">
          {macroData.fearGreedIndex} · {macroData.fearGreedLabel}
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">RATES</span>
        <span className={`font-semibold capitalize ${
          macroData.interestRateExpectation === 'dovish' ? 'text-bullish' :
          macroData.interestRateExpectation === 'hawkish' ? 'text-bearish' : 'text-info'
        }`}>{macroData.interestRateExpectation}</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">NARRATIVE</span>
        <span className="text-ai font-semibold">{macroData.dominantNarrative}</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-text-secondary">LIQUIDITY</span>
        <span className={`font-semibold capitalize ${
          macroData.globalLiquidityTrend === 'expanding' ? 'text-bullish' :
          macroData.globalLiquidityTrend === 'contracting' ? 'text-bearish' : 'text-info'
        }`}>{macroData.globalLiquidityTrend}</span>
      </div>
    </div>
  );
}
