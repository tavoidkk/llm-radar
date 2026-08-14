# Changelog

Todas las novedades de **LLM Radar** se documentan aquí. El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-13

### Added
- **Semana 1 / Paso 1 — Cimientos**
  - Monorepo pnpm (`@llm-radar/types`, `backend`, `frontend`)
  - SQL migrations: `models`, `metrics` (índice compuesto `(model_id, timestamp DESC)`), vista `v_latest_metrics`
  - Cliente Supabase tipado con `Database` autogenerable (`pnpm db:types`)
  - Env validado con Zod (`SUPABASE_*`, `OPENROUTER_API_KEY`, `PORT`, …)
  - Tipos compartidos `AiModel`, `MetricPayload`, `RadarEvent`, `HistoryPoint`, `CATEGORIES` (4 categorías: reasoning + coding + flash + multimodal)
- **Semana 1 / Paso 2 — Realtime**
  - Polling OpenRouter `/models` cada 30s con timeout 10s
  - Servidor WebSocket con `Origin` guard (same-origin / allow-list / sin-header)
  - Snapshot en conexión + broadcast de `tick` en cada poll
  - Caché in-memory (`MetricCache`) como fallback cuando la API externa cae (RF-3.2)
  - `ws` rechaza orígenes no listados con código 1008
- **Semana 1 / Paso 3 — HTTP + filtros**
  - `GET /healthz`, `GET /api/models`, `GET /api/ai-models/top`, `GET /api/ai-models/history`
  - Rate-limit middleware 45 req/min/IP con headers `X-RateLimit-*` y `Retry-After`
  - CORS allow-list + preflight 204
  - Migración SQL `get_model_history(...)` con `date_trunc` + `AVG` agregada
  - Frontend: filtro por categoría (`aria-pressed`), panel lateral con side-panel, sparkline y links (RF-2.4)
- **Semana 2 / 3 — Producción**
  - Latency middleware con histogramas Prometheus (`/metrics` text format)
  - Contadores `radar_http_*`, `radar_ws_*`, `radar_cache_size`, `radar_batcher_*`, `radar_poll_*`
  - `radar_http_slow_requests_total` para alertas RNF-4.1 (>150ms)
  - Caché persistente en disco (`fs.rename` atómico, flush 5s)
  - Integración Artificial Analysis con Zod y graceful fallback (sintético si no hay key)
  - Batcher 15s con chunks de 500 para no saturar IOPS
  - Docker Compose con `postgres` + `backend` + `frontend` + `caddy` (TLS 1.3 + ACME + HTTP/3)
  - Caddyfile con `min_tls_version: tls1.3`, `max_tls_version: tls1.3`, HSTS, headers seguros
- **Polish (no SRS)**
  - 51 tests unitarios con Vitest (rate-limit, origin-guard, cache, benchmarks, categorizer, metrics, schemas Zod, tipos compartidos)
  - 3 smoke tests integration (ws/http/metrics)
  - GitHub Actions CI (typecheck + lint + test + build)
  - ESLint centralizado
  - AGENTS.md con convenciones
  - `.nvmrc` + `engines` (Node ≥20)
  - `.editorconfig`
  - React `ErrorBoundary` + `app/error.tsx` + `app/not-found.tsx` + `app/loading.tsx`
  - CSP + HSTS + X-Frame-Options + Permissions-Policy en `next.config.mjs`
  - Sparkline por modelo en `TopModelsTable`
  - Página `/history` dedicada con `HistoryExplorer`

### Security
- TLS 1.3 exclusively en prod (Caddy)
- WS Origin guard (RS-1.2)
- Queries parametrizadas (RS-1.3)
- Rate-limit 45/min/IP (RS-2.1)
- Zod en todas las APIs externas (RS-2.2)
- `SUPABASE_SERVICE_ROLE_KEY` solo en backend (RS-2.3)
- CSP estricto: `default-src 'self'`, `frame-ancestors 'none'`, `connect-src` permite `ws:/wss:`

### Verified
- `pnpm typecheck` → 3/3 paquetes strict (incl. `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)
- `pnpm lint` → 0 warnings
- `pnpm test` → 51/51 tests passing
- `pnpm --filter backend exec tsx smoke/{ws,http,metrics}.test.ts` → all OK
- Docker compose configurable para desplegar con Caddy ACME automático