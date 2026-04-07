const express = require('express');
const router = express.Router();

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

function buildCoingeckoHeaders() {
  const key = process.env.VITE_COINGECKO_API_KEY;
  return key ? { 'x-cg-demo-api-key': key } : {};
}

async function proxyCoingecko(req, res) {
  const coingeckoPath = req.path.replace(/^\/coingecko/, '') || '';
  const query = req.originalUrl.split('?')[1];
  const url = `${COINGECKO_BASE}${coingeckoPath}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        ...buildCoingeckoHeaders(),
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      console.error('Coingecko proxy failed:', response.status, bodyText);
      return res.status(response.status).json({ error: 'Coingecko proxy failed', body: bodyText });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json(JSON.parse(bodyText));
    }

    return res.send(bodyText);
  } catch (error) {
    console.error('Coingecko proxy error:', error?.message || error);
    return res.status(502).json({ error: 'Coingecko proxy failed' });
  }
}

router.get('/coingecko/*', proxyCoingecko);
router.get('/coingecko', proxyCoingecko);

router.get('/fear-greed', async (req, res) => {
  const base = process.env.VITE_ALTERNATIVE_ME_ENDPOINT || 'https://api.alternative.me/fng/';
  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}limit=1`;

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error('Fear & Greed proxy failed:', response.status, bodyText);
      return res.status(response.status).json({ error: 'Fear & Greed proxy failed', body: bodyText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Fear & Greed proxy error:', error?.message || error);
    return res.status(502).json({ error: 'Fear & Greed proxy failed' });
  }
});

module.exports = router;
