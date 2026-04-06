import { useQuery } from '@tanstack/react-query';
import { fetchOnChainMetrics } from '../api/onChain';
import type { OnChainMetrics } from '../types/market.types';

export function useOnChainData(symbol: string) {
  return useQuery<OnChainMetrics, Error>({
    queryKey: ['on-chain', symbol],
    queryFn: () => fetchOnChainMetrics(symbol),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: Boolean(symbol),
  });
}

export function useOnChainSignal(symbol: string): 'bullish' | 'bearish' | 'neutral' {
  const { data } = useOnChainData(symbol);
  if (!data) return 'neutral';

  let score = 0;

  if (data.exchangeNetFlow < 0) score += 1;
  else if (data.exchangeNetFlow > 0) score -= 1;

  if (data.exchangeReservesTrend === 'falling') score += 1;
  else if (data.exchangeReservesTrend === 'rising') score -= 1;

  if (data.mvrv < 1.5) score += 1;
  else if (data.mvrv > 3.5) score -= 2;

  if (data.sopr != null) {
    if (data.sopr >= 1.0) score += 1;
    else score -= 1;
  }

  if (data.whaleBehavior === 'accumulating') score += 2;
  else if (data.whaleBehavior === 'distributing') score -= 2;

  if (data.etfNetFlow24h != null) {
    if (data.etfNetFlow24h > 0) score += 1;
    else if (data.etfNetFlow24h < 0) score -= 1;
  }

  if (score >= 2) return 'bullish';
  if (score <= -2) return 'bearish';
  return 'neutral';
}
