import { useState, useEffect } from 'react';
import { TrendingUp, Clock } from 'lucide-react';

export function TopBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <TrendingUp className="text-accent w-4 h-4" />
        <span className="font-heading text-accent text-sm tracking-widest uppercase">
          Signal Intelligence
        </span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary font-mono text-xs">
        <Clock className="w-3 h-3" />
        <span>{time.toUTCString().slice(17, 25)} UTC</span>
      </div>
    </header>
  );
}
