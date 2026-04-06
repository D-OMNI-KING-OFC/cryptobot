import type { AnalysisOutput } from '../types/signal.types';
import type { MarketDataPayload } from '../types/analysis.types';

export async function runAnalysis(pair: string, data: MarketDataPayload): Promise<AnalysisOutput> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pair, data }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}
