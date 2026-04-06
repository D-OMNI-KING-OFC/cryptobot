const express = require('express');
const router = express.Router();

const KRAKEN_BASE = 'https://api.kraken.com/0/public';
const BINANCE_FAPI = 'https://fapi.binance.com/fapi/v1';
const BINANCE_FUTURES_DATA = 'https://fapi.binance.com/futures/data';

// Kraken pair name map (Binance USDT symbol → Kraken USD pair)
const KRAKEN_PAIR_MAP = {
  BTCUSDT:  'XXBTZUSD', ETHUSDT:  'XETHZUSD', SOLUSDT:  'SOLUSD',
  BNBUSDT:  'BNBUSD', XRPUSDT:  'XXRPZUSD', ADAUSDT:  'ADAUSD',
  AVAXUSDT: 'AVAXUSD', DOTUSDT: 'DOTUSD', LINKUSDT: 'LINKUSD',
  MATICUSDT:'MATICUSD',UNIUSDT:  'UNIUSD', ATOMUSDT: 'ATOMUSD',
  NEARUSDT: 'NEARUSD', DOGEUSDT: 'XDGUSD', LTCUSDT: 'XLTCZUSD',
  BCHUSDT:  'BCHUSD', TRXUSDT: 'TRXUSD', TONUSDT: 'TONUSD',
  ICPUSDT:  'ICPUSD', SHIBUSDT: 'SHIBUSD',
};

// Kraken interval map (Binance interval string → Kraken minutes)
const KRAKEN_INTERVAL_MAP = {
  '1m': 1, '3m': 3, '5m': 5, '15m': 15, '30m': 30,
  '1h': 60, '2h': 120, '4h': 240, '6h': 360, '8h': 480,
  '12h': 720, '1d': 1440, '3d': 4320, '1w': 10080,
};

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/fred/:seriesId
router.get('/fred/:seriesId', async (req, res) => {
  // Support both FRED_API_KEY (server secret) and VITE_FRED_API_KEY (shared env var)
  const apiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FRED_API_KEY not configured' });
  const { seriesId } = req.params;
  const limit = req.query.limit || 10;
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=${limit}&sort_order=desc`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`FRED HTTP ${r.status}`);
    res.json(await r.json());
  } catch (err) {
    console.error('FRED proxy error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/binance/klines — OHLCV via Kraken (Binance geo-blocked)
// ?symbol=BTCUSDT&interval=1h&limit=200
router.get('/binance/klines', async (req, res) => {
  const { symbol, interval, limit = 200 } = req.query;
  if (!symbol || !interval) return res.status(400).json({ error: 'symbol and interval required' });

  const krakenPair = KRAKEN_PAIR_MAP[symbol.toUpperCase()];
  const krakenInterval = KRAKEN_INTERVAL_MAP[interval.toLowerCase()];

  if (!krakenPair || !krakenInterval) {
    console.warn(`Kraken: no mapping for symbol=${symbol} interval=${interval}`);
    return res.status(200).json([]);
  }

  const url = `${KRAKEN_BASE}/OHLC?pair=${krakenPair}&interval=${krakenInterval}&count=${limit}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(`Kraken OHLC HTTP ${r.status}`);
    const json = await r.json();

    if (json.error && json.error.length > 0) {
      throw new Error(`Kraken error: ${json.error.join(', ')}`);
    }

    const pairs = json.result;
    const pairKey = Object.keys(pairs).find(k => k !== 'last');
    if (!pairKey) return res.status(200).json([]);

    // Kraken format: [time, open, high, low, close, vwap, volume, count]
    // Binance format: [openTime, open, high, low, close, volume, ...]
    const candles = pairs[pairKey].map(k => [
      k[0] * 1000,  // timestamp in ms
      String(k[1]), // open
      String(k[2]), // high
      String(k[3]), // low
      String(k[4]), // close
      String(k[6]), // volume (index 6 = volume in Kraken)
    ]);

    res.json(candles);
  } catch (err) {
    console.error('Kraken OHLC proxy error:', err.message);
    res.status(200).json([]);
  }
});

// GET /api/binance/funding/:symbol — Funding rate (Binance fapi — may be geo-blocked)
router.get('/binance/funding/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `${BINANCE_FAPI}/fundingRate?symbol=${symbol}&limit=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
    throw new Error('No funding data');
  } catch {
    // Binance fapi often geo-blocked — return neutral fallback
    res.status(200).json([{ fundingRate: '0.0001', fundingTime: Date.now(), symbol }]);
  }
});

// GET /api/binance/fundinghistory/:symbol — Funding rate history
router.get('/binance/fundinghistory/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const limit = req.query.limit || 8;
  try {
    const url = `${BINANCE_FAPI}/fundingRate?symbol=${symbol}&limit=${limit}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) {
      return res.json(data);
    }
    throw new Error('No funding history');
  } catch {
    res.status(200).json([]);
  }
});

// GET /api/binance/oi/:symbol — Open interest
router.get('/binance/oi/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `${BINANCE_FAPI}/openInterest?symbol=${symbol}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && data.openInterest) {
      return res.json(data);
    }
    throw new Error('No OI data');
  } catch {
    // Return null — NOT '0'. Zero triggers a false "data available" path downstream.
    // The analysis layer must treat null OI as unavailable (not as zero dollars).
    res.status(200).json({ openInterest: null, time: Date.now() });
  }
});

// GET /api/binance/lsratio/:symbol — Long/short ratio
router.get('/binance/lsratio/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `${BINANCE_FUTURES_DATA}/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
    throw new Error('No LS data');
  } catch {
    res.status(200).json([{ longShortRatio: '1.0', longAccount: '0.5', shortAccount: '0.5' }]);
  }
});

// GET /api/binance/oihistory/:symbol — OI history (24 x 1h)
router.get('/binance/oihistory/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `${BINANCE_FUTURES_DATA}/openInterestHist?symbol=${symbol}&period=1h&limit=24`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && Array.isArray(data)) {
      return res.json(data);
    }
    throw new Error('No OI history');
  } catch {
    res.status(200).json([]);
  }
});

// GET /api/news — CoinTelegraph RSS proxy
router.get('/news', async (req, res) => {
  try {
    const r = await fetch('https://cointelegraph.com/rss', {
      headers: { 'User-Agent': 'Mozilla/5.0 CryptoBot/1.0', 'Accept': 'application/xml' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`RSS HTTP ${r.status}`);
    const xml = await r.text();

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

    const headlines = [];
    let m;
    while ((m = itemRegex.exec(xml)) !== null && headlines.length < 10) {
      const t = titleRegex.exec(m[1]);
      const d = pubDateRegex.exec(m[1]);
      const title = (t?.[1] || t?.[2] || '').trim();
      if (!title) continue;
      headlines.push({ title, source: 'CoinTelegraph', timestamp: new Date(d?.[1] || Date.now()).toISOString(), sentiment: classifyNewsSentiment(title) });
    }
    res.json({ headlines });
  } catch (err) {
    console.warn('News proxy failed:', err.message);
    res.status(200).json({ headlines: [] });
  }
});

function classifyNewsSentiment(title) {
  const t = (title || '').toLowerCase();
  const bull = ['surge', 'rally', 'gain', 'bull', 'pump', 'high', 'rise', 'inflow', 'adoption', 'etf', 'approve', 'breakout', 'recover', 'growth', 'increase'];
  const bear = ['crash', 'drop', 'bear', 'dump', 'sell', 'low', 'fall', 'outflow', 'hack', 'ban', 'fine', 'fear', 'risk', 'loss', 'decline', 'sink', 'plunge'];
  const b = bull.filter(w => t.includes(w)).length;
  const s = bear.filter(w => t.includes(w)).length;
  return b > s ? 'bullish' : s > b ? 'bearish' : 'neutral';
}

module.exports = router;
