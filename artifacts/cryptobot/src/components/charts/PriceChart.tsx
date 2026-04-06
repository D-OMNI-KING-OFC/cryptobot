import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useOHLCV } from '../../hooks/useMarketData';

const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W'];

interface PriceChartProps {
  pair: string;
}

export function PriceChart({ pair }: PriceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState('1H');
  const { data: candles, isLoading } = useOHLCV(pair, timeframe);

  useEffect(() => {
    if (!chartRef.current || !candles || candles.length === 0) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: 'rgba(200,230,255,0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(0,200,255,0.04)' },
        horzLines: { color: 'rgba(0,200,255,0.04)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(0,200,255,0.12)',
      },
      timeScale: {
        borderColor: 'rgba(0,200,255,0.12)',
        timeVisible: true,
      },
      width: chartRef.current.clientWidth,
      height: 350,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00ff9d',
      downColor: '#ff2d55',
      borderUpColor: '#00ff9d',
      borderDownColor: '#ff2d55',
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff2d55',
    });

    const chartData = candles.map(c => ({
      time: Math.floor(c.timestamp / 1000) as unknown as number,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartData as Parameters<typeof candleSeries.setData>[0]);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [candles]);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-heading text-text-primary text-sm">{pair}</span>
        <div className="flex gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded font-mono text-xs transition-colors ${
                tf === timeframe
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartRef} className="w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
            <div className="text-text-secondary font-mono text-sm animate-pulse">Loading chart data...</div>
          </div>
        )}
      </div>
    </div>
  );
}
