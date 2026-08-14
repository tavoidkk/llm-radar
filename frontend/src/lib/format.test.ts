import { describe, it, expect } from 'vitest';
import { formatUsdPer1M, formatUsdPrecise, formatTokens } from './format';

describe('formatUsdPer1M', () => {
  it('converts per-1k cost to per-1M', () => {
    expect(formatUsdPer1M(0.005)).toBe('$5');
  });
  it('keeps two decimals when needed', () => {
    expect(formatUsdPer1M(0.00125)).toBe('$1.25');
  });
  it('handles zero', () => {
    expect(formatUsdPer1M(0)).toBe('$0');
  });
  it('handles large values with thousands separator', () => {
    expect(formatUsdPer1M(2.5)).toBe('$2,500');
  });
});

describe('formatUsdPrecise', () => {
  it('formats with six decimals', () => {
    expect(formatUsdPrecise(0.001234)).toBe('$0.001234');
  });
});

describe('formatTokens', () => {
  it('formats millions', () => {
    expect(formatTokens(1_000_000)).toBe('1M');
    expect(formatTokens(2_000_000)).toBe('2M');
    expect(formatTokens(1_048_576)).toBe('1.05M');
  });
  it('formats thousands', () => {
    expect(formatTokens(128_000)).toBe('128k');
    expect(formatTokens(200_000)).toBe('200k');
    expect(formatTokens(999)).toBe('999');
  });
  it('leaves small numbers unchanged', () => {
    expect(formatTokens(512)).toBe('512');
  });
});