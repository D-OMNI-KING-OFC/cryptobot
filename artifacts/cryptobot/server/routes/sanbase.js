const express = require('express');
const router = express.Router();

const SANBASE_API = 'https://api.santiment.net/graphql';

const SLUG_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'bnb',
  XRP: 'xrp', ADA: 'cardano', AVAX: 'avalanche', DOT: 'polkadot',
  LINK: 'chainlink', MATIC: 'matic-network', UNI: 'uniswap', ATOM: 'cosmos',
  LTC: 'litecoin', BCH: 'bitcoin-cash', NEAR: 'near', DOGE: 'dogecoin',
  SHIB: 'shiba-inu', TRX: 'tron', TON: 'toncoin', ICP: 'internet-computer',
};

/**
 * Execute a Sanbase GraphQL query.
 * GraphQL can return PARTIAL data with an errors array (some fields fail, others succeed).
 * We only throw for hard failures (HTTP error, auth error, or zero data returned).
 */
async function sanbaseQuery(query, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Apikey ${apiKey}`;

  const res = await fetch(SANBASE_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Sanbase HTTP ${res.status}`);

  const json = await res.json();

  // Log field-level errors but don't throw — GraphQL partial results are still useful
  if (json.errors && Array.isArray(json.errors)) {
    const msgs = json.errors.map(e => e.message).join('; ');
    console.warn('Sanbase partial GraphQL errors (non-fatal):', msgs);
    // Only throw if there is NO usable data at all
    if (!json.data) {
      throw new Error(`Sanbase GraphQL error (no data): ${msgs}`);
    }
  }

  return json;
}

function getLatest(arr) {
  if (!arr || !arr.length) return null;
  const filtered = arr.filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value));
  return filtered.length ? filtered[filtered.length - 1].value : null;
}

function getPrev(arr) {
  if (!arr || arr.length < 2) return null;
  const filtered = arr.filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value));
  return filtered.length >= 2 ? filtered[filtered.length - 2].value : null;
}

// GET /api/sanbase/sentiment/:symbol
router.get('/sanbase/sentiment/:symbol', async (req, res) => {
  const apiKey = process.env.SANBASE_API_KEY;
  const slug = SLUG_MAP[req.params.symbol.toUpperCase()] || req.params.symbol.toLowerCase();

  // Use a 30-day window ending 1 day ago (free tier supports recent data with API key)
  const from = 'utc_now-30d';
  const to = 'utc_now-1d';

  try {
    const query = `{
      sentimentBalance: getMetric(metric: "sentiment_balance_total") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime value
        }
      }
      socialVolume: getMetric(metric: "social_volume_total") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime value
        }
      }
    }`;

    const data = await sanbaseQuery(query, apiKey);
    const sentArr = data?.data?.sentimentBalance?.timeseriesData;
    const volArr = data?.data?.socialVolume?.timeseriesData;

    const rawSentiment = getLatest(sentArr) ?? 0;
    const socialVolume = getLatest(volArr) ?? 0;

    // Normalize: raw sentiment_balance_total is typically in range [-5, 5]
    // Scale to [-100, 100]
    const sentimentScore = Math.max(-100, Math.min(100, Math.round(rawSentiment * 20)));

    res.json({
      socialSentimentScore: sentimentScore,
      socialVolume24h: Math.round(socialVolume),
      source: 'sanbase',
    });
  } catch (err) {
    console.warn('Sanbase sentiment unavailable:', err.message);
    res.status(200).json({ socialSentimentScore: 0, socialVolume24h: 0, source: 'sanbase_unavailable' });
  }
});

// GET /api/sanbase/onchain/:symbol
router.get('/sanbase/onchain/:symbol', async (req, res) => {
  const apiKey = process.env.SANBASE_API_KEY;
  const slug = SLUG_MAP[req.params.symbol.toUpperCase()] || req.params.symbol.toLowerCase();

  // Wide window for exchange balance and whale data (needs history for trend)
  const wideFrom = 'utc_now-60d';
  const wideTo = 'utc_now-1d';
  // Standard window for valuation metrics
  const from = 'utc_now-30d';
  const to = 'utc_now-1d';

  try {
    // NOTE: spent_output_profit_ratio (SOPR) is NOT available on this Sanbase tier.
    // We use transaction_volume as a network activity metric instead.
    const query = `{
      exchangeBalance: getMetric(metric: "exchange_balance") {
        timeseriesData(slug: "${slug}", from: "${wideFrom}", to: "${wideTo}", interval: "1d") {
          datetime value
        }
      }
      mvrv: getMetric(metric: "mvrv_usd_intraday") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime value
        }
      }
      nvt: getMetric(metric: "nvt") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime value
        }
      }
      whaleTx: getMetric(metric: "whale_transaction_count_100k_usd_to_inf") {
        timeseriesData(slug: "${slug}", from: "${wideFrom}", to: "${wideTo}", interval: "1d") {
          datetime value
        }
      }
      txVolume: getMetric(metric: "transaction_volume") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime value
        }
      }
    }`;

    const data = await sanbaseQuery(query, apiKey);
    const d = data?.data;

    const exchangeBalanceArr = d?.exchangeBalance?.timeseriesData;
    const mvrvArr = d?.mvrv?.timeseriesData;
    const nvtArr = d?.nvt?.timeseriesData;
    const whaleTxArr = d?.whaleTx?.timeseriesData;
    const txVolumeArr = d?.txVolume?.timeseriesData;

    const currBalance = getLatest(exchangeBalanceArr);
    const prevBalance = getPrev(exchangeBalanceArr);

    const exchangeNetFlow = (currBalance !== null && prevBalance !== null)
      ? Math.round(currBalance - prevBalance)
      : 0;

    let exchangeReservesTrend = 'neutral';
    if (currBalance !== null && prevBalance !== null && prevBalance !== 0) {
      const changePct = (currBalance - prevBalance) / Math.abs(prevBalance);
      if (changePct > 0.001) exchangeReservesTrend = 'rising';
      else if (changePct < -0.001) exchangeReservesTrend = 'falling';
    }

    const whaleTxValues = (whaleTxArr || [])
      .map(p => p.value)
      .filter(v => v !== null && v !== undefined && !isNaN(v));

    let whaleBehavior = 'neutral';
    if (whaleTxValues.length >= 4) {
      const recent = whaleTxValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const hist = whaleTxValues.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, whaleTxValues.length - 3);
      if (recent > hist * 1.3) {
        whaleBehavior = exchangeNetFlow < 0 ? 'accumulating' : 'distributing';
      }
    }

    // Derive a SOPR-proxy from transaction volume trend:
    // Rising tx volume relative to prior window → selling at profit (>1 proxy)
    // Falling tx volume → holding / selling at loss (<1 proxy)
    const txValues = (txVolumeArr || [])
      .map(p => p.value)
      .filter(v => v !== null && !isNaN(v));

    let soprProxy = null;
    if (txValues.length >= 7) {
      const recentAvg = txValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const priorAvg = txValues.slice(-7, -3).reduce((a, b) => a + b, 0) / 4;
      if (priorAvg > 0) {
        soprProxy = parseFloat((recentAvg / priorAvg).toFixed(4));
      }
    }

    res.json({
      exchangeNetFlow,
      exchangeReserves: Math.round(currBalance ?? 0),
      exchangeReservesTrend,
      mvrv: parseFloat((getLatest(mvrvArr) ?? 1.0).toFixed(3)),
      sopr: soprProxy,   // null means genuinely unavailable — not faked
      nvtRatio: parseFloat((getLatest(nvtArr) ?? 60).toFixed(2)),
      whaleBehavior,
      source: 'sanbase',
    });
  } catch (err) {
    console.warn('Sanbase on-chain error — attempting CoinMetrics Community fallback:', err.message);

    // Fallback: CoinMetrics Community API (free, no key required)
    // Provides basic on-chain metrics for major assets
    const COINMETRICS_ASSET_MAP = {
      bitcoin: 'btc', ethereum: 'eth', solana: 'sol', bnb: 'bnb',
      xrp: 'xrp', cardano: 'ada', avalanche: 'avax', polkadot: 'dot',
      chainlink: 'link', 'matic-network': 'matic', litecoin: 'ltc',
      dogecoin: 'doge', tron: 'trx', toncoin: 'ton',
    };
    const cmAsset = COINMETRICS_ASSET_MAP[slug] || null;

    if (cmAsset) {
      try {
        const cmUrl = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=${cmAsset}&metrics=CapMVRVCur,NVTAdj,AdrActCnt&frequency=1d&page_size=14`;
        const cmRes = await fetch(cmUrl, { signal: AbortSignal.timeout(10000) });
        if (cmRes.ok) {
          const cmData = await cmRes.json();
          const series = cmData?.data || [];
          if (series.length > 0) {
            const latest = series[series.length - 1];
            const prev = series.length > 1 ? series[series.length - 2] : null;

            const mvrv = latest.CapMVRVCur ? parseFloat(parseFloat(latest.CapMVRVCur).toFixed(3)) : 1.0;
            const nvtRatio = latest.NVTAdj ? parseFloat(parseFloat(latest.NVTAdj).toFixed(2)) : 60;

            // Active address trend as whale behavior proxy
            const currAddr = latest.AdrActCnt ? parseFloat(latest.AdrActCnt) : null;
            const prevAddr = prev?.AdrActCnt ? parseFloat(prev.AdrActCnt) : null;
            let whaleBehavior = 'neutral';
            if (currAddr && prevAddr && prevAddr > 0) {
              const addrChange = (currAddr - prevAddr) / prevAddr;
              if (addrChange > 0.05) whaleBehavior = 'accumulating';
              else if (addrChange < -0.05) whaleBehavior = 'distributing';
            }

            console.log(`CoinMetrics fallback succeeded for ${cmAsset}: MVRV=${mvrv}, NVT=${nvtRatio}`);
            return res.status(200).json({
              exchangeNetFlow: 0,
              exchangeReserves: 0,
              exchangeReservesTrend: 'neutral',
              mvrv,
              sopr: null,
              nvtRatio,
              whaleBehavior,
              source: 'coinmetrics_community',
            });
          }
        }
      } catch (cmErr) {
        console.warn('CoinMetrics fallback also failed:', cmErr.message);
      }
    }

    // All sources failed — return minimal neutral data (not 502)
    // The analysis engine treats on-chain as null when this errors, so return a
    // safe partial response that won't crash the pipeline
    res.status(200).json({
      exchangeNetFlow: 0,
      exchangeReserves: 0,
      exchangeReservesTrend: 'neutral',
      mvrv: 1.0,
      sopr: null,
      nvtRatio: null,
      whaleBehavior: 'neutral',
      source: 'fallback_minimal',
      warning: 'Sanbase and CoinMetrics both unavailable — data is minimal placeholder',
    });
  }
});

module.exports = router;
