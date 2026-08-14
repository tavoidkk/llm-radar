export interface AaHealthStatus {
  ok: boolean;
  lastFetchAt: string | null;
  aaModels: number;
  matched: number;
  unmatched: number;
  consecutiveFailures: number;
  lastError: string | null;
}

export const aaHealth: AaHealthStatus = {
  ok: false,
  lastFetchAt: null,
  aaModels: 0,
  matched: 0,
  unmatched: 0,
  consecutiveFailures: 0,
  lastError: null,
};

export function recordAaSuccess(aaModels: number, matched: number, unmatched: number): void {
  aaHealth.ok = true;
  aaHealth.lastFetchAt = new Date().toISOString();
  aaHealth.aaModels = aaModels;
  aaHealth.matched = matched;
  aaHealth.unmatched = unmatched;
  aaHealth.consecutiveFailures = 0;
  aaHealth.lastError = null;
}

export function recordAaFailure(error: string): void {
  aaHealth.ok = false;
  aaHealth.consecutiveFailures += 1;
  aaHealth.lastError = error;
}