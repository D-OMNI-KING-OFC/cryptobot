import type { OptionsIntelligence, SupplyDistribution, HodlWaves, NetworkHealthScore } from '../utils/advancedAnalytics';

const DERIBIT_BASE = 'https://www.deribit.com/api/v2/public';

// ─── DERIBIT OPTIONS API ───────────────────────────────

export async function fetchOptionsData(symbol: string): Promise<{ openInterest: any[]; ticker: any; instrument: string } | any[]> {
  try {
    // Get BTC options data
    const instrumentName = symbol === 'BTC' ? 'BTC-PERPETUAL' : 'ETH-PERPETUAL';

    // Get open interest for options
    const oiResponse = await fetch(`${DERIBIT_BASE}/get_book_summary_by_instrument?instrument_name=${instrumentName}`);
    if (!oiResponse.ok) throw new Error(`Deribit OI error: ${oiResponse.status}`);

    const oiData = await oiResponse.json();

    // Get ticker data for volatility
    const tickerResponse = await fetch(`${DERIBIT_BASE}/ticker?instrument_name=${instrumentName}`);
    if (!tickerResponse.ok) throw new Error(`Deribit ticker error: ${tickerResponse.status}`);

    const tickerData = await tickerResponse.json();

    return {
      openInterest: oiData.result || [],
      ticker: tickerData.result || {},
      instrument: instrumentName
    };
  } catch (error) {
    console.warn('Deribit options fetch failed:', error);
    return [];
  }
}

export async function analyzeOptionsIntelligence(symbol: string): Promise<OptionsIntelligence> {
  try {
    const optionsData = await fetchOptionsData(symbol);

    // Check if we got valid data structure
    if (!optionsData || typeof optionsData !== 'object' || Array.isArray(optionsData) ||
        !optionsData.openInterest || !Array.isArray(optionsData.openInterest) || optionsData.openInterest.length === 0) {
      return {
        putCallRatio: 1,
        impliedVolatility: 0,
        volatilitySkew: 0,
        openInterestByStrike: {},
        gammaExposure: 0,
        deltaHedgingFlow: 'neutral',
        maxPain: 0
      };
    }

    // Now we know optionsData is the object type
    const data = optionsData as { openInterest: any[]; ticker: any; instrument: string };

    // Analyze perpetual futures data as proxy for options sentiment
    const ticker = data.ticker || {};
    const markPrice = ticker.mark_price || ticker.last_price || 0;
    const bidIv = ticker.bid_iv || 0;
    const askIv = ticker.ask_iv || 0;

    // Use futures IV as proxy for options IV
    const impliedVolatility = (bidIv + askIv) / 2;

    // Gamma exposure proxy (simplified)
    const gammaExposure = ticker.gamma || 0;

    // Delta hedging flow based on price action
    let deltaHedgingFlow: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (ticker.delta && ticker.delta > 0.1) {
      deltaHedgingFlow = 'bullish';
    } else if (ticker.delta && ticker.delta < -0.1) {
      deltaHedgingFlow = 'bearish';
    }

    return {
      putCallRatio: 1, // Would need actual options data
      impliedVolatility,
      volatilitySkew: 0,
      openInterestByStrike: {},
      gammaExposure,
      deltaHedgingFlow,
      maxPain: markPrice
    };
  } catch (error) {
    console.warn('Options intelligence analysis failed:', error);
    return {
      putCallRatio: 1,
      impliedVolatility: 0,
      volatilitySkew: 0,
      openInterestByStrike: {},
      gammaExposure: 0,
      deltaHedgingFlow: 'neutral',
      maxPain: 0
    };
  }
}

// ─── ENHANCED ON-CHAIN METRICS ───────────────────────────────

export async function fetchSupplyDistribution(symbol: string): Promise<SupplyDistribution> {
  try {
    const slug = getSlug(symbol);

    // Use Sanbase GraphQL for supply distribution
    const query = `{
      supplyDistribution: getMetric(metric: "supply_distribution") {
        timeseriesData(slug: "${slug}", from: "utc_now-1d", to: "utc_now-1d", interval: "1d") {
          datetime value
        }
      }
    }`;

    const response = await fetch('/api/sanbase/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error(`Supply distribution error: ${response.status}`);

    const data = await response.json();

    // Parse the distribution data (this would need actual implementation based on Sanbase response)
    const distribution = data?.data?.supplyDistribution?.timeseriesData?.[0]?.value || {};

    return {
      top10: distribution.top10Percent || 0,
      top100: distribution.top100Percent || 0,
      top1000: distribution.top1000Percent || 0,
      top10k: distribution.top10kPercent || 0
    };
  } catch (error) {
    console.warn('Supply distribution fetch failed:', error);
    return { top10: 0, top100: 0, top1000: 0, top10k: 0 };
  }
}

export async function fetchHodlWaves(symbol: string): Promise<HodlWaves> {
  try {
    const slug = getSlug(symbol);

    const query = `{
      hodlWaves: getMetric(metric: "hodl_waves") {
        timeseriesData(slug: "${slug}", from: "utc_now-1d", to: "utc_now-1d", interval: "1d") {
          datetime value
        }
      }
    }`;

    const response = await fetch('/api/sanbase/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error(`HODL waves error: ${response.status}`);

    const data = await response.json();
    const waves = data?.data?.hodlWaves?.timeseriesData?.[0]?.value || {};

    return {
      hodl_1d_to_1w: waves['1d-1w'] || 0,
      hodl_1w_to_1m: waves['1w-1m'] || 0,
      hodl_1m_to_3m: waves['1m-3m'] || 0,
      hodl_3m_to_6m: waves['3m-6m'] || 0,
      hodl_6m_to_1y: waves['6m-1y'] || 0,
      hodl_1y_to_2y: waves['1y-2y'] || 0,
      hodl_2y_plus: waves['2y+'] || 0
    };
  } catch (error) {
    console.warn('HODL waves fetch failed:', error);
    return {
      hodl_1d_to_1w: 0, hodl_1w_to_1m: 0, hodl_1m_to_3m: 0,
      hodl_3m_to_6m: 0, hodl_6m_to_1y: 0, hodl_1y_to_2y: 0, hodl_2y_plus: 0
    };
  }
}

export async function fetchNetworkHealthMetrics(symbol: string): Promise<NetworkHealthScore> {
  try {
    const slug = getSlug(symbol);

    // Fetch multiple network health metrics
    const query = `{
      githubActivity: getMetric(metric: "github_activity") {
        timeseriesData(slug: "${slug}", from: "utc_now-30d", to: "utc_now-1d", interval: "1d") {
          datetime value
        }
      }
      dailyActiveUsers: getMetric(metric: "daily_active_addresses") {
        timeseriesData(slug: "${slug}", from: "utc_now-30d", to: "utc_now-1d", interval: "1d") {
          datetime value
        }
      }
      transactionVolume: getMetric(metric: "transaction_volume") {
        timeseriesData(slug: "${slug}", from: "utc_now-30d", to: "utc_now-1d", interval: "1d") {
          datetime value
        }
      }
    }`;

    const response = await fetch('/api/sanbase/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error(`Network health error: ${response.status}`);

    const data = await response.json();

    const githubData = data?.data?.githubActivity?.timeseriesData || [];
    const dauData = data?.data?.dailyActiveUsers?.timeseriesData || [];
    const volumeData = data?.data?.transactionVolume?.timeseriesData || [];

    // Calculate metrics
    const githubActivity = githubData.length > 0 ? githubData.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / githubData.length : 0;
    const avgDAU = dauData.length > 0 ? dauData.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / dauData.length : 0;
    const avgVolume = volumeData.length > 0 ? volumeData.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / volumeData.length : 0;

    return {
      developerActivity: Math.min(100, githubActivity * 10),
      securityIncidents: 100, // Placeholder - would need security incident data
      upgradeReadiness: 80, // Placeholder - would need upgrade tracking
      decentralization: 70, // Placeholder - would need node/stake data
      adoption: Math.min(100, Math.log10((avgDAU + 1) * (avgVolume + 1)) * 5),
      overall: 0 // Will be calculated in the analytics function
    };
  } catch (error) {
    console.warn('Network health fetch failed:', error);
    return {
      developerActivity: 0,
      securityIncidents: 100,
      upgradeReadiness: 0,
      decentralization: 0,
      adoption: 0,
      overall: 0
    };
  }
}

// ─── ORDER BOOK ANALYSIS ───────────────────────────────

export async function fetchOrderBook(symbol: string): Promise<{ bids: number[][]; asks: number[][] }> {
  try {
    const pair = symbol + 'USDT';
    const response = await fetch(`/api/binance/depth?symbol=${pair}&limit=100`);
    if (!response.ok) throw new Error(`Order book error: ${response.status}`);

    const data = await response.json();

    return {
      bids: (data.bids || []).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
      asks: (data.asks || []).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
    };
  } catch (error) {
    console.warn('Order book fetch failed:', error);
    return { bids: [], asks: [] };
  }
}

// ─── UTILITY FUNCTIONS ───────────────────────────────

function getSlug(symbol: string): string {
  const slugMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'bnb',
    'XRP': 'xrp',
    'ADA': 'cardano',
    'AVAX': 'avalanche',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'NEAR': 'near',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'TRX': 'tron',
    'TON': 'toncoin',
    'ICP': 'internet-computer'
  };

  return slugMap[symbol] || symbol.toLowerCase();
}