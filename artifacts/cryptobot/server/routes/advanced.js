const express = require('express');
const router = express.Router();

// ─── DERIBIT OPTIONS API ───────────────────────────────

const DERIBIT_BASE = 'https://www.deribit.com/api/v2/public';

router.get('/deribit/options/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
    // Get BTC or ETH options data
    const baseCurrency = symbol.toUpperCase();
    const instrumentName = baseCurrency === 'BTC' ? 'BTC-PERPETUAL' : 'ETH-PERPETUAL';

    // Get open interest summary
    const oiResponse = await fetch(`${DERIBIT_BASE}/get_book_summary_by_instrument?instrument_name=${instrumentName}`);
    if (!oiResponse.ok) throw new Error(`Deribit OI error: ${oiResponse.status}`);

    const oiData = await oiResponse.json();

    // Get ticker data
    const tickerResponse = await fetch(`${DERIBIT_BASE}/ticker?instrument_name=${instrumentName}`);
    if (!tickerResponse.ok) throw new Error(`Deribit ticker error: ${tickerResponse.status}`);

    const tickerData = await tickerResponse.json();

    res.json({
      openInterest: oiData.result || [],
      ticker: tickerData.result || {},
      instrument: instrumentName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deribit options error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── ENHANCED SANBASE GRAPHQL ───────────────────────────────

const SANBASE_API = 'https://api.santiment.net/graphql';

router.post('/sanbase/graphql', async (req, res) => {
  const { query } = req.body;
  const apiKey = process.env.SANBASE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Apikey ${apiKey}`;

    const response = await fetch(SANBASE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`Sanbase HTTP ${response.status}`);

    const json = await response.json();

    // Log partial errors but don't fail
    if (json.errors && Array.isArray(json.errors)) {
      const msgs = json.errors.map(e => e.message).join('; ');
      console.warn('Sanbase GraphQL partial errors:', msgs);
    }

    res.json(json);
  } catch (error) {
    console.error('Sanbase GraphQL error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── BINANCE ORDER BOOK ───────────────────────────────

const BINANCE_BASE = 'https://api.binance.com/api/v3';

router.get('/binance/depth', async (req, res) => {
  const { symbol, limit = 100 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const response = await fetch(`${BINANCE_BASE}/depth?symbol=${symbol}&limit=${limit}`);
    if (!response.ok) throw new Error(`Binance depth error: ${response.status}`);

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Binance order book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── FRED ENHANCED MACRO DATA ───────────────────────────────

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

router.get('/fred/:series', async (req, res) => {
  const { series } = req.params;
  const { limit = 30 } = req.query;
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'FRED API key not configured' });
  }

  try {
    const url = `${FRED_BASE}?series_id=${series}&api_key=${apiKey}&file_type=json&limit=${limit}&sort_order=desc`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`FRED error: ${response.status}`);

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('FRED API error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;