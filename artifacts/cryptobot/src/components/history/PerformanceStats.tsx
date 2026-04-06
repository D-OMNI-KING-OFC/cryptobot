import type { SignalRecord } from '../../types/signal.types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PerformanceStatsProps {
  records: SignalRecord[];
}

export function PerformanceStats({ records }: PerformanceStatsProps) {
  const closed = records.filter(r => r.outcome && r.outcome !== 'open' && r.outcome !== 'cancelled');
  const wins = closed.filter(r => r.outcome === 'tp1_hit' || r.outcome === 'tp2_hit' || r.outcome === 'tp3_hit');
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const avgConf = records.length > 0 ? records.reduce((s, r) => s + r.signal.confidence, 0) / records.length : 0;
  const avgRR = records.length > 0 ? records.reduce((s, r) => s + r.signal.riskReward, 0) / records.length : 0;
  const noTradeRate = records.length > 0 ? (records.filter(r => r.signal.bias === 'NO_TRADE').length / records.length) * 100 : 0;

  const stats = [
    { label: 'Total Signals', value: records.length.toString(), color: '#00e5ff' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRate >= 60 ? '#00ff9d' : winRate >= 40 ? '#ffe600' : '#ff2d55' },
    { label: 'Avg R:R', value: `1:${avgRR.toFixed(2)}`, color: avgRR >= 2 ? '#00ff9d' : '#ffe600' },
    { label: 'Avg Confidence', value: `${avgConf.toFixed(0)}%`, color: avgConf >= 65 ? '#00ff9d' : '#ffe600' },
    { label: 'NO TRADE Rate', value: `${noTradeRate.toFixed(0)}%`, color: '#b24bff' },
  ];

  const pairWinData = Object.entries(
    records.reduce((acc, r) => {
      const sym = r.pair;
      if (!acc[sym]) acc[sym] = { total: 0, wins: 0 };
      acc[sym].total++;
      if (r.outcome === 'tp1_hit' || r.outcome === 'tp2_hit' || r.outcome === 'tp3_hit') acc[sym].wins++;
      return acc;
    }, {} as Record<string, { total: number; wins: number }>)
  ).map(([pair, d]) => ({ pair, winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0 }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-text-secondary font-body text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {pairWinData.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-3">Win Rate by Asset</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pairWinData}>
              <XAxis dataKey="pair" tick={{ fontSize: 10, fill: 'rgba(200,230,255,0.5)', fontFamily: 'Share Tech Mono' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(200,230,255,0.5)' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0d1117', border: '1px solid rgba(0,200,255,0.12)', borderRadius: 8, fontFamily: 'Share Tech Mono', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, 'Win Rate']}
              />
              <Bar dataKey="winRate" fill="#00ff9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
