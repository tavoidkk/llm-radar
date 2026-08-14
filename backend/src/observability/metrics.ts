interface CounterState {
  value: number;
}

interface HistogramBucket {
  le: number;
  count: number;
}

class HistogramState {
  buckets: HistogramBucket[];
  count = 0;
  sum = 0;
  infCount = 0;

  constructor(public readonly name: string, bounds: number[]) {
    this.buckets = bounds.map((le) => ({ le, count: 0 }));
  }

  observe(v: number): void {
    this.count++;
    this.sum += v;
    if (Number.isFinite(v)) {
      for (const b of this.buckets) {
        if (v <= b.le) b.count++;
      }
    } else {
      this.infCount++;
    }
  }

  render(): string {
    let out = `# HELP ${this.name} ${this.name}\n# TYPE ${this.name} histogram\n`;
    let cumulative = 0;
    for (const b of this.buckets) {
      cumulative = b.count;
      out += `${this.name}_bucket{le="${b.le}"} ${cumulative}\n`;
    }
    out += `${this.name}_bucket{le="+Inf"} ${this.count}\n`;
    out += `${this.name}_sum ${this.sum}\n`;
    out += `${this.name}_count ${this.count}\n`;
    return out;
  }
}

class Counter {
  constructor(public readonly name: string, public readonly help: string) {}
  private state: CounterState = { value: 0 };

  inc(by = 1): void {
    this.state.value += by;
  }

  get value(): number {
    return this.state.value;
  }

  render(): string {
    return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} counter\n${this.name} ${this.state.value}\n`;
  }
}

class Gauge {
  constructor(public readonly name: string, public readonly help: string) {}
  private state = 0;

  set(v: number): void {
    this.state = v;
  }

  get value(): number {
    return this.state;
  }

  render(): string {
    return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} gauge\n${this.name} ${this.state}\n`;
  }
}

const counters = new Map<string, Counter>();
const histograms = new Map<string, HistogramState>();
const gauges = new Map<string, Gauge>();

function getOrCreateCounter(name: string, help: string): Counter {
  let c = counters.get(name);
  if (!c) {
    c = new Counter(name, help);
    counters.set(name, c);
  }
  return c;
}

function getOrCreateHistogram(name: string, buckets: number[]): HistogramState {
  let h = histograms.get(name);
  if (!h) {
    h = new HistogramState(name, buckets);
    histograms.set(name, h);
  }
  return h;
}

function getOrCreateGauge(name: string, help: string): Gauge {
  let g = gauges.get(name);
  if (!g) {
    g = new Gauge(name, help);
    gauges.set(name, g);
  }
  return g;
}

export const latencyBuckets = [5, 10, 25, 50, 75, 100, 150, 250, 500, 1000];

export function observeHttpLatency(method: string, path: string, status: number, durationMs: number): void {
  const hist = getOrCreateHistogram('radar_http_request_duration_ms', latencyBuckets);
  hist.observe(durationMs);
  getOrCreateCounter(`radar_http_requests_total{method="${method}",path="${path}",status="${status}"}`, 'Total HTTP requests').inc();
  if (durationMs > 150) {
    getOrCreateCounter(`radar_http_slow_requests_total{method="${method}",path="${path}"}`, 'Requests exceeding 150ms (RNF-4.1)').inc();
  }
}

export function incWsConnections(): void {
  getOrCreateCounter('radar_ws_connections_total', 'Total WS connections accepted').inc();
}

export function incWsRejected(reason: string): void {
  getOrCreateCounter(`radar_ws_rejected_total{reason="${reason}"}`, 'Total WS rejected by Origin guard').inc();
}

export function setCacheSize(n: number): void {
  getOrCreateGauge('radar_cache_size', 'Metrics in memory cache').set(n);
}

export function incBatcherInserted(rows: number): void {
  getOrCreateCounter('radar_batcher_inserted_rows_total', 'Rows inserted by batcher').inc(rows);
}

export function incPollSuccess(n = 1): void {
  getOrCreateCounter('radar_poll_success_total', 'Successful polls').inc(n);
}

export function incPollFailure(reason: string): void {
  getOrCreateCounter(`radar_poll_failure_total{reason="${reason}"}`, 'Failed polls').inc();
}

export function setAaModels(n: number): void {
  getOrCreateGauge('radar_aa_models_total', 'Models returned by Artificial Analysis').set(n);
}

export function setAaMatched(n: number): void {
  getOrCreateGauge('radar_aa_matched_total', 'OpenRouter models matched to AA benchmarks').set(n);
}

export function setAaLastOkAt(ts: number): void {
  getOrCreateGauge('radar_aa_last_ok_timestamp', 'Last successful AA fetch (epoch ms)').set(ts);
}

export function setAaFailures(n: number): void {
  getOrCreateGauge('radar_aa_failures_total', 'Consecutive AA fetch failures').set(n);
}

export function renderMetrics(): string {
  const out: string[] = [];
  for (const c of counters.values()) out.push(c.render());
  for (const h of histograms.values()) out.push(h.render());
  for (const g of gauges.values()) out.push(g.render());
  return out.join('\n');
}

export function resetMetrics(): void {
  counters.clear();
  histograms.clear();
  gauges.clear();
}