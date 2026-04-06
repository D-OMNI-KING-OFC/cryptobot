import { useMarketOverview } from '../hooks/useMarketData';
import { MacroContextBar } from '../components/dashboard/MacroContextBar';
import { MarketOverview } from '../components/dashboard/MarketOverview';
import { FearGreedMeter } from '../components/dashboard/FearGreedMeter';
import { BTCDominanceCard } from '../components/dashboard/BTCDominanceCard';
import { useMarketStore } from '../store/useMarketStore';
import { formatPrice, formatPercent } from '../utils/formatters';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

function AssetCard({ symbol }: { symbol: string }) {
  const { assets } = useMarketStore();
  const asset = assets.find(a => a.symbol === symbol);
  if (!asset) return null;
  const isUp = asset.priceChange24h >= 0;
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-heading text-sm text-text-primary">{asset.symbol.split('/')[0]}</span>
        <span className={`flex items-center gap-1 font-mono text-xs ${isUp ? 'text-bullish' : 'text-bearish'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(asset.priceChange24h)}
        </span>
      </div>
      <div className="font-mono text-xl font-bold text-text-primary">{formatPrice(asset.price)}</div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs font-mono text-text-secondary">
        <div>Vol: {(asset.volume24h / 1e9).toFixed(1)}B</div>
        {asset.fundingRate !== undefined && (
          <div className={asset.fundingRate > 0 ? 'text-bullish' : 'text-bearish'}>
            FR: {(asset.fundingRate * 100).toFixed(4)}%
          </div>
        )}
      </div>
    </div>
  );
}

function NewsNLPFeed() {
  const { macroData } = useMarketStore();
  const headlines = macroData?.recentNewsHeadlines || [];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">News Feed</div>
      <div className="space-y-2">
        {headlines.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded shrink-0 ${
              item.sentiment === 'bullish' ? 'bg-bullish/10 text-bullish border border-bullish/20' :
              item.sentiment === 'bearish' ? 'bg-bearish/10 text-bearish border border-bearish/20' :
              'bg-info/10 text-info border border-info/20'
            }`}>
              {item.sentiment.toUpperCase()}
            </span>
            <span className="text-text-primary font-body">{item.title}</span>
          </div>
        ))}
        {headlines.length === 0 && (
          <div className="text-text-secondary font-mono text-xs animate-pulse">Loading news...</div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { assetsQuery, macroQuery } = useMarketOverview();
  const { lastUpdated } = useMarketStore();

  return (
    <div className="flex flex-col h-full">
      <MacroContextBar />
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-lg text-text-primary uppercase tracking-wider">Command Center</h1>
          <div className="flex items-center gap-2 text-text-secondary font-mono text-xs">
            <RefreshCw className={`w-3 h-3 ${assetsQuery.isFetching ? 'animate-spin text-accent' : ''}`} />
            {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading...'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AssetCard symbol="BTC/USDT" />
          <AssetCard symbol="ETH/USDT" />
          <AssetCard symbol="SOL/USDT" />
          <AssetCard symbol="BNB/USDT" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MarketOverview />
          </div>
          <div className="space-y-4">
            <FearGreedMeter />
            <BTCDominanceCard />
          </div>
        </div>

        <NewsNLPFeed />
      </div>
    </div>
  );
}
