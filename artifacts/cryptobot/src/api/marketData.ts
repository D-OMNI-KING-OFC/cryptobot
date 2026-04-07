import type { OHLCVCandle, MarketAsset } from '../types/market.types';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'BNB': 'binancecoin',
  'XRP': 'ripple', 'ADA': 'cardano', 'AVAX': 'avalanche-2', 'DOT': 'polkadot',
  'LINK': 'chainlink', 'MATIC': 'matic-network', 'UNI': 'uniswap', 'ATOM': 'cosmos',
  'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'NEAR': 'near', 'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu', 'TRX': 'tron', 'TON': 'the-open-network', 'ICP': 'internet-computer'
};

const BINANCE_TF_MAP: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w'
};

function geckoHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_COINGECKO_API_KEY;
  return key ? { 'x-cg-demo-api-key': key } : {};
}

async function fetchWithRetry(url: string, headers: Record<string, string> = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function fetchOHLCV(pair: string, timeframe: string, limit = 100): Promise<OHLCVCandle[]> {
  const symbol = pair.replace('/', '');
  const interval = BINANCE_TF_MAP[timeframe] || '1h';
  const url = `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetchWithRetry(url);
  const data = await res.json();

  if (!Array.isArray(data)) return [];

  return data.map((k: unknown[]) => ({
    timestamp: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
    timeframe: timeframe as OHLCVCandle['timeframe'],
  }));
}

export async function fetchFundingRate(pair: string): Promise<number | null> {
  try {
    const symbol = pair.replace('/', '');
    const res = await fetchWithRetry(`/api/binance/funding/${symbol}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const rate = data[0].fundingRate;
      // Proxy returns null when Binance is geo-blocked — propagate null, not NaN
      if (rate === null || rate === undefined) return null;
      const parsed = parseFloat(rate);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchOpenInterest(pair: string): Promise<{ oi: number | null; change24h: number }> {
  try {
    const symbol = pair.replace('/', '');
    const res = await fetchWithRetry(`/api/binance/oi/${symbol}`);
    const data = await res.json();

    // data.openInterest is null when the server-side fetch failed (geo-block etc.)
    // parseFloat(null) = NaN, parseFloat('0') = 0 — both treated as unavailable
    const raw = data.openInterest;
    if (raw === null || raw === undefined) return { oi: null, change24h: 0 };

    const oiVal = parseFloat(raw);
    // A legitimate OI value for any tradeable perpetual is at minimum several million dollars.
    // If we get exactly 0 or NaN it means the API returned an empty/failed response.
    if (isNaN(oiVal) || oiVal === 0) return { oi: null, change24h: 0 };

    return { oi: oiVal, change24h: 0 };
  } catch {
    return { oi: null, change24h: 0 };
  }
}

export async function fetchTop20Assets(): Promise<MarketAsset[]> {
  try {
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetchWithRetry(url, geckoHeaders());
    const data = await res.json();

    return data.map((coin: {
      symbol: string;
      name: string;
      current_price: number;
      price_change_percentage_24h: number;
      total_volume: number;
      market_cap: number;
    }) => ({
      symbol: coin.symbol.toUpperCase() + '/USDT',
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      fundingRate: 0,
      openInterest: 0,
      onChainSignal: 'neutral' as const,
      narrativeTags: getNarrativeTags(coin.symbol.toUpperCase()),
    }));
  } catch {
    return getMockAssets();
  }
}

function getNarrativeTags(symbol: string): string[] {
  const tags: Record<string, string[]> = {
    'BTC': ['Store of Value', 'L1'], 'ETH': ['L1', 'DeFi', 'Smart Contract'],
    'SOL': ['L1', 'DeFi', 'NFT'], 'BNB': ['L1', 'CeFi'],
    'XRP': ['Payments', 'RWA'], 'ADA': ['L1', 'Smart Contract'],
    'AVAX': ['L1', 'DeFi'], 'DOT': ['L0', 'Interoperability'],
    'LINK': ['Oracle', 'DeFi'], 'MATIC': ['L2', 'Scaling'],
    'UNI': ['DeFi', 'DEX'], 'ATOM': ['L0', 'Interoperability'],
    'NEAR': ['L1', 'AI'], 'DOGE': ['Meme'], 'SHIB': ['Meme'],
    'TRX': ['L1', 'Payments'], 'TON': ['L1', 'Messaging'], 'ICP': ['L1', 'Web3'],
  };
  return tags[symbol] || ['Altcoin'];
}

function getMockAssets(): MarketAsset[] {
  return [
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: 85000, priceChange24h: 2.1, volume24h: 28e9, marketCap: 1.6e12, fundingRate: 0.01, openInterest: 18e9, onChainSignal: 'bullish', narrativeTags: ['Store of Value', 'L1'] },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: 1900, priceChange24h: 1.5, volume24h: 12e9, marketCap: 220e9, fundingRate: 0.008, openInterest: 8e9, onChainSignal: 'neutral', narrativeTags: ['L1', 'DeFi'] },
    { symbol: 'SOL/USDT', name: 'Solana', price: 130, priceChange24h: 3.2, volume24h: 3e9, marketCap: 60e9, fundingRate: 0.012, openInterest: 2e9, onChainSignal: 'bullish', narrativeTags: ['L1', 'NFT'] },
    { symbol: 'BNB/USDT', name: 'BNB', price: 590, priceChange24h: 0.8, volume24h: 1.5e9, marketCap: 85e9, fundingRate: 0.005, openInterest: 1e9, onChainSignal: 'neutral', narrativeTags: ['L1', 'CeFi'] },
    { symbol: 'XRP/USDT', name: 'XRP', price: 2.10, priceChange24h: -1.2, volume24h: 4e9, marketCap: 120e9, fundingRate: -0.003, openInterest: 1.5e9, onChainSignal: 'bearish', narrativeTags: ['Payments', 'RWA'] },
  ];
}

export async function fetchSingleAssetPrice(pair: string): Promise<{ price: number; change24h: number; volume24h: number }> {
  try {
    const symbol = pair.split('/')[0];
    const geckoId = COINGECKO_IDS[symbol] || symbol.toLowerCase();
    const url = `${COINGECKO_BASE}/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
    const res = await fetchWithRetry(url, geckoHeaders());
    const data = await res.json();
    const coinData = data[geckoId];
    if (coinData) {
      return { price: coinData.usd, change24h: coinData.usd_24h_change || 0, volume24h: coinData.usd_24h_vol || 0 };
    }
  } catch {}
  return { price: 0, change24h: 0, volume24h: 0 };
}
