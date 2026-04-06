export async function fetchDXY(): Promise<{ value: number; trend: 'rising' | 'falling' | 'neutral' }> {
  try {
    const res = await fetch('/api/fred/DTWEXBGS?limit=5');
    if (!res.ok) throw new Error(`FRED DXY error: ${res.status}`);
    const data = await res.json();
    const obs = (data.observations || []).filter((o: { value: string }) => o.value !== '.');
    if (obs.length >= 2) {
      const latest = parseFloat(obs[0].value);
      const prev = parseFloat(obs[1].value);
      if (!isNaN(latest) && !isNaN(prev)) {
        // Validate DXY is in realistic range (historical range: 70-115)
        // If outside this range, it's hallucinated or corrupted data
        if (latest < 70 || latest > 115) {
          console.warn(`DXY value ${latest} outside realistic range [70, 115]. Treating as invalid.`);
          throw new Error('DXY data validation failed: value outside realistic range');
        }
        const trend: 'rising' | 'falling' | 'neutral' =
          latest > prev * 1.001 ? 'rising' : latest < prev * 0.999 ? 'falling' : 'neutral';
        return { value: parseFloat(latest.toFixed(2)), trend };
      }
    }
  } catch (e) {
    console.warn('FRED DXY fetch failed:', e instanceof Error ? e.message : 'Unknown error');
    // Fallback: return neutral placeholder to alert frontend of data unavailability
    return { value: 0, trend: 'neutral' };
  }
  return { value: 0, trend: 'neutral' };
}

export async function fetchInterestRateExpectation(): Promise<'hawkish' | 'neutral' | 'dovish'> {
  try {
    // FRED series DFF = Effective Federal Funds Rate (daily)
    const res = await fetch('/api/fred/DFF?limit=10');
    if (res.ok) {
      const data = await res.json();
      const obs = (data.observations || [])
        .filter((o: { value: string }) => o.value !== '.')
        .map((o: { value: string }) => parseFloat(o.value));

      if (obs.length >= 2) {
        const latest = obs[0];
        const older = obs[obs.length - 1];
        // If rate has risen over recent window → hawkish; fallen → dovish; stable → neutral
        if (latest > older + 0.1) return 'hawkish';
        if (latest < older - 0.1) return 'dovish';
        // If rate is historically high (>= 4%) with no recent cut → hawkish environment
        if (latest >= 4.0) return 'hawkish';
        if (latest < 1.5) return 'dovish';
      }
    }
  } catch (e) {
    console.warn('Interest rate fetch failed:', e instanceof Error ? e.message : 'Unknown error');
  }
  return 'neutral';
}

// Alternative sources for DXY if FRED fails
export async function fetchDXYAlternative(): Promise<{ value: number; trend: 'rising' | 'falling' | 'neutral' } | null> {
  try {
    // Fallback: Yahoo Finance or CoinGecko alternative
    // This is a placeholder for future implementation
    // Could integrate with crypto-specific dollar strength metrics
    console.info('DXY alternative fetch: placeholder');
    return null;
  } catch (e) {
    console.warn('DXY alternative fetch failed');
    return null;
  }
}
