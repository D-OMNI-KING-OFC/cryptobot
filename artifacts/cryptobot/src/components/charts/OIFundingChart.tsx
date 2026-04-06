import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface OIFundingChartProps {
  pair: string;
}

interface OIDataPoint {
  timestamp: number;
  oi: number;
  label: string;
}

interface FundingEntry {
  fundingTime: number;
  fundingRate: string;
  symbol: string;
}

interface OIHistEntry {
  timestamp: string;
  sumOpenInterest: string;
  sumOpenInterestValue: string;
}

async function fetchOIHistory(pair: string): Promise<OIDataPoint[]> {
  const symbol = pair.replace('/', '');
  const res = await fetch(`/api/binance/oihistory/${symbol}`);
  if (!res.ok) throw new Error('OI history unavailable');
  const data: OIHistEntry[] = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((d) => {
    const ts = parseInt(d.timestamp);
    const date = new Date(ts);
    const label = `${date.getHours().toString().padStart(2, '0')}:00`;
    return {
      timestamp: ts,
      oi: parseFloat(d.sumOpenInterestValue) / 1e9,
      label,
    };
  });
}

async function fetchFundingHistory(pair: string): Promise<{ time: number; rate: number }[]> {
  const symbol = pair.replace('/', '');
  const res = await fetch(`/api/binance/fundinghistory/${symbol}?limit=8`);
  if (!res.ok) return [];
  const data: FundingEntry[] = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(d => ({ time: d.fundingTime, rate: parseFloat(d.fundingRate) * 100 }));
}

export function OIFundingChart({ pair }: OIFundingChartProps) {
  const { data: oiData, isLoading: oiLoading } = useQuery({
    queryKey: ['oi-history', pair],
    queryFn: () => fetchOIHistory(pair),
    staleTime: 60000,
    retry: 1,
  });

  const { data: fundingData, isLoading: frLoading } = useQuery({
    queryKey: ['funding-history', pair],
    queryFn: () => fetchFundingHistory(pair),
    staleTime: 60000,
    retry: 1,
  });

  const isLoading = oiLoading || frLoading;

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">OI + Funding (24h)</div>
        <div className="animate-pulse space-y-2">
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  const latestFR = fundingData && fundingData.length > 0 ? fundingData[fundingData.length - 1].rate : 0;
  const frStatus = latestFR > 0.1 ? 'overheated_long' : latestFR < -0.1 ? 'overheated_short' : 'neutral';
  const latestOI = oiData && oiData.length > 0 ? oiData[oiData.length - 1].oi : 0;
  const firstOI = oiData && oiData.length > 1 ? oiData[0].oi : latestOI;
  const oiChange = firstOI > 0 ? ((latestOI - firstOI) / firstOI) * 100 : 0;

  const allOI = oiData?.map(d => d.oi) || [0];
  const minOI = Math.min(...allOI);
  const maxOI = Math.max(...allOI);
  const oiRange = maxOI - minOI;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary font-body text-xs uppercase tracking-wider">OI + Funding (24h)</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-text-secondary font-mono text-xs">FR:</span>
            <span className={`font-mono text-xs font-bold ${latestFR > 0 ? 'text-bullish' : latestFR < 0 ? 'text-bearish' : 'text-info'}`}>
              {latestFR >= 0 ? '+' : ''}{latestFR.toFixed(4)}%
            </span>
            {frStatus !== 'neutral' && <AlertTriangle className="w-3 h-3 text-warning" />}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-text-secondary font-mono text-xs">OI:</span>
            <span className="font-mono text-xs text-text-primary">${latestOI.toFixed(2)}B</span>
            {oiChange !== 0 && (
              <span className={`font-mono text-xs ${oiChange > 0 ? 'text-bullish' : 'text-bearish'}`}>
                ({oiChange > 0 ? '+' : ''}{oiChange.toFixed(1)}%)
                {oiChange > 0 ? <TrendingUp className="w-2.5 h-2.5 inline ml-0.5" /> : <TrendingDown className="w-2.5 h-2.5 inline ml-0.5" />}
              </span>
            )}
          </div>
        </div>
      </div>

      {oiData && oiData.length > 1 ? (
        <div className="relative h-20 w-full mt-2">
          <svg width="100%" height="100%" viewBox={`0 0 ${oiData.length - 1} 40`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id="oiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </linearGradient>
            </defs>
            {oiRange > 0 && (() => {
              const points = oiData.map((d, i) => ({
                x: i,
                y: 40 - ((d.oi - minOI) / oiRange) * 38,
              }));
              const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaD = pathD + ` L ${points[points.length - 1].x} 40 L 0 40 Z`;
              return (
                <>
                  <path d={areaD} fill="url(#oiGradient)" />
                  <path d={pathD} fill="none" stroke="rgb(99,102,241)" strokeWidth="0.8" />
                  {points.map((p, i) => (
                    i % Math.max(1, Math.floor(points.length / 6)) === 0 && (
                      <text key={i} x={p.x} y={44} fontSize="3.5" fill="rgba(255,255,255,0.3)" textAnchor="middle">
                        {oiData[i].label}
                      </text>
                    )
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      ) : (
        <div className="h-10 flex items-center justify-center">
          <span className="text-text-secondary font-mono text-xs">OI history unavailable</span>
        </div>
      )}

      {fundingData && fundingData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-text-secondary font-mono text-xs">Recent Funding Rates</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {fundingData.slice(-6).map((fr, i) => (
              <span
                key={i}
                className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                  fr.rate > 0.05 ? 'bg-bullish/20 text-bullish' :
                  fr.rate < -0.05 ? 'bg-bearish/20 text-bearish' :
                  'bg-white/5 text-text-secondary'
                }`}
              >
                {fr.rate >= 0 ? '+' : ''}{fr.rate.toFixed(4)}%
              </span>
            ))}
          </div>
          {frStatus === 'overheated_long' && (
            <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded-lg">
              <span className="font-mono text-xs text-warning">⚠ Funding overheated LONG — crowded trade, squeeze risk</span>
            </div>
          )}
          {frStatus === 'overheated_short' && (
            <div className="mt-2 p-2 bg-info/10 border border-info/30 rounded-lg">
              <span className="font-mono text-xs text-info">⚡ Funding overheated SHORT — potential long squeeze setup</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded-lg p-1.5">
          <div className="font-mono text-xs text-text-secondary">OI Trend</div>
          <div className={`font-mono text-xs font-bold ${oiChange > 2 ? 'text-bullish' : oiChange < -2 ? 'text-bearish' : 'text-info'}`}>
            {oiChange > 2 ? '↑ Rising' : oiChange < -2 ? '↓ Falling' : '→ Flat'}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-1.5">
          <div className="font-mono text-xs text-text-secondary">Funding</div>
          <div className={`font-mono text-xs font-bold ${frStatus === 'overheated_long' ? 'text-warning' : frStatus === 'overheated_short' ? 'text-info' : 'text-bullish'}`}>
            {frStatus === 'overheated_long' ? '⚠ Hot Long' : frStatus === 'overheated_short' ? '⚡ Hot Short' : '✓ Normal'}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-1.5">
          <div className="font-mono text-xs text-text-secondary">Bias</div>
          <div className="flex items-center justify-center gap-1">
            {oiChange > 0 && latestFR > 0 ? (
              <><TrendingUp className="w-3 h-3 text-bullish" /><span className="font-mono text-xs font-bold text-bullish">Bull</span></>
            ) : oiChange < 0 && latestFR < 0 ? (
              <><TrendingDown className="w-3 h-3 text-bearish" /><span className="font-mono text-xs font-bold text-bearish">Bear</span></>
            ) : (
              <><Minus className="w-3 h-3 text-info" /><span className="font-mono text-xs font-bold text-info">Mixed</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
