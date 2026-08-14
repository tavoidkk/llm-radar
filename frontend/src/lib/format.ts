export function formatUsdPer1M(costPer1k: number): string {
  const per1M = costPer1k * 1000;
  const rounded = Number(per1M.toFixed(2));
  return `$${rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function formatUsdPrecise(costPer1k: number): string {
  return `$${Number(costPer1k.toFixed(6))}`;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m === Math.floor(m) ? `${m}M` : `${Number(m.toFixed(2))}M`;
  }
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}