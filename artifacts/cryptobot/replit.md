# CryptoBot — Autonomous Crypto Signal Intelligence

## Overview
A production-grade, institutional-style cryptocurrency analysis system. Ingests real-time market and on-chain data, runs through a strict 5-phase analytical engine powered by Claude AI, and generates structured trade signal reports (LONG / SHORT / NO_TRADE).

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn-style components
- **Backend**: Node.js + Express (API proxy on port 3001)
- **AI Engine**: Anthropic Claude API (`claude-sonnet-4-20250514`) via server-side proxy
- **State Management**: Zustand with localStorage persistence
- **Data Fetching**: TanStack React Query with auto-refresh
- **Charts**: Lightweight Charts (TradingView) + Recharts

## Port Configuration
- Frontend (Vite dev): port **5000** (host: 0.0.0.0)
- Backend (Express): port **3001** (host: localhost)
- Vite proxies `/api/*` requests to `localhost:3001`

## Data Sources (Current — All Free, No Key Required Unless Noted)
- **OHLCV / Candles**: Kraken public REST API (via `/api/binance/klines` server proxy)
- **Market Overview**: CoinGecko free API (Fear & Greed via alternative.me)
- **DXY (Dollar Index)**: Frankfurter.app FX rates → DXY formula computation (no key needed); FRED as primary if key set
- **News Headlines**: 3-source RSS aggregator — CoinTelegraph, Decrypt, CoinDesk (no key required)
- **ETF Activity**: Yahoo Finance proxy via IBIT/FBTC/GBTC price+volume signal (replaces Farside — now Cloudflare-blocked)
- **On-Chain**: Sanbase GraphQL (MVRV, SOPR, NVT, exchange flows, whale behavior); CoinMetrics Community API as fallback; minimal neutral fallback if both fail
- **Derivatives**: Binance FAPI (geo-blocked on Replit) → returns `null` correctly; do not assume neutral

## Geo-Restrictions on Replit (Handled Gracefully)
- `api.binance.com` — HTTP 451 (spot data geo-blocked)
- `fapi.binance.com` — geo-blocked (funding rate, OI, long/short ratio)
  - All three return `null` explicitly (NOT fake neutral defaults like 0.0001 or 1.0)
  - Prompt instructs Claude not to penalise confidence for these specific gaps
- `farside.co.uk` — Cloudflare-blocked; replaced with Yahoo Finance ETF proxy
- **OHLCV/correlations**: Sourced from Kraken instead of Binance

## API Keys
- `ANTHROPIC_API_KEY` — **Required** — Claude AI analysis engine
- `SANBASE_API_KEY` — Optional — Enhanced on-chain metrics (MVRV, SOPR, whale flows)
- `FRED_API_KEY` — Optional — FRED DXY/rates (falls back to Frankfurter FX if absent)

## Project Structure
```
/src
  /api            — API client functions (marketData, sentiment, onChain, macro, aiEngine)
  /components
    /analysis     — AnalysisTrigger, PhaseProgressTracker, SignalReport
    /charts       — PriceChart, OIFundingChart
    /metrics      — DerivativesPanel, OnChainPanel, TokenomicsAlert
    /layout       — Sidebar, Header, MacroContextBar
  /pages          — Dashboard, Analyze, History, Settings
  /store          — Zustand stores (market, analysis, settings)
  /hooks          — useMarketData, useAnalysisEngine, useOnChainData
  /types          — TypeScript interfaces (market.types, signal.types, analysis.types)
  /utils          — formatters, confluenceScorer, signalValidator, advancedAnalytics
/server
  app.js          — Express app setup
  index.js        — Dev entry point
  /routes
    aiProxy.js    — Claude API proxy (full 5-phase prompt, buildAnalysisPrompt)
    proxy.js      — Market data proxies (Kraken, Frankfurter DXY, RSS news, ETF via Yahoo Finance)
    sanbase.js    — Sanbase GraphQL with CoinMetrics Community API fallback
    advanced.js   — Deribit options + orderbook analytics
```

## Analysis Engine — 5 Phases
1. **Phase 1**: Macro & Sentiment — DXY (Frankfurter), FRED rates, Fear & Greed, global liquidity
2. **Phase 2**: On-Chain & Fundamentals — Exchange flows, MVRV, SOPR, NVT, whale behavior, ETF activity (Yahoo Finance IBIT/FBTC/GBTC proxy), token unlocks
3. **Phase 3**: HTF Technical (1D, 1W) — EMA stack, volume profile, Fibonacci, HVNs
4. **Phase 4**: LTF Technical (15m, 1H, 4H) — BOS/CHOCH, FVGs, Order Blocks, liquidity sweeps, StochRSI, MACD
5. **Phase 5**: Synthesis — MTF confluence score, penalty rules, Claude generates JSON signal

## Signal Validator Calibration (Master Prompt Spec)
- `phaseAlignmentMinimum`: 2 (not 3 — prevents over-filtering at medium confluence)
- MTF threshold: `< 0.3` (not `<= 0.3` — allows exactly 0.3 to pass)
- Funding rate crowded threshold: `0.0005` (0.05%) per master prompt spec
- 2-phase signals: CONDITIONAL (human review required), NOT automatic NO_TRADE
- Claude computes its own MTF score (pre-computed score is "reference only, do not adopt" — removes anchoring bias)

## AI Prompt Design (aiProxy.js)
- **BALANCE CALIBRATION**: "Not too strict, not too loose" human-judgment philosophy
- **Data gap handling**: Missing data shown with explicit instructional context (not just "N/A")
- **Null values**: DXY null → "use Global Liquidity as proxy"; funding null → "do not assume neutral"; LS ratio null → "do not treat as balanced 1.0"
- **Anti-boilerplate**: Each asset's noTradeReason must be unique
- **Phase count enforcement**: Claude counts phases after completing all four biases
- Output format: strict JSON only, no prose outside schema

## Technical Indicators (computed in `useAnalysisEngine.ts`)
- RSI (14-period), MACD (EMA12/26 + real 9-period EMA signal line), StochRSI (k=3, d=3)
- Bollinger Bands (20-period, 2σ), ATR (14-period), VWAP
- EMA 20/50/200, Volume Profile (POC/VAH/VAL, top-5 HVNs, 50-bucket)
- Fibonacci Retracements (0.236–0.786) + Extensions (1.0–2.618)
- Correlations: 30-day Pearson vs BTC and ETH (via Kraken proxy)

## Market Structure Detection
- BOS (Break of Structure) — 10-candle lookback, bidirectional
- CHOCH (Change of Character) — trend reversal detection
- FVGs — Fair Value Gaps (3-candle imbalance zones)
- Order Blocks — Demand/supply zones with momentum confirmation
- Liquidity Sweeps — Wick-through + close-inside pattern

## Key Audit Fixes Applied
1. DXY: FRED → Frankfurter FX formula fallback (correct computation of DXY from 6 FX pairs)
2. News: Single-source CoinGecko → 3-source RSS (CoinTelegraph + Decrypt + CoinDesk)
3. Funding rate: Was returning fake 0.0001 → now returns `null` when geo-blocked
4. Long/Short ratio: Was returning fake 1.0 → now returns `null` when geo-blocked
5. DXY type: Was `number` → `number | null` in TypeScript types + null-safe UI rendering
6. Long/Short type: `number` → `number | null` throughout type chain
7. On-chain: 502 errors → CoinMetrics Community API fallback → minimal neutral fallback
8. ETF flows: Farside 404 → Yahoo Finance IBIT/FBTC/GBTC activity proxy
9. Signal validator: phaseAlignmentMinimum 3→2, MTF `<= 0.3`→`< 0.3`, funding threshold corrected
10. HUMAN JUDGMENT LAYER: 2-phase auto NO_TRADE → CONDITIONAL (human review)
11. MTF anchoring: Pre-computed score labeled "reference only" in prompt
12. MacroContextBar: `dxy.toFixed()` null safety fix

## Development
```bash
npm run dev   # Starts both frontend (port 5000) and backend (port 3001) concurrently
```
