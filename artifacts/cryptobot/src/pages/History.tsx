import { useState, useEffect } from 'react';
import type { SignalRecord } from '../types/signal.types';
import { SignalHistory } from '../components/history/SignalHistory';
import { PerformanceStats } from '../components/history/PerformanceStats';

export function History() {
  const [records, setRecords] = useState<SignalRecord[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cryptobot-history') || '[]');
    setRecords(data);
  }, []);

  const handleUpdateOutcome = (id: string, outcome: SignalRecord['outcome']) => {
    const updated = records.map(r => r.id === id ? { ...r, outcome } : r);
    setRecords(updated);
    localStorage.setItem('cryptobot-history', JSON.stringify(updated));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="font-heading text-lg text-text-primary uppercase tracking-wider">Signal History</h1>
      <PerformanceStats records={records} />
      <SignalHistory records={records} onUpdateOutcome={handleUpdateOutcome} />
    </div>
  );
}
