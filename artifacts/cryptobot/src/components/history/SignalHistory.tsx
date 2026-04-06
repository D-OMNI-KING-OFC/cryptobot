import { useState } from 'react';
import type { SignalRecord } from '../../types/signal.types';
import { formatPrice, formatRelativeTime, getBiasColor, getConfidenceColor } from '../../utils/formatters';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';

interface SignalHistoryProps {
  records: SignalRecord[];
  onUpdateOutcome: (id: string, outcome: SignalRecord['outcome']) => void;
}

const OUTCOME_OPTIONS: { value: SignalRecord['outcome']; label: string; color: string }[] = [
  { value: 'tp1_hit', label: 'TP1 Hit', color: '#00ff9d' },
  { value: 'tp2_hit', label: 'TP2 Hit', color: '#00ff9d' },
  { value: 'tp3_hit', label: 'TP3 Hit', color: '#00ff9d' },
  { value: 'sl_hit', label: 'SL Hit', color: '#ff2d55' },
  { value: 'cancelled', label: 'Cancelled', color: '#ffe600' },
  { value: 'open', label: 'Still Open', color: '#00e5ff' },
];

export function SignalHistory({ records, onUpdateOutcome }: SignalHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const exportCSV = () => {
    const headers = ['Date', 'Pair', 'Bias', 'Entry', 'SL', 'TP1', 'TP2', 'Confidence', 'R:R', 'Outcome'];
    const rows = records.map(r => [
      r.timestamp,
      r.pair,
      r.signal.bias,
      Array.isArray(r.signal.entry) ? r.signal.entry[0] : r.signal.entry,
      r.signal.stopLoss,
      r.signal.tp1,
      r.signal.tp2,
      r.signal.confidence,
      r.signal.riskReward,
      r.outcome || 'open',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cryptobot_signals.csv'; a.click();
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary font-body">
        <div className="text-4xl mb-4">📊</div>
        <div className="font-heading text-lg mb-2">No Signals Yet</div>
        <p className="text-sm">Run your first analysis on the Analyze page to generate signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-2">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-border rounded-lg text-text-secondary font-mono text-xs hover:bg-white/10 transition-colors"
        >
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>
      {records.map(record => (
        <div key={record.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          <div
            className="flex items-center gap-4 p-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === record.id ? null : record.id)}
          >
            <div className="shrink-0">
              {expanded === record.id ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
            </div>
            <div className="font-mono text-xs text-text-secondary w-24 shrink-0">{formatRelativeTime(record.timestamp)}</div>
            <div className="font-heading text-sm text-text-primary w-24 shrink-0">{record.pair}</div>
            <div className="font-mono text-sm font-bold w-16 shrink-0" style={{ color: getBiasColor(record.signal.bias) }}>
              {record.signal.bias}
            </div>
            <div className="font-mono text-xs text-text-secondary hidden md:block w-24 shrink-0">
              {formatPrice(Array.isArray(record.signal.entry) ? record.signal.entry[0] : record.signal.entry)}
            </div>
            <div className="font-mono text-xs w-12 shrink-0" style={{ color: getConfidenceColor(record.signal.confidence) }}>
              {record.signal.confidence}%
            </div>
            <div className="flex-1 flex justify-end">
              <select
                value={record.outcome || 'open'}
                onChange={e => { e.stopPropagation(); onUpdateOutcome(record.id, e.target.value as SignalRecord['outcome']); }}
                onClick={e => e.stopPropagation()}
                className="bg-white/5 border border-border rounded px-2 py-1 font-mono text-xs text-text-primary hover:bg-white/10 cursor-pointer"
                style={{ color: OUTCOME_OPTIONS.find(o => o.value === (record.outcome || 'open'))?.color }}
              >
                {OUTCOME_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ color: o.color }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {expanded === record.id && (
            <div className="border-t border-border p-3 bg-background/50 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div><div className="text-text-secondary">Stop Loss</div><div className="text-bearish">{formatPrice(record.signal.stopLoss)}</div></div>
              <div><div className="text-text-secondary">Take Profit 1</div><div className="text-bullish">{formatPrice(record.signal.tp1)}</div></div>
              <div><div className="text-text-secondary">Take Profit 2</div><div className="text-bullish">{formatPrice(record.signal.tp2)}</div></div>
              <div><div className="text-text-secondary">Risk/Reward</div><div className="text-info">1:{record.signal.riskReward.toFixed(2)}</div></div>
              <div className="col-span-2 md:col-span-4"><div className="text-text-secondary mb-1">Setup</div><div className="text-text-primary font-body">{record.signal.setup}</div></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
