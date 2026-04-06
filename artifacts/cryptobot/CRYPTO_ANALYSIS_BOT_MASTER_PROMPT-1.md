# MASTER BUILD INSTRUCTION: AUTONOMOUS CRYPTO ANALYSIS BOT
**For AI Builders (Trae / Cursor / v0 / Bolt)**
**Target Output: Production-Grade React Web Application**

---

## OVERVIEW & MISSION

Build a **full-stack React web application** that functions as an institutional-grade, autonomous cryptocurrency analysis bot. The bot must ingest real-time and on-chain market data, run it through a strict 5-phase analytical engine, and produce structured, evidence-based trade signal reports — or explicitly declare **NO TRADE** when conditions are insufficient.

This is **not** an execution bot. It **does not place orders**. It is a pure **signal intelligence and analysis system** with a professional dashboard UI.

The system must reflect **quantitative rigor + common sense judgment**. It should behave like a senior analyst who knows when to act and, critically, when to stay out of the market.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend Framework | React 18+ with TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| State Management | Zustand or Redux Toolkit |
| Data Fetching | React Query (TanStack Query) |
| Charts | TradingView Lightweight Charts + Recharts |
| AI/LLM Engine | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Market Data | CoinGecko API + Binance Public REST API |
| On-Chain Data | Alchemy API (For analysing only
01:00
Ethereum Mainnet
Ethereum Mainnet
Ethereum Sepolia
Ethereum Sepolia
Ethereum Hoodi
Ethereum Hoodi
Ethereum Mainnet Beacon
Ethereum Mainnet Beacon
Ethereum Sepolia Beacon
Ethereum Sepolia Beacon
Ethereum Hoodi Beacon
Ethereum Hoodi Beacon
Solana Mainnet
Solana Mainnet
Solana Devnet
Solana Devnet
Tron Mainnet
Tron Mainnet
Tron Testnet
Tron Testnet
BNB Smart Chain Mainnet
BNB Smart Chain Mainnet
BNB Smart Chain Testnet
BNB Smart Chain Testnet
Bitcoin Mainnet
Bitcoin Mainnet
Bitcoin Testnet
Bitcoin Testnet
Bitcoin Signet
Bitcoin Signet
Bitcoin Testnet4
Bitcoin Testnet4)|
| Macro Data | FRED API (DXY, interest rates) |
| Sentiment Data | Alternative.me (Fear & Greed) + LunarCrush API |
| Routing | React Router v6 |
| Backend (BFF) | Node.js + Express (thin API proxy to protect keys) |
| Environment | `.env` file for all API keys — never hardcode |

---

## PROJECT STRUCTURE

```
/crypto-signal-bot
├── /public
├── /src
│   ├── /api                    # All API call functions
│   │   ├── marketData.ts
│   │   ├── onChain.ts
│   │   ├── sentiment.ts
│   │   ├── macro.ts
│   │   └── aiEngine.ts
│   ├── /components
│   │   ├── /layout
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── /dashboard
│   │   │   ├── MarketOverview.tsx
│   │   │   ├── BTCDominanceCard.tsx
│   │   │   ├── FearGreedMeter.tsx
│   │   │   └── MacroContextBar.tsx
│   │   ├── /analysis
│   │   │   ├── AnalysisTrigger.tsx
│   │   │   ├── PhaseProgressTracker.tsx
│   │   │   ├── SignalReport.tsx
│   │   │   └── NoTradeCard.tsx
│   │   ├── /charts
│   │   │   ├── PriceChart.tsx
│   │   │   ├── VolumeProfile.tsx
│   │   │   └── OIFundingChart.tsx
│   │   ├── /metrics
│   │   │   ├── OnChainPanel.tsx
│   │   │   ├── DerivativesPanel.tsx
│   │   │   └── TokenomicsAlert.tsx
│   │   └── /history
│   │       ├── SignalHistory.tsx
│   │       └── PerformanceStats.tsx
│   ├── /pages
│   │   ├── Dashboard.tsx
│   │   ├── Analyze.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── /store
│   │   ├── useMarketStore.ts
│   │   ├── useAnalysisStore.ts
│   │   └── useSettingsStore.ts
│   ├── /hooks
│   │   ├── useMarketData.ts
│   │   ├── useOnChainData.ts
│   │   └── useAnalysisEngine.ts
│   ├── /types
│   │   ├── market.types.ts
│   │   ├── signal.types.ts
│   │   └── analysis.types.ts
│   ├── /utils
│   │   ├── formatters.ts
│   │   ├── confluenceScorer.ts
│   │   └── signalValidator.ts
│   └── App.tsx
├── /server
│   ├── index.js
│   └── /routes
│       ├── proxy.js
│       └── aiProxy.js
├── .env
└── package.json
```

---

## SECTION 1: DATA INGESTION LAYER

The bot must continuously collect and refresh the following data streams. Each data category maps directly to the analysis phases below.

### 1.1 Market Data (via Binance + CoinGecko)

Fetch and store for the selected trading pair:

- **OHLCV candles** across all required timeframes: `1m`, `5m`, `15m`, `1H`, `4H`, `1D`, `1W`
- **Order Book Depth** (top 20 bids/asks)
- **24h Volume, price change %, market cap**
- **Funding Rate** (perpetual futures) — refresh every 1 minute
- **Open Interest (OI)** — refresh every 5 minutes
- **Liquidation Heatmap data** (use Coinalyze API or CoinGlass API)

```typescript
// Example type
interface OHLCVCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
}

interface DerivativesData {
  fundingRate: number;         // e.g., 0.0102 = 1.02%
  fundingRateStatus: 'neutral' | 'overheated_long' | 'overheated_short';
  openInterest: number;        // in USD
  oiChangePercent24h: number;
  longShortRatio: number;
  estimatedLiquidationLevels: { price: number; side: 'long' | 'short'; sizeMillion: number }[];
}
```

### 1.2 On-Chain Data (via Glassnode or CryptoQuant)

Fetch for BTC and ETH always. For altcoins, fetch where available:

- **Exchange Net Flow** (coins moving in/out of exchanges)
- **Exchange Reserves** (total coins held on exchanges)
- **Whale Wallet Activity** (wallets >1000 BTC or equivalent)
- **MVRV Ratio** — Market Value to Realized Value (overvalued/undervalued signal)
- **SOPR** — Spent Output Profit Ratio (are holders selling at profit or loss?)
- **NVT Ratio** — Network Value to Transactions (valuation signal)
- **Spot ETF Inflows/Outflows** (for BTC and ETH — fetch from SoSoValue API or manual CoinGlass)
- **Token Unlock Schedule** — if altcoin, flag any unlock within next 30 days

```typescript
interface OnChainMetrics {
  exchangeNetFlow: number;       // positive = inflow (bearish), negative = outflow (bullish)
  exchangeReserves: number;
  exchangeReservesTrend: 'rising' | 'falling' | 'neutral';
  mvrv: number;
  sopr: number;
  nvtRatio: number;
  whaleBehavior: 'accumulating' | 'distributing' | 'neutral';
  etfNetFlow24h?: number;        // USD millions
  etfNetFlowWeekly?: number;
  tokenUnlockWarning?: {
    date: string;
    amountUSD: number;
    percentOfCirculating: number;
  };
}
```

### 1.3 Sentiment & Macro Data

- **Fear & Greed Index** (Alternative.me API) — refresh every 6 hours
- **Bitcoin Dominance (BTC.D)** — from CoinGecko global endpoint
- **Total Crypto Market Cap** and **Total2** (ex-BTC) and **Total3** (ex-BTC/ETH)
- **DXY (U.S. Dollar Index)** — from FRED API or Alpha Vantage
- **U.S. Interest Rate Expectations** — Fed Funds futures data or FRED
- **Social Volume** — LunarCrush API (social mentions, sentiment score)
- **News NLP Feed** — Cryptopanic API (classify: bullish / bearish / neutral headlines)
- **Narrative Sector Tags** — tag each asset with its narrative (AI, RWA, L1, DeFi, Meme, etc.)

```typescript
interface MacroSentimentData {
  fearGreedIndex: number;        // 0–100
  fearGreedLabel: string;        // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  btcDominance: number;          // percentage
  totalMarketCap: number;
  total2MarketCap: number;
  dxy: number;
  dxyTrend: 'rising' | 'falling' | 'neutral';
  interestRateExpectation: 'hawkish' | 'neutral' | 'dovish';
  globalLiquidityTrend: 'expanding' | 'contracting' | 'neutral';
  socialVolume: number;
  socialSentimentScore: number;  // -100 to 100
  recentNewsHeadlines: NewsItem[];
  dominantNarrative: string;
  assetNarrativeTags: string[];
}
```

---

## SECTION 2: FEATURE ENGINEERING

Before analysis, the bot must compute derived features from raw data. This is the preprocessing layer.

### 2.1 Technical Indicators (compute per timeframe)

Compute the following on every relevant timeframe (`15m`, `1H`, `4H`, `1D`, `1W`):

| Indicator | Parameters | Purpose |
|---|---|---|
| RSI | Period 14 | Overbought/oversold, divergences |
| MACD | 12/26/9 | Momentum direction, crossovers, divergences |
| Bollinger Bands | 20 period, 2 std | Volatility, squeeze detection |
| ATR | Period 14 | Volatility-based SL sizing |
| EMA | 20, 50, 200 | Trend structure, dynamic S/R |
| VWAP | Session-based | Fair value anchor, institutional reference |
| Stochastic RSI | 14/3/3 | Short-term momentum confirmation |
| Volume SMA | 20 period | Compare current volume vs average |

### 2.2 Multi-Timeframe Confluence Score

For each timeframe, compute a `bias` score: `+1` (bullish), `0` (neutral), `-1` (bearish).

Combine across timeframes with weighting:

```typescript
function computeMTFConfluenceScore(signals: TimeframeBias[]): number {
  const weights = { '1W': 0.30, '1D': 0.25, '4H': 0.20, '1H': 0.15, '15m': 0.10 };
  let score = 0;
  for (const signal of signals) {
    score += signal.bias * weights[signal.timeframe];
  }
  return score; // -1 to +1
}
```

- Score > 0.5 → Strong bullish confluence
- Score between 0.2 and 0.5 → Moderate bullish
- Score between -0.2 and 0.2 → Neutral / No trade bias
- Score < -0.5 → Strong bearish confluence

### 2.3 Market Structure Detection

Automatically detect and label on each LTF candle dataset:

- **Break of Structure (BOS)** — price breaks a prior swing high/low
- **Change of Character (CHOCH)** — reversal BOS, first sign of trend change
- **Fair Value Gaps (FVG)** — 3-candle imbalance gaps (bullish & bearish)
- **Order Blocks** — last bearish candle before a bullish BOS (demand OB), and vice versa
- **Liquidity Sweeps** — wicks that pierce key highs/lows then close back inside range
- **Supply & Demand Zones** — high-volume price consolidation zones from Volume Profile

### 2.4 Volume Profile

Compute from HTF data:

- **Point of Control (POC)** — price level with highest traded volume
- **Value Area High (VAH)** and **Value Area Low (VAL)**
- **High Volume Nodes (HVN)** — strong S/R levels
- **Low Volume Nodes (LVN)** — price tends to move through quickly

### 2.5 Fibonacci Levels

Auto-compute from the most recent significant swing high → swing low (or reverse):

- Key retracement levels: 0.236, 0.382, 0.5, 0.618, 0.786
- Extension levels for TP targets: 1.0, 1.272, 1.618, 2.0, 2.618

### 2.6 Correlation Engine

- Compute rolling 30-day Pearson correlation between the selected asset and BTC, ETH, DXY
- Flag if selected asset is highly correlated (>0.8) with another asset already in analysis queue
- Compute inter-timeframe correlation to validate signal consistency

---

## SECTION 3: THE 5-PHASE AI ANALYSIS ENGINE

This is the core. When the user triggers analysis, the bot must execute all 5 phases **sequentially and completely**. No phases may be skipped. Each phase must produce structured output that feeds the next.

The analysis is powered by **Claude AI** (claude-sonnet-4-20250514) via the Anthropic API. The bot feeds Claude a richly structured data payload and a strict system prompt. Claude synthesizes the data and returns a structured JSON response.

### System Prompt for Claude (inject this on every analysis call):

```
You are an institutional-grade quantitative cryptocurrency analyst. You do not guess, speculate without evidence, or produce vague language. You synthesize verifiable data into precise, actionable intelligence.

You must analyze the provided cryptocurrency data through a strict 5-phase framework and output a structured JSON response. Be direct, specific, and evidence-based. If data is unavailable or conflicting, explicitly flag it as a risk factor — never fill gaps with assumptions.

Your output must follow the exact JSON schema provided. Do not add commentary outside the schema.

If the analysis reveals a low-probability or low-confluence environment, your bias MUST be "NO_TRADE" and your confidence score MUST reflect this honestly.

Common sense rule: Do not force a trade. A day with no signal is a valid and valuable output.
```

### Phase 1: Macro & Market Context

**Input data:** DXY value + trend, interest rate expectation, global liquidity trend, BTC.D, Total/Total2/Total3, dominant narrative, asset narrative tags, social sentiment, Fear & Greed Index.

**Claude must determine:**
1. Is the macro environment a tailwind or headwind for risk-on assets?
2. Where is capital rotating — BTC, large caps, or altcoins?
3. Does the target asset have strong narrative alignment with current market attention?
4. What is the macro bias? (`bullish_macro` | `bearish_macro` | `neutral_macro`)

### Phase 2: Fundamental & On-Chain Data

**Input data:** Exchange net flows, exchange reserves trend, whale behavior, MVRV, SOPR, NVT, ETF inflows/outflows (if applicable), funding rate, open interest change, long/short ratio, token unlock warnings, news headlines (NLP classified).

**Claude must determine:**
1. Are coins moving off exchanges (bullish) or onto exchanges (bearish)?
2. Is the derivatives market overheated in either direction? Is a squeeze possible?
3. Are there any fundamental catalysts or landmines (unlocks, regulatory risk, protocol events)?
4. What is the on-chain + fundamental bias? (`bullish_fundamental` | `bearish_fundamental` | `neutral_fundamental`)

### Phase 3: Higher Timeframe Technical Analysis (1D, 1W)

**Input data:** 1D and 1W OHLCV candles, computed indicators (RSI, MACD, EMA 20/50/200, BB), Volume Profile (POC, VAH, VAL, HVN), identified key S/R zones, Fibonacci levels from HTF swing.

**Claude must determine:**
1. What is the dominant HTF trend? Is price above or below key EMAs?
2. Where are the major S/R levels, supply/demand zones, and liquidity pools (un-swept highs/lows)?
3. Where is the POC? Is price trading above (bullish) or below (bearish) the POC?
4. What is the HTF technical bias? (`bullish_htf` | `bearish_htf` | `neutral_htf`)
5. List the top 3 key HTF levels with price and type (support / resistance / POC / liquidity pool).

### Phase 4: Lower Timeframe Technical Analysis (15m, 1H, 4H)

**Input data:** 15m, 1H, 4H OHLCV candles, computed indicators, detected BOS/CHOCH events, identified FVGs, Order Blocks, Liquidity Sweeps, RSI + MACD values and divergence flags across timeframes.

**Claude must determine:**
1. Has there been a recent BOS or CHOCH on 1H or 4H? In which direction?
2. Were there any recent liquidity sweeps? Is price now moving in the post-sweep direction?
3. Is there RSI or MACD divergence (bullish or bearish)?
4. Is there a valid, specific entry trigger right now (FVG fill, OB retest, EMA rejection, pattern)?
5. What is the LTF technical bias? (`bullish_ltf` | `bearish_ltf` | `neutral_ltf`)
6. State the exact entry trigger with price and candle/zone description.

### Phase 5: Risk Assessment & Confluence Synthesis

**Input data:** All outputs from Phases 1–4, MTF confluence score, computed ATR for SL sizing, Fibonacci extensions for TP targets.

**Claude must determine:**
1. **Alignment Check**: Do HTF trend, LTF structure, on-chain metrics, and macro all align? Explicitly flag any contradictions.
2. **Confidence Score**: Output a score from `0` to `100`. Apply these mandatory penalties:
   - Funding rate overheated (>0.1%) AND DXY rising: -20 points
   - Token unlock within 7 days: -15 points
   - CHOCH not yet confirmed on LTF: -10 points
   - Fear & Greed in extreme territory against the trade direction: -10 points
   - MTF confluence score < 0.3: force NO_TRADE
3. **Final Bias**: `LONG` | `SHORT` | `NO_TRADE`
4. **If LONG or SHORT:**
   - Entry: specific price or tight range
   - Stop Loss: based on ATR or structure, not arbitrary percent
   - Take Profit 1: first structural resistance/support
   - Take Profit 2: Fibonacci extension or major HTF level
   - Take Profit 3 (optional): extended target
   - Risk/Reward Ratio: must be ≥ 1:2 or output NO_TRADE
   - Holding Time: `scalp` (< 4H) | `intraday` (4H–24H) | `swing` (days–weeks)
   - Probability Estimate: 0–100%
   - Invalidation Level: the exact price that breaks the thesis
5. **Reason String**: 2–4 sentence synthesis citing specific data points from all 5 phases
6. **Cancellation Conditions**: exactly what would invalidate the trade post-entry

---

## SECTION 4: SIGNAL VALIDATION LAYER

Before displaying any signal, run it through the `signalValidator` utility:

```typescript
function validateSignal(signal: AnalysisOutput): ValidationResult {
  const errors: string[] = [];

  // Rule 1: R:R must be at least 1:2
  const rr = (signal.tp1 - signal.entry) / (signal.entry - signal.stopLoss);
  if (Math.abs(rr) < 2) errors.push('Risk/Reward below 1:2 minimum');

  // Rule 2: Confidence below 55 forces NO_TRADE
  if (signal.confidence < 55 && signal.bias !== 'NO_TRADE') {
    errors.push('Confidence too low for active signal — downgrade to NO_TRADE');
  }

  // Rule 3: MTF confluence must be ≥ 0.3 in signal direction
  if (Math.abs(signal.mtfConfluenceScore) < 0.3) {
    errors.push('Insufficient MTF confluence — NO_TRADE');
  }

  // Rule 4: SL must not exceed 8% from entry (risk management cap)
  const slPercent = Math.abs(signal.entry - signal.stopLoss) / signal.entry * 100;
  if (slPercent > 8) errors.push('Stop Loss too wide — exceeds 8% maximum');

  // Rule 5: Funding rate overheated + signal direction = crowded trade warning
  if (signal.fundingRate > 0.1 && signal.bias === 'LONG') {
    errors.push('WARNING: Funding rate overheated — long is a crowded trade');
  }

  return {
    isValid: errors.length === 0,
    warnings: errors,
    overrideToNoTrade: errors.some(e => e.includes('NO_TRADE'))
  };
}
```

---

## SECTION 5: UI / UX DESIGN

### Overall Design Language

- **Theme**: Dark, professional, data-dense. Inspired by Bloomberg Terminal + TradingView
- **Color Palette**:
  - Background: `#020610` (near-black deep blue)
  - Surface: `#0d1117`
  - Accent/Bullish: `#00ff9d` (neon green)
  - Bearish/Short: `#ff2d55` (neon red)
  - Neutral/Info: `#00e5ff` (cyan)
  - Warning: `#ffe600` (yellow)
  - AI/Analysis: `#b24bff` (purple)
  - Text Primary: `#c8e6ff`
  - Text Secondary: `rgba(200,230,255,0.5)`
- **Typography**: Orbitron (headings), Rajdhani (body labels), Share Tech Mono (data values, code)
- **Grid lines**: subtle `rgba(0,200,255,0.04)` grid on background
- **Animations**: smooth fade-in on data load, pulse on live data, shimmer on loading states

---

### Page 1: Dashboard (`/`)

**Purpose:** Real-time market overview — the "command center"

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  TopBar: Logo | Watchlist Selector | Live Clock     │
├──────────┬──────────────────────────────────────────┤
│          │  MacroContextBar (full width):            │
│          │  DXY | BTC.D | Total MC | Fear&Greed     │
│ Sidebar  │  Interest Rate Expectation | Narrative    │
│          ├──────────────────────────────────────────┤
│ (nav)    │  ┌──────────────┐  ┌──────────────┐      │
│          │  │ BTC Overview │  │ ETH Overview │      │
│          │  │ Price + 24h% │  │ Price + 24h% │      │
│          │  │ Volume | OI  │  │ Volume | OI  │      │
│          │  │ Funding Rate │  │ Funding Rate │      │
│          │  └──────────────┘  └──────────────┘      │
│          ├──────────────────────────────────────────┤
│          │  MarketOverview Table:                    │
│          │  Top 20 assets | Price | 24h% | OI |     │
│          │  Funding | On-Chain Signal | Narrative    │
│          ├──────────────────────────────────────────┤
│          │  FearGreedMeter (gauge widget)            │
│          │  Social Sentiment Bar                     │
│          │  Recent News Feed (NLP tagged)            │
└──────────┴──────────────────────────────────────────┘
```

**Components:**
- `MacroContextBar`: horizontal strip showing DXY (with up/down arrow), BTC.D, total market cap, Fear & Greed (color-coded), dominant narrative badge, global liquidity indicator
- `MarketOverview`: sortable table with color-coded signals in each column. Clicking a row takes user to Analyze page with that pair pre-loaded
- `FearGreedMeter`: animated semicircle gauge, changes color from red → yellow → green with the index value
- `NewsNLPFeed`: scrolling ticker of recent headlines, each tagged `BULLISH` / `BEARISH` / `NEUTRAL` in color

---

### Page 2: Analyze (`/analyze`)

**Purpose:** The main analysis interface — trigger deep analysis on any pair

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Pair Selector: [BTC/USDT ▼]  [Run Analysis Button] │
├─────────────────────────────────────────────┬───────┤
│                                             │       │
│  TradingView Chart (main, interactive)      │ Data  │
│  - Timeframe tabs: 15m | 1H | 4H | 1D | 1W │ Panel │
│  - Overlay: EMA 20/50/200, BB, VWAP        │       │
│  - Markers: detected BOS, CHOCH, FVG, OB  │ OI    │
│  - Volume Profile histogram on right        │ Fund  │
│                                             │ Rate  │
│                                             │       │
│                                             │ OB    │
│                                             │ Depth │
├─────────────────────────────────────────────┴───────┤
│  Sub-charts row:                                     │
│  [RSI Panel] [MACD Panel] [OI + Funding Chart]      │
├─────────────────────────────────────────────────────┤
│  Analysis Progress Tracker (visible during analysis):│
│  ● Phase 1: Macro Context    [COMPLETE ✓]           │
│  ● Phase 2: On-Chain         [RUNNING...]           │
│  ● Phase 3: HTF Technical    [PENDING]              │
│  ● Phase 4: LTF Technical    [PENDING]              │
│  ● Phase 5: Synthesis        [PENDING]              │
├─────────────────────────────────────────────────────┤
│  SIGNAL REPORT (renders after analysis complete)    │
│  See Section 6 for exact format                     │
└─────────────────────────────────────────────────────┘
```

**Analysis Trigger Flow:**
1. User selects pair and clicks "Run Analysis"
2. Bot shows `PhaseProgressTracker` — each phase lights up as it completes
3. All data is fetched in parallel for the selected pair
4. Data is packaged into a structured Claude prompt payload
5. Claude API is called with the 5-phase system prompt + data
6. Response is validated through `signalValidator`
7. `SignalReport` component renders with full output

**Chart Requirements:**
- Use **TradingView Lightweight Charts** library
- Auto-draw detected **FVG zones** (shaded rectangles, green/red)
- Auto-draw detected **Order Blocks** (shaded boxes with label)
- Auto-mark **BOS** and **CHOCH** events (labeled arrows on chart)
- Draw **Fibonacci levels** as horizontal lines with labels
- Mark **Volume Profile** POC as a dashed horizontal line

---

### Page 3: History (`/history`)

**Purpose:** Track all past signals and measure bot accuracy

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Performance Summary Cards:                         │
│  [Total Signals] [Win Rate %] [Avg R:R] [Avg Conf]  │
├─────────────────────────────────────────────────────┤
│  Filters: Pair | Bias | Holding Time | Date Range   │
├─────────────────────────────────────────────────────┤
│  Signal History Table:                              │
│  Date | Pair | Bias | Entry | SL | TP | Conf | Result│
│  (expandable rows showing full signal report)       │
├─────────────────────────────────────────────────────┤
│  Performance Charts:                                │
│  - Win rate over time (line chart)                  │
│  - Confidence vs Outcome scatter plot               │
│  - Win rate by asset (bar chart)                    │
│  - Win rate by holding time (bar chart)             │
└─────────────────────────────────────────────────────┘
```

**Persistence:** Store signal history in `localStorage` with full signal JSON. Allow export as CSV.

**Outcome Tracking:** After the signal's holding period, prompt user to mark outcome: `TP1 Hit` | `TP2 Hit` | `SL Hit` | `Cancelled` | `Still Open`.

---

### Page 4: Settings (`/settings`)

- API key management (Glassnode, LunarCrush, CryptoQuant, FRED, Anthropic)
- Default watchlist asset configuration
- Minimum confidence threshold (default: 55 — signals below this auto-display as NO_TRADE)
- Data refresh intervals
- Risk management defaults (max SL%, minimum R:R ratio)
- Notification preferences (browser push on new signal)

---

## SECTION 6: SIGNAL REPORT OUTPUT FORMAT

When analysis completes, render the `SignalReport` component with this **exact structure**. The component must be visually clean, readable, and printable.

### If Signal is LONG or SHORT:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ASSET PAIR]                    [TIMESTAMP]
  ● SIGNAL: ▲ LONG / ▼ SHORT     [CONFIDENCE: XX%]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  BIAS              [BULLISH / BEARISH]
  SETUP             [e.g., 4H OB retest at FVG, post-liquidity sweep]
  ENTRY             $XX,XXX — $XX,XXX  [tight range or precise level]
  STOP LOSS         $XX,XXX  [ATR-based, below/above key structure]
  TAKE PROFIT 1     $XX,XXX  [first structural target]
  TAKE PROFIT 2     $XX,XXX  [Fibonacci / HTF resistance]
  TAKE PROFIT 3     $XX,XXX  [extended, optional]

  RISK / REWARD     1 : X.X
  PROBABILITY       XX%
  CONFIDENCE        X / 10
  HOLDING TIME      [Scalp / Intraday / Swing]
  INVALIDATION      $XX,XXX — [if price closes above/below this level]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHY THIS TRADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  MACRO:        [Specific macro factor supporting the trade]
  ON-CHAIN:     [Specific on-chain evidence]
  HTF TECH:     [HTF structure / trend supporting the trade]
  LTF TECH:     [Specific trigger on LTF — FVG, OB, sweep etc.]
  SENTIMENT:    [Fear/Greed, funding rate, social context]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WHAT CANCELS THIS TRADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Bulleted list of exact cancellation conditions — price levels or events]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE ALIGNMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phase 1 · Macro        [✓ Bullish / ✗ Bearish / ~ Neutral]
  Phase 2 · On-Chain     [✓ Bullish / ✗ Bearish / ~ Neutral]
  Phase 3 · HTF Tech     [✓ Bullish / ✗ Bearish / ~ Neutral]
  Phase 4 · LTF Tech     [✓ Bullish / ✗ Bearish / ~ Neutral]
  Phase 5 · Synthesis    [MTF Confluence: X.XX / 1.0]

  FINAL VERDICT: [EXECUTE / WATCH / NO_TRADE]
  BEST TRADE:   [One-line precise summary of the cleanest setup]
```

### If Signal is NO_TRADE:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ASSET PAIR]                    [TIMESTAMP]
  ⊘ NO TRADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  WHY NO TRADE:
  [Specific, honest list of what is missing or conflicting]

  WHAT TO WAIT FOR:
  [Exact conditions that would produce a valid setup]

  NEXT REVIEW:  [Suggested timeframe to re-analyze]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## SECTION 7: LANGUAGE RULES FOR AI OUTPUT

These rules govern what Claude is allowed to say. Enforce them in the system prompt:

### NEVER use:
- "could," "might," "possibly," "perhaps" — except when explaining a specific risk scenario
- Vague phrases like "price may find support here"
- Generic educational content ("RSI measures momentum...")
- Invented price levels (if data is not available, say so)
- Fabricated certainty ("this will definitely...")
- Multiple weak setups — one clean setup or NO_TRADE

### ALWAYS use:
- Specific price levels with evidence for why that level matters
- Named data sources in reasoning ("Exchange net flow is -42,000 BTC this week...")
- Honest confidence scoring (a 55% confidence signal should show 55, not 75)
- Clear structural references ("price is above the 200 EMA on the daily")
- Explicit risk acknowledgments when data conflicts

### Common Sense Enforcement:
The AI must apply real-world judgment. Examples:
- If macro is very bearish (DXY spiking, BTC.D falling, Fear at Extreme Fear) and a small altcoin shows a bullish LTF pattern → **downgrade confidence by at least 20 points**, note the conflict prominently
- If funding rate is at 0.15%+ and the signal is LONG → **mandatory warning**: "Trade is in the direction of a crowded long — squeeze risk is elevated"
- If a token unlock of >5% of circulating supply is within 7 days → **mandatory flag**: "Token unlock on [date] representing [X]% of supply — selling pressure risk"
- If only 2 out of 5 phases align → **NO_TRADE**, always

---

## SECTION 8: CLAUDE API INTEGRATION

### API Call Structure

```typescript
async function runAnalysis(pair: string, data: MarketDataPayload): Promise<AnalysisOutput> {
  const response = await fetch('/api/analyze', {  // Via Node.js proxy
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pair, data })
  });
  return response.json();
}
```

### Server-Side Proxy (`/server/routes/aiProxy.js`)

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/analyze', async (req, res) => {
  const { pair, data } = req.body;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,  // The 5-phase system prompt defined in Section 3
    messages: [
      {
        role: 'user',
        content: buildAnalysisPrompt(pair, data)  // Structured data payload
      }
    ]
  });

  const rawText = message.content[0].text;
  // Parse and validate the JSON response
  const parsed = JSON.parse(rawText);
  res.json(parsed);
});
```

### Data Payload Builder

```typescript
function buildAnalysisPrompt(pair: string, data: MarketDataPayload): string {
  return `
Analyze ${pair} using the 5-phase framework. Here is the complete data payload:

## MARKET DATA
Current Price: ${data.price}
24h Change: ${data.priceChange24h}%
24h Volume: $${data.volume24h}

## DERIVATIVES
Funding Rate: ${data.fundingRate}% (${data.fundingRateStatus})
Open Interest: $${data.openInterest} (${data.oiChange24h}% 24h change)
Long/Short Ratio: ${data.longShortRatio}
Estimated liquidation cluster: ${data.liquidationLevels}

## MACRO & SENTIMENT
DXY: ${data.dxy} (${data.dxyTrend})
Interest Rate Expectation: ${data.interestRateExpectation}
Global Liquidity: ${data.globalLiquidityTrend}
BTC Dominance: ${data.btcDominance}%
Total Market Cap: $${data.totalMarketCap}
Fear & Greed Index: ${data.fearGreedIndex} (${data.fearGreedLabel})
Dominant Narrative: ${data.dominantNarrative}
Asset Narrative Tags: ${data.assetNarrativeTags.join(', ')}
Social Sentiment: ${data.socialSentimentScore}/100
Recent News: ${JSON.stringify(data.recentNewsHeadlines)}

## ON-CHAIN METRICS
Exchange Net Flow (24h): ${data.exchangeNetFlow} coins (${data.exchangeNetFlow > 0 ? 'inflow - bearish' : 'outflow - bullish'})
Exchange Reserves Trend: ${data.exchangeReservesTrend}
Whale Behavior: ${data.whaleBehavior}
MVRV Ratio: ${data.mvrv}
SOPR: ${data.sopr}
${data.etfNetFlow24h ? `Spot ETF Net Flow (24h): $${data.etfNetFlow24h}M` : ''}
${data.tokenUnlockWarning ? `TOKEN UNLOCK WARNING: ${JSON.stringify(data.tokenUnlockWarning)}` : 'No token unlock risk'}

## MULTI-TIMEFRAME TECHNICAL DATA
${JSON.stringify(data.technicalByTimeframe, null, 2)}

## VOLUME PROFILE
POC: $${data.volumeProfile.poc}
VAH: $${data.volumeProfile.vah}
VAL: $${data.volumeProfile.val}
HVNs: ${data.volumeProfile.hvns.join(', ')}

## MARKET STRUCTURE (LTF)
Recent BOS/CHOCH events: ${JSON.stringify(data.structureEvents)}
Fair Value Gaps: ${JSON.stringify(data.fvgZones)}
Order Blocks: ${JSON.stringify(data.orderBlocks)}
Recent Liquidity Sweeps: ${JSON.stringify(data.liquiditySweeps)}

## MTF CONFLUENCE SCORE
${data.mtfConfluenceScore} (range: -1.0 bearish to +1.0 bullish)

## FIBONACCI LEVELS
${JSON.stringify(data.fibonacciLevels)}

Run the 5-phase analysis and return ONLY a valid JSON object matching the AnalysisOutput schema. No prose outside the JSON.
  `;
}
```

### Expected Claude Output Schema

```typescript
interface AnalysisOutput {
  pair: string;
  timestamp: string;
  
  // Phase outputs
  phase1: { macroBias: string; reasoning: string; keyFactors: string[] };
  phase2: { fundamentalBias: string; reasoning: string; risks: string[] };
  phase3: { htfBias: string; dominantTrend: string; keyLevels: HTFLevel[]; reasoning: string };
  phase4: { ltfBias: string; recentBOS: string | null; recentCHOCH: string | null; entryTrigger: string; reasoning: string };
  phase5: {
    alignmentCheck: string;
    contradictions: string[];
    mtfConfluenceScore: number;
  };
  
  // Final signal
  bias: 'LONG' | 'SHORT' | 'NO_TRADE';
  setup: string;
  entry: number | [number, number];  // price or range
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3?: number;
  riskReward: number;
  probability: number;
  confidence: number;               // 0–100
  confidenceRating: number;         // 1–10
  holdingTime: 'scalp' | 'intraday' | 'swing';
  invalidation: number;
  whyThisTrade: {
    macro: string;
    onChain: string;
    htfTech: string;
    ltfTech: string;
    sentiment: string;
  };
  cancellationConditions: string[];
  finalVerdict: 'EXECUTE' | 'WATCH' | 'NO_TRADE';
  bestTradeNow: string;
  noTradeReason?: string;           // populated if NO_TRADE
  noTradeWaitFor?: string[];        // what conditions would change this
}
```

---

## SECTION 9: PERFORMANCE TRACKING & FEEDBACK LOOP

Every generated signal must be persisted and tracked:

```typescript
interface SignalRecord {
  id: string;
  timestamp: string;
  pair: string;
  signal: AnalysisOutput;
  outcome?: 'tp1_hit' | 'tp2_hit' | 'tp3_hit' | 'sl_hit' | 'cancelled' | 'open';
  outcomePrice?: number;
  outcomeTimestamp?: string;
  actualRR?: number;
  notes?: string;
}
```

**Performance Metrics to Display:**
- Total signals generated
- Win rate (TP1+ hit / total closed)
- Average R:R achieved
- Average confidence score vs win rate correlation
- Win rate by asset, by holding time, by macro regime
- NO_TRADE rate (healthy — a bot that never says NO_TRADE is broken)
- Model accuracy over rolling 30 days

---

## SECTION 10: COMMON SENSE RULES (MUST ENFORCE)

These are non-negotiable judgment rules. Hard-code them into the `confluenceScorer` and `signalValidator`:

1. **Never force a trade.** If confluence is below threshold, the output is NO_TRADE. Always.
2. **The trend is your only ally.** Never signal against a clear 1D + 1W trend without exceptional confluence from ALL other phases.
3. **Funding rate overheated = crowded trade.** Flag it every time. Never ignore it.
4. **News events within 12 hours = reduce confidence by 15 points.** Price behavior around news is unpredictable — acknowledge it.
5. **Token unlocks are not optional data.** If a >3% circulating supply unlock is within 14 days, it must appear in the report.
6. **NO_TRADE is a valid signal.** Display it with the same visual prominence as LONG/SHORT — not as an error or failure state.
7. **The bot must not hallucinate prices.** If live data fetch fails for a required metric, display a clear data warning in the UI and reduce confidence score by 10 points per missing critical metric.
8. **Minimum data before analysis:** The bot must refuse to run analysis if fewer than 3 timeframes of OHLCV data are available, or if both on-chain AND macro data are unavailable simultaneously.

---

## SECTION 11: ERROR HANDLING & RESILIENCE

- All API calls must have **retry logic** (3 retries with exponential backoff)
- If a data source is unavailable, show a warning badge next to that data point in the UI — do not silently ignore it
- Claude API timeouts: show a "Analysis taking longer than expected..." message after 15 seconds; abort and retry after 30 seconds
- Rate limit handling: queue multiple analysis requests, never spam the API
- All errors must be caught, logged, and displayed to the user in plain language — never a raw error message

---

## SECTION 12: LAUNCH CHECKLIST

Before the application is considered complete, verify all of the following:

- [ ] All 5 analysis phases run sequentially and display progress in real time
- [ ] Chart renders with auto-detected FVG, OB, BOS, CHOCH markers
- [ ] Funding rate overheated warning appears in signal report when applicable
- [ ] Token unlock warning appears when unlock is within 14 days
- [ ] NO_TRADE renders with the same visual quality as a LONG/SHORT signal
- [ ] Signal is rejected by validator if R:R < 1:2
- [ ] Signal confidence < 55 auto-downgrades to NO_TRADE
- [ ] All API keys are stored in `.env` and never exposed to the frontend
- [ ] Signal history persists across sessions
- [ ] Performance stats update when signal outcomes are marked
- [ ] Settings page allows API key configuration
- [ ] App works on mobile screens (responsive layout)
- [ ] App works without Telegram — no Telegram dependency anywhere

---

*End of Master Build Instruction*
*Version 1.0 — Crypto Signal Intelligence System*
