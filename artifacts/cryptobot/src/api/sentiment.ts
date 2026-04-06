import type { MacroSentimentData, NewsItem } from '../types/market.types';
import { fetchDXY, fetchInterestRateExpectation } from './macro';

function geckoHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_COINGECKO_API_KEY;
  return key ? { 'x-cg-demo-api-key': key } : {};
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function fetchFearGreedIndex(): Promise<{ value: number; label: string }> {
  const base = import.meta.env.VITE_ALTERNATIVE_ME_ENDPOINT || 'https://api.alternative.me/fng/';
  const res = await fetchWithRetry(`${base}?limit=1`);
  const data = await res.json();
  if (data.data && data.data[0]) {
    return {
      value: parseInt(data.data[0].value, 10),
      label: data.data[0].value_classification,
    };
  }
  throw new Error('Invalid Fear & Greed response');
}

export async function fetchGlobalMarketData(): Promise<{
  btcDominance: number;
  totalMarketCap: number;
  total2MarketCap: number;
  total3MarketCap: number;
  dominantNarrative: string;
}> {
  const res = await fetchWithRetry('https://api.coingecko.com/api/v3/global', { headers: geckoHeaders() });
  const data = await res.json();
  const global = data.data;
  const totalMC = global.total_market_cap?.usd || 0;
  const btcPct = global.market_cap_percentage?.btc || 0;
  const ethPct = global.market_cap_percentage?.eth || 0;
  const total2MC = totalMC * (1 - btcPct / 100);
  const total3MC = totalMC * (1 - (btcPct + ethPct) / 100);

  let dominantNarrative = 'Bitcoin / Store of Value';
  if (btcPct < 45) dominantNarrative = 'Altcoin Season / DeFi';
  else if (btcPct > 60) dominantNarrative = 'Bitcoin Dominance / Risk-Off';

  return {
    btcDominance: parseFloat(btcPct.toFixed(2)),
    totalMarketCap: totalMC,
    total2MarketCap: total2MC,
    total3MarketCap: total3MC,
    dominantNarrative,
  };
}

/**
 * Fetch social sentiment from Sanbase (primary + only source).
 */
async function fetchSanbaseSentiment(symbol: string): Promise<{ socialSentimentScore: number; socialVolume24h: number | null }> {
  const res = await fetch(`/api/sanbase/sentiment/${symbol.toUpperCase()}`);
  if (!res.ok) throw new Error(`Sanbase sentiment error: ${res.status}`);
  const data = await res.json();
  if (data.source === 'sanbase_unavailable') {
    return { socialSentimentScore: 0, socialVolume24h: 0 };
  }
  return {
    socialSentimentScore: data.socialSentimentScore ?? 0,
    socialVolume24h: data.socialVolume24h && data.socialVolume24h > 0 ? data.socialVolume24h : null,
  };
}

async function fetchCryptoNews(_symbol: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/news`);
  if (!res.ok) throw new Error(`News API error: ${res.status}`);
  const data = await res.json();
  if (data.headlines && Array.isArray(data.headlines)) {
    return data.headlines.map((h: {
      title: string;
      sentiment: string;
      source: string;
      timestamp: string;
    }) => ({
      title: h.title,
      sentiment: h.sentiment as 'bullish' | 'bearish' | 'neutral',
      source: h.source,
      timestamp: h.timestamp,
    }));
  }
  return [];
}

const NARRATIVE_TAGS: Record<string, string[]> = {
  'BTC': ['Store of Value', 'Digital Gold', 'Institutional', 'L1'],
  'ETH': ['DeFi', 'Smart Contract', 'Layer 1', 'Staking'],
  'SOL': ['Layer 1', 'DeFi', 'NFT', 'Memecoin', 'High-Speed'],
  'BNB': ['CeFi', 'Layer 1', 'Exchange Token'],
  'XRP': ['Payments', 'RWA', 'Enterprise', 'Cross-Border'],
  'ADA': ['Layer 1', 'Smart Contract', 'Academic'],
  'AVAX': ['Layer 1', 'DeFi', 'Subnet'],
  'DOT': ['Layer 0', 'Interoperability', 'Parachain'],
  'LINK': ['Oracle', 'DeFi', 'Infrastructure'],
  'MATIC': ['Layer 2', 'Scaling', 'Polygon'],
  'UNI': ['DeFi', 'DEX', 'Governance'],
  'ATOM': ['Layer 0', 'Interoperability', 'IBC'],
  'NEAR': ['Layer 1', 'AI', 'Sharding'],
  'DOGE': ['Meme', 'Payments', 'Community'],
  'SHIB': ['Meme', 'DeFi'],
  'TRX': ['Layer 1', 'Payments', 'Stablecoin'],
  'TON': ['Layer 1', 'Messaging', 'Telegram'],
  'ICP': ['Layer 1', 'Web3', 'Decentralized Cloud'],
  'LTC': ['Payments', 'Silver', 'PoW'],
  'BCH': ['Payments', 'P2P Cash', 'PoW'],
};

export async function fetchMacroSentiment(assetSymbol: string = 'BTC'): Promise<MacroSentimentData> {
  const [fearGreed, globalData, social, news, dxyData, rateData] = await Promise.allSettled([
    fetchFearGreedIndex(),
    fetchGlobalMarketData(),
    fetchSanbaseSentiment(assetSymbol),
    fetchCryptoNews(assetSymbol),
    fetchDXY(),
    fetchInterestRateExpectation(),
  ]);

  // Fear & Greed: public API — log if fails but don't block
  const fg = fearGreed.status === 'fulfilled'
    ? fearGreed.value
    : (() => { console.warn('Fear & Greed fetch failed:', (fearGreed as PromiseRejectedResult).reason?.message); return { value: 50, label: 'Neutral' }; })();

  // Global market data: CoinGecko public API
  const gd = globalData.status === 'fulfilled'
    ? globalData.value
    : (() => { console.warn('CoinGecko global fetch failed:', (globalData as PromiseRejectedResult).reason?.message); return { btcDominance: 0, totalMarketCap: 0, total2MarketCap: 0, total3MarketCap: 0, dominantNarrative: 'Unknown' }; })();

  // Social sentiment: Sanbase
  const sc = social.status === 'fulfilled'
    ? social.value
    : (() => { console.warn('Sanbase sentiment fetch failed:', (social as PromiseRejectedResult).reason?.message); return { socialSentimentScore: 0, socialVolume24h: null }; })();

  // News: multi-source (CoinTelegraph + Decrypt + CoinDesk)
  const newsItems = news.status === 'fulfilled'
    ? news.value
    : (() => { console.warn('News fetch failed:', (news as PromiseRejectedResult).reason?.message); return [] as NewsItem[]; })();

  // DXY: GRACEFUL degradation — null means unavailable, not a fatal error.
  // The analysis will receive null DXY and Claude will note the data gap.
  const dxy = dxyData.status === 'fulfilled'
    ? dxyData.value
    : (() => { console.warn('DXY fetch failed:', (dxyData as PromiseRejectedResult).reason?.message); return { value: null as number | null, trend: 'neutral' as const }; })();

  // Interest rate: FRED proxy — neutral fallback on failure
  const rateExpectation = rateData.status === 'fulfilled'
    ? rateData.value
    : (() => { console.warn('Interest rate fetch failed:', (rateData as PromiseRejectedResult).reason?.message); return 'neutral' as const; })();

  let globalLiquidityTrend: 'expanding' | 'contracting' | 'neutral' = 'neutral';
  if (dxy.trend === 'falling' && rateExpectation === 'dovish') {
    globalLiquidityTrend = 'expanding';
  } else if (dxy.trend === 'rising' && rateExpectation === 'hawkish') {
    globalLiquidityTrend = 'contracting';
  }

  return {
    fearGreedIndex: fg.value,
    fearGreedLabel: fg.label,
    btcDominance: gd.btcDominance,
    totalMarketCap: gd.totalMarketCap,
    total2MarketCap: gd.total2MarketCap,
    dxy: dxy.value as number,  // null is valid here; handled in payload builder
    dxyTrend: dxy.trend,
    interestRateExpectation: rateExpectation,
    globalLiquidityTrend,
    socialVolume: sc.socialVolume24h,
    socialSentimentScore: sc.socialSentimentScore,
    recentNewsHeadlines: newsItems,
    dominantNarrative: gd.dominantNarrative,
    assetNarrativeTags: NARRATIVE_TAGS[assetSymbol] || ['Altcoin'],
  };
}
