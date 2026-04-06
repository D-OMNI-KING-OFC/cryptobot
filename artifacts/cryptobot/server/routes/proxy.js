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

// GET /api/dxy — DXY with multiple fallback sources:
//  1. FRED (if key available)
//  2. Frankfurter FX rates → computed DXY proxy
//  3. Returns null value if all fail
router.get('/dxy', async (req, res) => {
  // Try FRED first if API key is available
  const fredKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (fredKey) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&api_key=${fredKey}&file_type=json&limit=5&sort_order=desc`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const data = await r.json();
        const obs = (data.observations || []).filter(o => o.value !== '.');
        if (obs.length >= 2) {
          const latest = parseFloat(obs[0].value);
          const prev = parseFloat(obs[1].value);
          if (!isNaN(latest) && latest > 70 && latest < 115) {
            const trend = latest > prev * 1.001 ? 'rising' : latest < prev * 0.999 ? 'falling' : 'neutral';
            return res.json({ value: parseFloat(latest.toFixed(2)), trend, source: 'fred' });
          }
        }
      }
    } catch (e) {
      console.warn('FRED DXY failed:', e.message);
    }
  }

  // Fallback: Frankfurter FX API (no key required) → compute DXY proxy
  // DXY formula weights: EUR -57.6%, JPY +13.6%, GBP -11.9%, CAD -9.1%, SEK -4.2%, CHF -3.6%
  // Frankfurter returns: 1 USD = X units of each currency
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,JPY,GBP,CAD,SEK,CHF', {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' },
    });
    if (r.ok) {
      const data = await r.json();
      const rates = data.rates;
      if (rates && rates.EUR && rates.JPY && rates.GBP && rates.CAD && rates.SEK && rates.CHF) {
        // EURUSD = 1/rates.EUR, GBPUSD = 1/rates.GBP (they're USD-per-foreign)
        const EURUSD = 1 / rates.EUR;
        const USDJPY = rates.JPY;
        const GBPUSD = 1 / rates.GBP;
        const USDCAD = rates.CAD;
        const USDSEK = rates.SEK;
        const USDCHF = rates.CHF;

        // DXY = 50.14348112 × EURUSD^(-0.576) × USDJPY^(0.136) × GBPUSD^(-0.119) × USDCAD^(-0.091) × USDSEK^(-0.042) × USDCHF^(-0.036)
        const dxy = 50.14348112
          * Math.pow(EURUSD, -0.576)
          * Math.pow(USDJPY, 0.136)
          * Math.pow(GBPUSD, -0.119)
          * Math.pow(USDCAD, -0.091)
          * Math.pow(USDSEK, -0.042)
          * Math.pow(USDCHF, -0.036);

        const dxyValue = parseFloat(dxy.toFixed(2));

        // Validate result is in realistic range
        if (dxyValue > 70 && dxyValue < 115) {
          // Get yesterday's rates for trend
          try {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const r2 = await fetch(`https://api.frankfurter.app/${yesterday}?from=USD&to=EUR,JPY,GBP,CAD,SEK,CHF`, {
              signal: AbortSignal.timeout(5000),
            });
            if (r2.ok) {
              const prev = await r2.json();
              if (prev.rates) {
                const prevEURUSD = 1 / prev.rates.EUR;
                const prevUSJPY = prev.rates.JPY;
                const prevGBPUSD = 1 / prev.rates.GBP;
                const prevUSDCAD = prev.rates.CAD;
                const prevUSESEK = prev.rates.SEK;
                const prevUSDCHF = prev.rates.CHF;
                const prevDXY = 50.14348112
                  * Math.pow(prevEURUSD, -0.576)
                  * Math.pow(prevUSJPY, 0.136)
                  * Math.pow(prevGBPUSD, -0.119)
                  * Math.pow(prevUSDCAD, -0.091)
                  * Math.pow(prevUSESEK, -0.042)
                  * Math.pow(prevUSDCHF, -0.036);
                const trend = dxyValue > prevDXY * 1.001 ? 'rising' : dxyValue < prevDXY * 0.999 ? 'falling' : 'neutral';
                return res.json({ value: dxyValue, trend, source: 'frankfurter_computed' });
              }
            }
          } catch {}
          return res.json({ value: dxyValue, trend: 'neutral', source: 'frankfurter_computed' });
        }
      }
    }
  } catch (e) {
    console.warn('Frankfurter DXY fallback failed:', e.message);
  }

  // All sources failed
  res.json({ value: null, trend: 'neutral', source: 'unavailable' });
});

// GET /api/etf/flows — BTC Spot ETF net flows from Farside Investors (free, no key)
// Returns: { btcFlows: { daily: number|null, weekly: number|null }, ethFlows: { daily: number|null }, source: string }
router.get('/etf/flows', async (req, res) => {
  try {
    // Farside Investors provides BTC ETF flow data in CSV format
    const r = await fetch('https://farside.co.uk/bitcoin-etf-flow-all-data.csv', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoBot/2.0)',
        'Accept': 'text/csv, text/plain, */*',
        'Referer': 'https://farside.co.uk/',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!r.ok) throw new Error(`Farside HTTP ${r.status}`);
    const csv = await r.text();
    const lines = csv.trim().split('\n').filter(l => l.trim());

    if (lines.length < 3) throw new Error('Insufficient CSV data');

    // Parse last 7 data rows for weekly total
    const dataLines = lines.slice(1); // skip header

    let dailyFlow = null;
    let weeklyFlow = 0;
    let validDays = 0;

    // Parse from end (most recent first)
    for (let i = dataLines.length - 1; i >= Math.max(0, dataLines.length - 7); i--) {
      const cols = dataLines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
      // Last column is typically the total; find total column
      // Format: Date, GBTC, FBTC, BITB, ARKB, BTCO, HODL, BRRR, BTCW, IBIT, EZBC, TOTAL
      const totalCol = cols[cols.length - 1];
      const val = parseFloat(totalCol);
      if (!isNaN(val)) {
        if (dailyFlow === null) dailyFlow = val; // Most recent day
        weeklyFlow += val;
        validDays++;
      }
    }

    if (validDays === 0) throw new Error('No valid flow data parsed');

    res.json({
      btcFlows: {
        daily: dailyFlow,
        weekly: parseFloat(weeklyFlow.toFixed(2)),
        source: 'farside',
        note: 'USD millions',
      },
    });
  } catch (err) {
    console.warn('ETF flow fetch failed:', err.message);
    // Try CoinGecko as fallback (limited ETF data)
    res.json({ btcFlows: null, source: 'unavailable', error: err.message });
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

// GET /api/binance/funding/:symbol — Funding rate
// Returns null fundingRate when data unavailable (NOT a fake neutral value)
router.get('/binance/funding/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    const url = `${BINANCE_FAPI}/fundingRate?symbol=${symbol}&limit=1`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (r.ok && Array.isArray(data) && data.length > 0 && data[0].fundingRate !== undefined) {
      return res.json(data);
    }
    throw new Error('No funding data from Binance');
  } catch {
    // Binance fapi is geo-blocked in many regions.
    // Return null to signal data unavailability — do NOT return a fake neutral rate.
    // The analysis layer will apply a -10 confidence penalty for missing derivatives data.
    res.status(200).json([{ fundingRate: null, fundingTime: Date.now(), symbol }]);
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
    // Return null to indicate unavailability instead of fake balanced ratio
    res.status(200).json([{ longShortRatio: null, longAccount: null, shortAccount: null }]);
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

// GET /api/binance/klines/proxy — Proxy Binance spot klines (for correlation engine)
// Used by the correlation engine to avoid direct browser→Binance calls (geo-blocked)
router.get('/binance/spot/klines', async (req, res) => {
  const { symbol, interval = '1d', limit = 30 } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  // Route through Kraken for geo-block bypass
  const krakenPair = KRAKEN_PAIR_MAP[symbol.toUpperCase()];
  const krakenInterval = KRAKEN_INTERVAL_MAP[interval.toLowerCase()];

  if (!krakenPair || !krakenInterval) {
    return res.status(200).json([]);
  }

  try {
    const url = `${KRAKEN_BASE}/OHLC?pair=${krakenPair}&interval=${krakenInterval}&count=${limit}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`Kraken HTTP ${r.status}`);
    const json = await r.json();
    if (json.error?.length > 0) throw new Error(json.error.join(', '));
    const pairs = json.result;
    const pairKey = Object.keys(pairs).find(k => k !== 'last');
    if (!pairKey) return res.status(200).json([]);
    const candles = pairs[pairKey].map(k => [k[0] * 1000, k[1], k[2], k[3], k[4], k[6]]);
    res.json(candles);
  } catch (err) {
    console.warn('Spot klines proxy error:', err.message);
    res.status(200).json([]);
  }
});

// GET /api/news — Multi-source crypto news aggregator
// Sources: CoinTelegraph RSS, Decrypt RSS, CoinDesk RSS (in order of preference)
router.get('/news', async (req, res) => {
  const sources = [
    { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph' },
    { url: 'https://decrypt.co/feed', name: 'Decrypt' },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
  ];

  const allHeadlines = [];

  await Promise.allSettled(sources.map(async ({ url, name }) => {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 CryptoBot/2.0', 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`${name} RSS HTTP ${r.status}`);
      const xml = await r.text();

      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
      const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

      let m;
      let count = 0;
      while ((m = itemRegex.exec(xml)) !== null && count < 5) {
        const t = titleRegex.exec(m[1]);
        const d = pubDateRegex.exec(m[1]);
        const title = (t?.[1] || t?.[2] || '').trim();
        if (!title) continue;
        allHeadlines.push({
          title,
          source: name,
          timestamp: new Date(d?.[1] || Date.now()).toISOString(),
          sentiment: classifyNewsSentiment(title),
        });
        count++;
      }
    } catch (err) {
      console.warn(`${name} RSS failed:`, err.message);
    }
  }));

  // Sort by timestamp (most recent first) and deduplicate by title similarity
  const seen = new Set();
  const deduplicated = allHeadlines
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter(h => {
      const key = h.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  res.json({ headlines: deduplicated });
});

function classifyNewsSentiment(title) {
  const t = (title || '').toLowerCase();
  const bull = ['surge', 'rally', 'gain', 'bull', 'pump', 'high', 'rise', 'inflow', 'adoption', 'etf', 'approve', 'breakout', 'recover', 'growth', 'increase', 'ath', 'record', 'institutional', 'accumul'];
  const bear = ['crash', 'drop', 'bear', 'dump', 'sell', 'low', 'fall', 'outflow', 'hack', 'ban', 'fine', 'fear', 'risk', 'loss', 'decline', 'sink', 'plunge', 'warning', 'attack', 'exploit', 'scam', 'fraud'];
  const b = bull.filter(w => t.includes(w)).length;
  const s = bear.filter(w => t.includes(w)).length;
  return b > s ? 'bullish' : s > b ? 'bearish' : 'neutral';
}

module.exports = router;
