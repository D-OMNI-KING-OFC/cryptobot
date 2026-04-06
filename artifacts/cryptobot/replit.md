# CryptoBot — Autonomous Crypto Signal Intelligence

## Overview
A production-grade, institutional-style cryptocurrency analysis system. Ingests real-time market and on-chain data, runs through a strict 5-phase analytical engine powered by Claude AI, and generates structured trade signal reports (LONG / SHORT / NO_TRADE).

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn-style components
- **Backend**: Node.js + Express (API proxy on port 3001)
- **AI Engine**: Anthropic Claude API (`claude-3-5-sonnet-20241022`) via server-side proxy
- **State Management**: Zustand with localStorage persistence
- **Data Fetching**: TanStack React Query with auto-refresh
- **Charts**: Lightweight Charts (TradingView) + Recharts

## Port Configuration
- Frontend (Vite dev): port **5000** (host: 0.0.0.0)
- Backend (Express): port **3001** (host: localhost)
- Vite proxies `/api/*` requests to `localhost:3001`

## Data Sources
- **OHLCV / Candles**: Kraken public REST API (via `/api/binance/klines` server proxy — Binance is geo-blocked on Replit)
- **Market Overview**: CoinGecko API (top 20 assets, Fear & Greed via alternative.me)
- **Macro**: FRED API (DXY, interest rates)
- **Social Sentiment**: LunarCrush (with Sanbase fallback; both return neutral if API tiers insufficient)
- **On-Chain**: Sanbase GraphQL (MVRV, SOPR, NVT, exchange flows, whale behavior)
- **Derivatives**: Binance Futures fapi (geo-blocked on Replit — returns graceful defaults)

## Known Geo-Restrictions (Replit Environment)
- `api.binance.com` — HTTP 451 (spot data geo-blocked)
- `fapi.binance.com` — geo-blocked (futures: funding rate, OI history)
- **Workaround**: OHLCV is sourced from Kraken instead; derivatives show neutral defaults

## API Keys (set as Replit secrets / environment variables)
- `ANTHROPIC_API_KEY` — Claude AI analysis engine
- `COINGECKO_API_KEY` — CoinGecko market data
- `FRED_API_KEY` — FRED macro data
- `ALCHEMY_API_KEY` — Alchemy on-chain (reserved for future use)
- `LUNARCRUSH_API_KEY` — LunarCrush social data
- `SANBASE_API_KEY` — Sanbase on-chain metrics

## Project Structure
```
/src
  /api            — API client functions (marketData, sentiment, onChain, macro, aiEngine)
  /components
    /analysis     — AnalysisTrigger, PhaseProgressTracker, SignalReport
    /charts       — PriceChart, OIFundingChart (new)
    /metrics      — DerivativesPanel, OnChainPanel, TokenomicsAlert (new)
    /layout       — Sidebar, Header, etc.
  /pages          — Dashboard, Analyze, History, Settings
  /store          — Zustand stores (market, analysis, settings)
  /hooks          — useMarketData, useAnalysisEngine, useOnChainData (new)
  /types          — TypeScript interfaces (market.types, signal.types, analysis.types)
  /utils          — formatters, confluenceScorer, signalValidator
/server
  app.js          — Express app setup
  index.js        — Dev entry point
  /routes
    aiProxy.js    — Claude API proxy (full 5-phase prompt, buildAnalysisPrompt)
    proxy.js      — Market data proxies (Kraken OHLCV, FRED, news, Binance fapi fallbacks)
    sanbase.js    — Sanbase GraphQL (MVRV, SOPR, NVT, exchange flows)
    lunarcrush.js — LunarCrush social sentiment (v4 API)
```

## Analysis Engine — 5 Phases
1. **Phase 1**: Macro & Sentiment — DXY, FRED rates, Fear & Greed, global liquidity
2. **Phase 2**: On-Chain & Fundamentals — Exchange flows, MVRV, SOPR, NVT, whale behavior, ETF flows, token unlocks
3. **Phase 3**: HTF Technical (1D, 1W) — EMA stack, volume profile, Fibonacci, HVNs
4. **Phase 4**: LTF Technical (15m, 1H, 4H) — BOS/CHOCH, FVGs, Order Blocks, liquidity sweeps, StochRSI, true MACD signal line
5. **Phase 5**: Synthesis — MTF confluence score, penalty rules, Claude generates JSON signal

## Technical Indicators (computed in `useAnalysisEngine.ts`)
- **RSI** — 14-period
- **MACD** — EMA12/26 with real 9-period EMA signal line (not approximation)
- **StochRSI** — Full Stochastic RSI (k=3, d=3 smooth)
- **Bollinger Bands** — 20-period, 2σ
- **ATR** — 14-period Average True Range
- **VWAP** — Volume-weighted average price
- **EMA 20/50/200** — Multi-timeframe EMA stack
- **Volume Profile** — POC, VAH, VAL, top-5 HVNs (50-bucket)
- **Fibonacci Levels** — Retracements (0.236–0.786) + Extensions (1.0–2.618)
- **Correlations** — 30-day Pearson vs BTC and ETH

## Market Structure Detection
- **BOS** (Break of Structure) — 10-candle lookback, bidirectional
- **CHOCH** (Change of Character) — trend reversal detection
- **FVGs** — Fair Value Gaps (3-candle imbalance zones)
- **Order Blocks** — Demand/supply zones with momentum confirmation
- **Liquidity Sweeps** — Wick-through + close-inside pattern

## Claude Prompt Rules (aiProxy.js)
- Mandatory confidence penalty rules applied before signal output
- Force NO_TRADE if: R:R < 1:2, confidence < 55, |MTF score| < 0.3, funding > 0.1%+rising DXY
- Output format: strict JSON only, no prose outside schema

## Development
```bash
npm run dev   # Starts both frontend (port 5000) and backend (port 3001) concurrently
```

## Key Features
1. **5-Phase AI Analysis**: Macro → On-Chain → HTF Technical → LTF Technical → Claude Synthesis
2. **Signal Validation**: R:R, confidence threshold, MTF confluence enforcement
3. **Real-time Dashboard**: Live prices, Fear & Greed, BTC dominance, market cap
4. **OI + Funding Chart**: 24h open interest trend + funding rate history panels
5. **Tokenomics Alert**: Token unlock risk display with confidence impact warnings
6. **Signal History**: localStorage persistence, outcome tracking, CSV export
7. **Bloomberg Terminal aesthetic**: Dark, data-dense UI with Orbitron/Rajdhani/Share Tech Mono fonts
