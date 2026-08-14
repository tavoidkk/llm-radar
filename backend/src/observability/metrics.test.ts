import { describe, it, expect } from 'vitest';
import { renderMetrics, observeHttpLatency, incWsConnections, incWsRejected, resetMetrics, latencyBuckets } from './metrics.js';

describe('metrics module', () => {
  it('renders empty when no observations recorded', () => {
    resetMetrics();
    const out = renderMetrics();
    expect(out).toBe('');
  });

  it('records and renders counter increments', () => {
    resetMetrics();
    incWsConnections();
    incWsConnections();
    incWsConnections();
    const out = renderMetrics();
    expect(out).toContain('radar_ws_connections_total');
    expect(out).toMatch(/radar_ws_connections_total\s+3/);
  });

  it('labels rejected connections by reason', () => {
    resetMetrics();
    incWsRejected('origin-not-allowed');
    incWsRejected('origin-not-allowed');
    incWsRejected('no-origin-header');
    const out = renderMetrics();
    expect(out).toContain('origin-not-allowed');
    expect(out).toContain('no-origin-header');
  });

  it('builds histogram buckets in order', () => {
    resetMetrics();
    observeHttpLatency('GET', '/healthz', 200, 3);
    observeHttpLatency('GET', '/healthz', 200, 12);
    observeHttpLatency('GET', '/healthz', 200, 80);
    observeHttpLatency('GET', '/healthz', 200, 999);
    const out = renderMetrics();
    expect(out).toContain('radar_http_request_duration_ms_bucket{le="5"}');
    expect(out).toContain('radar_http_request_duration_ms_bucket{le="10"}');
    expect(out).toContain('radar_http_request_duration_ms_bucket{le="100"}');
    expect(out).toContain('radar_http_request_duration_ms_bucket{le="1000"}');
    expect(out).toContain('radar_http_request_duration_ms_bucket{le="+Inf"}');
  });

  it('tracks slow requests exceeding 150ms (RNF-4.1)', () => {
    resetMetrics();
    observeHttpLatency('GET', '/healthz', 200, 50);
    observeHttpLatency('GET', '/healthz', 200, 200);
    observeHttpLatency('GET', '/healthz', 200, 350);
    const out = renderMetrics();
    expect(out).toContain('radar_http_slow_requests_total');
    expect(out).toMatch(/radar_http_slow_requests_total.*\b2\b/);
  });

  it('uses expected latency buckets', () => {
    expect(latencyBuckets).toContain(150);
    expect(latencyBuckets).toContain(1000);
    expect(latencyBuckets.length).toBeGreaterThanOrEqual(8);
  });
});