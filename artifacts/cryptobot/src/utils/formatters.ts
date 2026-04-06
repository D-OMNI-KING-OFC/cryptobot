export function formatPrice(price: number, decimals: number = 2): string {
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  } else if (price >= 1) {
    return '$' + price.toFixed(4);
  } else {
    return '$' + price.toFixed(8);
  }
}

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(2) + 'K';
  return '$' + num.toFixed(2);
}

export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDistanceToLevel(currentPrice: number, targetPrice: number): string {
  if (currentPrice <= 0 || targetPrice <= 0) return 'N/A';

  const distance = ((targetPrice - currentPrice) / currentPrice) * 100;
  const absDistance = Math.abs(distance);

  if (absDistance < 1) {
    return formatPercent(distance);
  } else if (absDistance < 10) {
    return `${distance > 0 ? '+' : ''}${distance.toFixed(1)}%`;
  } else {
    return `${distance > 0 ? '+' : ''}${Math.round(distance)}%`;
  }
}

export function formatFundingRate(rate: number): string {
  return (rate * 100).toFixed(4) + '%';
}

export function formatTimestamp(ts: string | number): string {
  const date = new Date(typeof ts === 'number' ? ts : ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function truncateString(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

export function getBiasColor(bias: string): string {
  if (bias.includes('bullish') || bias === 'LONG') return '#00ff9d';
  if (bias.includes('bearish') || bias === 'SHORT') return '#ff2d55';
  return '#00e5ff';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 75) return '#00ff9d';
  if (confidence >= 55) return '#ffe600';
  return '#ff2d55';
}

export function getFearGreedColor(index: number): string {
  if (index <= 25) return '#ff2d55';
  if (index <= 45) return '#ff8c42';
  if (index <= 55) return '#ffe600';
  if (index <= 75) return '#a8e63d';
  return '#00ff9d';
}

export function getFearGreedLabel(index: number): string {
  if (index <= 25) return 'Extreme Fear';
  if (index <= 45) return 'Fear';
  if (index <= 55) return 'Neutral';
  if (index <= 75) return 'Greed';
  return 'Extreme Greed';
}
