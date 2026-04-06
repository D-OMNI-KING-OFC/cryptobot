import type { OnChainMetrics } from '../types/market.types';

export async function fetchOnChainMetrics(symbol: string): Promise<OnChainMetrics> {
  const res = await fetch(`/api/sanbase/onchain/${symbol.toUpperCase()}`);
  if (!res.ok) throw new Error(`On-chain API error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    exchangeNetFlow: data.exchangeNetFlow ?? 0,
    exchangeReserves: data.exchangeReserves ?? 0,
    exchangeReservesTrend: data.exchangeReservesTrend ?? 'neutral',
    mvrv: data.mvrv ?? 1.0,
    // sopr: null means genuinely unavailable (metric not on this tier), not a fake signal
    sopr: data.sopr !== undefined ? data.sopr : null,
    nvtRatio: data.nvtRatio ?? 60,
    whaleBehavior: data.whaleBehavior ?? 'neutral',
  };
}
