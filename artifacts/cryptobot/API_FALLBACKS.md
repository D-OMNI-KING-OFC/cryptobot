# Alternative API Endpoints (Backup Sources)

This document outlines free and open alternative endpoints that can be used as fallbacks when primary API sources fail. These are integrated as graceful degradation mechanisms to ensure data availability for institutional-grade analysis.

## 1. Market Data (OHLCV)

### Primary
- **Binance Public REST API** (U.S. domain: https://api.binance.us)
  - Rate limit: 1200 requests/min
  - No API key required for public endpoints
  - Endpoint: `GET /api/v3/klines?symbol={SYMBOL}&interval={INTERVAL}&limit={LIMIT}`

### Fallback Options

#### CoinGecko (Free Tier)
- **Endpoint**: `https://api.coingecko.com/api/v3/coins/{id}/market_chart`
- **Rate limit**: 10 calls/sec (public API)
- **Pros**: Stable, reliable, no auth needed
- **Cons**: Lower granularity (only daily candles for free tier), limited historical
- **Implementation**: Already integrated in `src/api/marketData.ts`

#### Kraken REST API
- **Endpoint**: `https://api.kraken.com/0/public/OHLC`
- **Rate limit**: 15 requests/sec
- **Pros**: Professional-grade data, good coverage
- **Cons**: Different pair format (requires mapping), less altcoin coverage
- **Note**: Already has pair mapping in `server/routes/proxy.js`

## 2. DXY (U.S. Dollar Index)

### Primary
- **FRED API** (Federal Reserve Economic Data)
  - Endpoint: `https://api.stlouisfed.org/fred/series/DTWEXBGS/observations`
  - Series ID: `DTWEXBGS` (Trade-Weighted U.S. Dollar Index)
  - Rate limit: 120 req/min
  - **CURRENT STATUS**: Configured with validation (range check: 70-115)

### Fallback Options

#### Investing.com (via Unofficial API)
- **Endpoint**: `https://api.investing.com/api/financialdata/{PAIR}`
- **Note**: Reverse-engineered API, not officially supported
- **Risk**: May break without notice

#### Yahoo Finance (via unofficial library)
- **Alternative**: Use `yahoo-finance2` or `yfinance` library
- **Endpoint**: `https://query1.finance.yahoo.com/v10/finance/quoteSummary/DX-Y.NYB`
- **Consideration**: May require additional dependencies

#### DXY from CoinGecko Global Data
- **Endpoint**: `https://api.coingecko.com/api/v3/global`
- **Field**: Can infer macro sentiment from BTC.D and altcoin dominance
- **Limitation**: Not exact DXY,  but useful for relative trend

### Recommended Fallback Strategy
1. **Primary**: FRED API (with validation)
2. **Secondary**: Return `dxy: 0, trend: 'neutral'` and flag in UI as "Data Unavailable"
3. **UI Alert**: Display warning badge on macro context bar when DXY is unavailable

## 3. Sentiment Data (Fear & Greed Index)

### Primary
- **Alternative.me API**
  - Endpoint: `https://api.alternative.me/fng/`
  - Rate limit: Unlimited (public, no key)
  - Format: JSON with `value`, `value_classification`, `timestamp`

### Fallback Options

#### Crypto Fear & Greed (CoinTelegraph Feed)
- **Endpoint**: `https://api.santiment.net/graphql`
- **Query**: `fearAndGreedData` field
- **Requirement**: Sanbase API key
- **Note**: Requires authentication

#### Compute from On-Chain Data
- **Method**: Build Fear & Greed proxy from:
  - Exchange net flow (outflow = greed, inflow = fear)
  - Social volume trends
  - Liquidation ratios
- **Implementation**: Placeholder in sentiment analysis engine

## 4. On-Chain Data (Exchange Flows, Whales, MVRV, etc.)

### Primary
- **Sanbase API** (Santiment)
  - Endpoint: `https://api.santiment.net/graphql`
  - Requires API key
  - Coverage: BTC, ETH, and select altcoins

### Fallback Options

#### Glassnode API
- **Endpoint**: `https://api.glassnode.com/v1/metrics/`
- **Requires**: Free API key
- **Coverage**: Excellent on-chain data
- **Rate limit**: 3 requests/sec (free tier)
- **Metrics available**:
  - `active_addresses` (exchange and total)
  - `exchange_net_position_change`
  - `supply_exchanges`
  - `mvrv_ratio`
  - `sopr`

#### CryptoQuant API
- **Endpoint**: `https://api.cryptoquant.com/v1/onchain/`
- **Requires**: API key
- **Specialization**: Professional on-chain analytics
- **Rate limit**: 10 req/min (free tier)

#### Messari API
- **Endpoint**: `https://data.messari.io/api/v1/assets/{ASSET_KEY}/metrics/`
- **Requires**: API key
- **Coverage**: 200+ assets
- **Data**: MVRV, NVT, exchange flows, token flows

#### Blockchain.com API
- **Endpoint**: `https://blockchain.info/q/`
- **Rate limit**: 1 req/sec per IP
- **Coverage**: BTC-only, good for basic chain data
- **Data**: Address metrics, transaction volumes

### Recommended Implementation
- **Current**: Sanbase is primary (already integrated)
- **Fallback 1**: Return zeroed metrics with "`Unavailable`" flag
- **Fallback 2**: Use Glassnode if Sanbase fails (separate endpoint strategy)
- **Fallback 3**: UI displays error badges with "On-Chain Data Unavailable"

## 5. Sentiment Analysis (Social Volume, Social Sentiment)

### Primary
- **Sanbase API** (Santiment)
  - Field: `socialVolume`, `socialSentimentScore`
  - Coverage: 1000+ crypto assets
  - Integrates: Twitter, Discord, Telegram, Reddit mentions

### Fallback Options

#### LunarCrush (Free Tier Limited)
- **Endpoint**: `https://lunarcrush.com/api/v2`
- **Requires**: API key (paid plans only)
- **Note**: No free tier publicly available

#### CoinTrendz (Social Sentiment)
- **Endpoint**: `https://api.cointrendz.com/`
- **Data**: Sentiment from social media
- **Limitation**: Limited historical data

#### Twitter API (v2 Streaming)
- **Approach**: Build custom sentiment from Twitter mentions
- **Complexity**: Requires NLP/sentiment model (TextBlob, VADER, etc.)
- **Rate limit**: 450k tweets/month (free tier)

#### Reddit API
- **Approach**: Query subreddits (r/cryptocurrency, r/bitcoin, etc.)
- **Tool**: PRAW library (Python) or node-reddit
- **Coverage**: Community sentiment analysis

#### GitHub Trending (For Protocol Activity)
- **Endpoint**: `https://github.com/trending?spoken_language_code=en`
- **Approach**: Count commits/PRs for blockchain projects
- **Data**: Developer activity as proxy for fundamentals

### Recommended Fallback Strategy
- **Current**: Sanbase is integrated
- **Fallback**: Return `socialVolume: null`, `socialSentimentScore: 0`
- **UI Alert**: Flag as "Social Data Unavailable" with -10 confidence penalty
- **Enhancement**: Add custom Reddit sentiment parser if integration needed

## 6. News & Headlines (NLP Classification)

### Primary
- **Cryptopanic API** (via CoinTelegraph feed)
  - Endpoint: `https://cryptopanic.com/api/v1/posts/`
  - Rate limit: 20 req/min
  - NLP: Headlines already tagged (bullish/bearish/neutral)

### Fallback Options

#### Crypto News API
- **Endpoint**: `https://cryptonewsapi.com/news`
- **Requires**: API key (free tier available)
- **Pros**: Good coverage, structured data
- **Cons**: Headlines only, no built-in sentiment

#### CoinTelegraph RSS Feed
- **Endpoint**: `https://cointelegraph.com/feed/`
- **Format**: RSS/XML
- **Approach**: Parse XML and apply NLP (e.g., TextBlob or Hugging Face)

#### NewsAPI + Sentiment Model
- **Endpoint**: `https://newsapi.org/v2/everything?q=bitcoin`
- **Requires**: API key (free tier available)
- **Approach**: Fetch headlines, apply custom NLP sentiment classifier

#### Custom NLP (Hugging Face Transformers)
- **Model**: `distilbert-base-uncased-finetuned-sst-2-english` or `finBERT` for finance
- **Installation**: `npm install @huggingface/inference`
- **Approach**: Classify crypto news sentiment locally

### Recommended Implementation
- **Current**: Cryptopanic is integrated
- **Fallback**: Return empty headlines array `[]` with warning
- **Alternative**: Use HuggingFace transformers for client-side classification if API fails

## 7. Interest Rates & Macro Data

### Primary
- **FRED API** 
  - Series `DFF` (Effective Federal Funds Rate)
  - Series `T10Y2Y` (10-2 Year yield curve)
  - Series `UNRATE` (Unemployment Rate)
  - Endpoint: `https://api.stlouisfed.org/fred/series/{SERIES_ID}/observations`

### Fallback Options

#### Federal Reserve Board (Official)
- **Endpoint**: `https://www.federalreserve.gov/datadownload/`
- **Format**: Excel, CSV (manual or automated scraping)
- **Limitation**: Less convenient API format

#### Yahoo Finance API
- **Endpoint**: `https://query1.finance.yahoo.com/v10/finance/quoteSummary/{SYMBOL}`
- **Symbols**: `^TNX` (10Y yield), `^VIX` (volatility), etc.
- **Note**: No official API, may require reverse-engineering

#### TradingEconomics API
- **Endpoint**: `https://api.tradingeconomics.com/`
- **Requires**: API key
- **Coverage**: Global macro indicators
- **Rate limit**: 100 req/month (free tier)

#### World Bank Open Data
- **Endpoint**: `https://api.worldbank.org/v2/`
- **Data**: Global economic indicators
- **Limitation**: Low frequency (monthly/quarterly), not real-time

### Recommended Implementation
- **Primary**: FRED API (already configured)
- **Validation**: Check DXY in realistic range [70, 115]
- **Fallback**: Log warning and return `neutral` trend if outside range or API fails
- **UI**: Display macro data unavailability alert

---

## Implementation Roadmap

### Phase 1 (Complete)
- ✅ DXY validation with range check (70-115)
- ✅ Alternative fallback mechanism for all critical endpoints
- ✅ Settings page with configurable rules

### Phase 2 (Optional Enhancements)
- ⚠️ Implement Glassnode fallback for on-chain data
- ⚠️ Add HuggingFace sentiment classification for news
- ⚠️ Implement GitHub commit counting for protocol activity

### Phase 3 (Advanced)
- ⚠️ Multi-source data aggregation (vote on consensus)
- ⚠️ Historical fallback (use cached data if new API fails)
- ⚠️ Automatic endpoint rotation on failure

---

## Code Pattern: Graceful Degradation

```typescript
// Example fallback pattern
async function fetchCriticalData(primary, fallback1, fallback2) {
  try {
    return await primary();
  } catch (e1) {
    console.warn('Primary failed:', e1);
    try {
      return await fallback1();
    } catch (e2) {
      console.warn('Fallback 1 failed:', e2);
      try {
        return await fallback2();
      } catch (e3) {
        console.warn('All sources exhausted');
        return { status: 'unavailable', data: null };
      }
    }
  }
}
```

All endpoints should follow this pattern to ensure the bot remains functional even if individual data sources go down.
