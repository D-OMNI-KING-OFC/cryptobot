import { useSettingsStore } from '../store/useSettingsStore';

export function Settings() {
  const {
    minConfidenceThreshold, setMinConfidenceThreshold,
    maxSlPercent, setMaxSlPercent,
    minRR, setMinRR,
    enableFundingRatePenalty, setEnableFundingRatePenalty,
    fundingRatePenaltyThreshold, setFundingRatePenaltyThreshold,
    enableTokenUnlockWarning, setEnableTokenUnlockWarning,
    tokenUnlockDaysThreshold, setTokenUnlockDaysThreshold,
    enableCHOCHRequirement, setEnableCHOCHRequirement,
    enableFearGreedPenalty, setEnableFearGreedPenalty,
    dataRefreshInterval, setDataRefreshInterval,
    resetToDefaults,
  } = useSettingsStore();

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-lg text-text-primary uppercase tracking-wider">Settings</h1>
        <button
          onClick={() => {
            if (confirm('Reset all settings to defaults? This will overwrite all custom parameters.')) {
              resetToDefaults();
            }
          }}
          className="px-3 py-1 bg-info/10 border border-info/30 text-info font-mono text-xs rounded-lg hover:bg-info/20 transition-colors"
        >
          ↻ Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="font-heading text-xs text-text-secondary uppercase tracking-wider">Risk Management</div>

          <div className="space-y-1">
            <label className="flex justify-between text-text-secondary font-mono text-xs">
              <span>Minimum Confidence Threshold</span>
              <span className="text-accent">{minConfidenceThreshold}%</span>
            </label>
            <input
              type="range" min={40} max={90} step={5}
              value={minConfidenceThreshold}
              onChange={e => setMinConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-text-secondary font-mono text-xs">
              <span>40% (loose)</span><span>90% (strict)</span>
            </div>
            <p className="text-xs text-text-secondary pt-1">Signals below this confidence auto-convert to NO_TRADE</p>
          </div>

          <div className="space-y-1">
            <label className="flex justify-between text-text-secondary font-mono text-xs">
              <span>Max Stop Loss %</span>
              <span className="text-accent">{maxSlPercent}%</span>
            </label>
            <input
              type="range" min={2} max={15} step={1}
              value={maxSlPercent}
              onChange={e => setMaxSlPercent(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-text-secondary pt-1">Signals with wider stops are rejected</p>
          </div>

          <div className="space-y-1">
            <label className="flex justify-between text-text-secondary font-mono text-xs">
              <span>Minimum Risk:Reward Ratio</span>
              <span className="text-accent">1:{minRR.toFixed(1)}</span>
            </label>
            <input
              type="range" min={1.5} max={5} step={0.5}
              value={minRR}
              onChange={e => setMinRR(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-text-secondary pt-1">Signals below 1:{minRR.toFixed(1)} R:R are rejected</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="font-heading text-xs text-text-secondary uppercase tracking-wider">Analysis Rule Penalties</div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-text-secondary font-mono text-xs">
                Enable Funding Rate Penalty
              </label>
              <button
                onClick={() => setEnableFundingRatePenalty(!enableFundingRatePenalty)}
                className={`px-3 py-1 outline-none rounded font-mono text-xs transition-colors ${
                  enableFundingRatePenalty 
                    ? 'bg-bullish/20 border border-bullish text-bullish' 
                    : 'bg-bearish/10 border border-bearish/30 text-bearish'
                }`}
              >
                {enableFundingRatePenalty ? 'ON' : 'OFF'}
              </button>
            </div>
            {enableFundingRatePenalty && (
              <div className="ml-2">
                <label className="flex justify-between text-text-secondary font-mono text-xs">
                  <span>Threshold: {fundingRatePenaltyThreshold.toFixed(3)}%</span>
                </label>
                <input
                  type="range" min={0.05} max={0.3} step={0.05}
                  value={fundingRatePenaltyThreshold}
                  onChange={e => setFundingRatePenaltyThreshold(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <p className="text-xs text-text-secondary pt-1">-20 confidence if funding rate &gt; threshold AND DXY rising</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-text-secondary font-mono text-xs">
                Enable Token Unlock Warning
              </label>
              <button
                onClick={() => setEnableTokenUnlockWarning(!enableTokenUnlockWarning)}
                className={`px-3 py-1 outline-none rounded font-mono text-xs transition-colors ${
                  enableTokenUnlockWarning 
                    ? 'bg-bullish/20 border border-bullish text-bullish' 
                    : 'bg-bearish/10 border border-bearish/30 text-bearish'
                }`}
              >
                {enableTokenUnlockWarning ? 'ON' : 'OFF'}
              </button>
            </div>
            {enableTokenUnlockWarning && (
              <div className="ml-2">
                <label className="flex justify-between text-text-secondary font-mono text-xs">
                  <span>Days threshold: {tokenUnlockDaysThreshold}</span>
                </label>
                <input
                  type="range" min={3} max={30} step={1}
                  value={tokenUnlockDaysThreshold}
                  onChange={e => setTokenUnlockDaysThreshold(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <p className="text-xs text-text-secondary pt-1">-15 confidence if unlock within this many days</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-text-secondary font-mono text-xs">
              Require CHOCH Confirmation on LTF
            </label>
            <button
              onClick={() => setEnableCHOCHRequirement(!enableCHOCHRequirement)}
              className={`px-3 py-1 outline-none rounded font-mono text-xs transition-colors ${
                enableCHOCHRequirement 
                  ? 'bg-bullish/20 border border-bullish text-bullish' 
                  : 'bg-bearish/10 border border-bearish/30 text-bearish'
              }`}
            >
              {enableCHOCHRequirement ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-text-secondary font-mono text-xs">
              Enable Fear &amp; Greed Penalty
            </label>
            <button
              onClick={() => setEnableFearGreedPenalty(!enableFearGreedPenalty)}
              className={`px-3 py-1 outline-none rounded font-mono text-xs transition-colors ${
                enableFearGreedPenalty 
                  ? 'bg-bullish/20 border border-bullish text-bullish' 
                  : 'bg-bearish/10 border border-bearish/30 text-bearish'
              }`}
            >
              {enableFearGreedPenalty ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
          <div className="font-heading text-xs text-text-secondary uppercase tracking-wider">Data Configuration</div>

          <div className="space-y-1">
            <label className="flex justify-between text-text-secondary font-mono text-xs">
              <span>Data Refresh Interval</span>
              <span className="text-accent">{dataRefreshInterval / 1000}s</span>
            </label>
            <input
              type="range" min={30000} max={300000} step={30000}
              value={dataRefreshInterval}
              onChange={e => setDataRefreshInterval(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-text-secondary pt-1">How often to poll market data</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-1">API Key Status</div>
          {[
            { name: 'Anthropic (Claude AI)', status: 'Server-side — configured ✓' },
            { name: 'CoinGecko (Market Data)', status: 'Server-side — configured ✓' },
            { name: 'FRED (DXY / Rates)', status: 'Server-side — configured ✓' },
            { name: 'Santiment Sanbase (Sentiment & On-Chain)', status: 'Server-side — configured ✓' },
            { name: 'Alternative.me (Fear & Greed)', status: 'Public API — no key needed ✓' },
            { name: 'Binance (Price & Derivatives)', status: 'Public API — no key needed ✓' },
            { name: 'Cryptopanic (News Feed)', status: 'Public API — no key needed ✓' },
          ].map(({ name, status }) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-text-primary font-body text-sm">{name}</span>
              <span className="text-bullish font-mono text-xs">{status}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="font-heading text-xs text-text-secondary uppercase tracking-wider mb-3">Danger Zone</div>
          <button
            onClick={() => {
              if (confirm('Clear all signal history? This cannot be undone.')) {
                localStorage.removeItem('cryptobot-history');
              }
            }}
            className="px-4 py-2 bg-bearish/10 border border-bearish/30 text-bearish font-mono text-xs rounded-lg hover:bg-bearish/20 transition-colors"
          >
            Clear Signal History
          </button>
        </div>
      </div>
    </div>
  );
}
