import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../../store/useMarketStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { formatPrice, formatPercent, formatLargeNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MarketOverview() {
  const { assets, isLoading } = useMarketStore();
  const { setCurrentPair } = useAnalysisStore();
  const navigate = useNavigate();

  const handleAssetClick = (symbol: string) => {
    setCurrentPair(symbol);
    navigate('/analyze');
  };

  if (isLoading && assets.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">Market Overview</div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">
        Market Overview — Top Assets
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-text-secondary border-b border-border">
              <th className="text-left pb-2 pr-3">#</th>
              <th className="text-left pb-2 pr-3">Asset</th>
              <th className="text-right pb-2 pr-3">Price</th>
              <th className="text-right pb-2 pr-3">24h %</th>
              <th className="text-right pb-2 pr-3 hidden md:table-cell">Volume</th>
              <th className="text-right pb-2 pr-3 hidden lg:table-cell">Market Cap</th>
              <th className="text-left pb-2 hidden xl:table-cell">Tags</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr
                key={asset.symbol}
                className="border-b border-border/50 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => handleAssetClick(asset.symbol)}
              >
                <td className="py-2 pr-3 text-text-secondary">{idx + 1}</td>
                <td className="py-2 pr-3">
                  <div className="font-bold text-text-primary">{asset.symbol.split('/')[0]}</div>
                  <div className="text-text-secondary text-xs">{asset.name}</div>
                </td>
                <td className="py-2 pr-3 text-right text-text-primary">{formatPrice(asset.price)}</td>
                <td className="py-2 pr-3 text-right">
                  <span className={`flex items-center justify-end gap-0.5 ${asset.priceChange24h >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    {asset.priceChange24h >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {formatPercent(asset.priceChange24h)}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right text-text-secondary hidden md:table-cell">{formatLargeNumber(asset.volume24h)}</td>
                <td className="py-2 pr-3 text-right text-text-secondary hidden lg:table-cell">{formatLargeNumber(asset.marketCap)}</td>
                <td className="py-2 hidden xl:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {(asset.narrativeTags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-ai/10 text-ai text-xs rounded border border-ai/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
