export async function fetchDXY(): Promise<{ value: number | null; trend: 'rising' | 'falling' | 'neutral' }> {
  try {
    // Use the server-side /api/dxy endpoint which tries FRED first, then Frankfurter FX as fallback
    const res = await fetch('/api/dxy');
    if (!res.ok) throw new Error(`DXY proxy error: ${res.status}`);
    const data = await res.json();

    // If both sources failed, value will be null
    if (data.value === null || data.value === undefined) {
      console.warn('DXY unavailable from all sources');
      return { value: null, trend: 'neutral' };
    }

    // Validate DXY is in realistic range (historical range: 70-115)
    if (data.value < 70 || data.value > 115) {
      console.warn(`DXY value ${data.value} outside realistic range [70, 115]. Treating as invalid.`);
      return { value: null, trend: 'neutral' };
    }

    return { value: parseFloat(data.value.toFixed(2)), trend: data.trend || 'neutral' };
  } catch (e) {
    console.warn('DXY fetch failed:', e instanceof Error ? e.message : 'Unknown error');
    return { value: null, trend: 'neutral' };
  }
}

export async function fetchInterestRateExpectation(): Promise<'hawkish' | 'neutral' | 'dovish'> {
  try {
    const res = await fetch('/api/fred/DFF?limit=10');
    if (res.ok) {
      const data = await res.json();
      const obs = (data.observations || [])
        .filter((o: { value: string }) => o.value !== '.')
        .map((o: { value: string }) => parseFloat(o.value));

      if (obs.length >= 2) {
        const latest = obs[0];
        const older = obs[obs.length - 1];
        if (latest > older + 0.1) return 'hawkish';
        if (latest < older - 0.1) return 'dovish';
        if (latest >= 4.0) return 'hawkish';
        if (latest < 1.5) return 'dovish';
      }
    }
  } catch (e) {
    console.warn('Interest rate fetch failed:', e instanceof Error ? e.message : 'Unknown error');
  }
  return 'neutral';
}
