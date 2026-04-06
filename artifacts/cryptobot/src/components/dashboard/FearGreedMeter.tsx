import { useMarketStore } from '../../store/useMarketStore';
import { getFearGreedColor, getFearGreedLabel } from '../../utils/formatters';

export function FearGreedMeter() {
  const { macroData } = useMarketStore();
  const value = macroData?.fearGreedIndex || 50;
  const label = macroData?.fearGreedLabel || getFearGreedLabel(value);
  const color = getFearGreedColor(value);

  const rotation = (value / 100) * 180 - 90;
  const r = 60;
  const cx = 80, cy = 80;

  const describeArc = (startAngle: number, endAngle: number, color: string) => {
    const rad = (angle: number) => (angle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startAngle - 90));
    const y1 = cy + r * Math.sin(rad(startAngle - 90));
    const x2 = cx + r * Math.cos(rad(endAngle - 90));
    const y2 = cy + r * Math.sin(rad(endAngle - 90));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-text-secondary font-body text-xs uppercase tracking-wider mb-2">Fear & Greed Index</div>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 160 100" className="w-full max-w-[180px]">
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="rgba(0,200,255,0.08)" strokeWidth="12" fill="none" />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${(value / 100) * Math.PI * r} ${Math.PI * r}`}
            strokeLinecap="round"
            opacity="0.9"
          />
          <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
            <line x1={cx} y1={cy} x2={cx} y2={cy - r + 8} stroke="white" strokeWidth="2" strokeLinecap="round" />
          </g>
          <text x={cx} y={cy + 16} textAnchor="middle" fill={color} fontSize="22" fontFamily="Share Tech Mono" fontWeight="bold">
            {value}
          </text>
        </svg>
        <div style={{ color }} className="font-mono text-sm font-bold mt-1">{label}</div>
        <div className="flex justify-between w-full max-w-[180px] mt-1">
          <span className="text-bearish font-mono text-xs">Fear</span>
          <span className="text-bullish font-mono text-xs">Greed</span>
        </div>
      </div>
    </div>
  );
}
