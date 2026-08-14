# LLM Radar — Real-Time AI Benchmarks Leaderboard

Panel analítico en tiempo real para comparar LLMs por **Elo**, **tokens/seg** y **costo**.

## Stack

- **Backend** — Node.js + TypeScript + `ws` + `@supabase/supabase-js` + Zod
- **Frontend** — Next.js + TypeScript + Chart.js + Tailwind (WCAG 2.2 AA)
- **DB** — Supabase (PostgreSQL) con tabla `metrics` + índice compuesto `(model_id, timestamp DESC)` + vista `v_latest_metrics`
- **Observabilidad** — `/metrics` Prometheus + histogramas de latencia (RNF-4.1)
- **Infra** — Docker Compose (postgres + backend + frontend + **Caddy TLS 1.3**)

## Workspace (pnpm)

```
llm-radar/
├── packages/types/        # @llm-radar/types — compartido FE/BE
├── backend/               # Node.js + ws + Supabase + Zod
│   ├── src/
│   │   ├── api/           # router + rate-limit + cors + handlers
│   │   ├── observability/ # metrics (counters/histograms) → /metrics
│   │   ├── ws/            # server + origin-guard + broadcaster
│   │   ├── services/      # openrouter, poller, batcher, cache (persistente)
│   │   ├── schemas/       # Zod OpenRouter + Artificial Analysis
│   │   ├── config/        # env (Zod) + supabase client tipado
│   │   └── types/         # Database (regenerable con `db:types`)
│   └── smoke/             # tsx-based integration smoke tests
├── frontend/              # Next.js + Chart.js + Tailwind
│   └── src/
│       ├── app/           # / (live), /history
│       ├── components/    # ScatterChart, CategoryFilter, TopModelsTable, ...
│       ├── hooks/         # useRadarSocket (con reconexión + aria-live)
│       └── lib/           # api client tipado
├── db/migrations/         # 001 models, 002 metrics+índice+vista, 003 history fns
├── docker-compose.yml     # postgres + backend + frontend + caddy
├── Caddyfile              # TLS 1.3 + reverse proxy + headers seguros
└── eslint.config.mjs
```

## Setup local

```bash
pnpm install
cp backend/.env.example backend/.env       # SUPABASE_*, OPENROUTER_API_KEY
psql -f db/migrations/001_create_models.sql
psql -f db/migrations/002_create_metrics.sql
psql -f db/migrations/003_history_functions.sql
pnpm build:types
pnpm db:types   # regenera src/types/supabase.ts desde tu proyecto
pnpm typecheck  # 3/3 paquetes strict
pnpm lint       # eslint
pnpm dev:backend   # arranca backend en :8080
pnpm dev:frontend  # arranca Next en :3000
```

## Setup producción (Docker Compose con TLS 1.3)

```bash
# 1) Crear .env en la raíz con tus secretos
cat > .env <<EOF
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
OPENROUTER_API_KEY=sk-or-v1-...
ACME_EMAIL=ops@example.com
NEXT_PUBLIC_BACKEND_WS_URL=wss://radar.example.com/api
NEXT_PUBLIC_BACKEND_HTTP_URL=https://radar.example.com/api
WS_ALLOWED_ORIGINS=https://radar.example.com
EOF

# 2) Ajustar hosts en Caddyfile (sustituir "localhost" por tu dominio)
# 3) Levantar
docker compose up -d --build
```

Resultado: `https://radar.example.com` (TLS 1.3, HTTP/3, HSTS, ACME automático).

## Endpoints

```
GET  /healthz                                       → 200 {status,uptime}
GET  /metrics                                       → Prometheus text format
GET  /api/models                                    → lista de modelos
GET  /api/ai-models/top?limit=50&category=reasoning → top-N filtrado (45/min/IP)
GET  /api/ai-models/history?modelId=X&bucket=hour   → serie temporal (45/min/IP)
WS   /                                              → live updates (snapshot + tick)
```

Métricas expuestas:

```
radar_http_request_duration_ms_bucket{le="5|10|25|50|75|100|150|250|500|1000|+Inf"}
radar_http_requests_total{method,path,status}
radar_http_slow_requests_total{method,path}          # RNF-4.1 (>150ms)
radar_ws_connections_total
radar_ws_rejected_total{reason}
radar_cache_size (gauge)
radar_batcher_inserted_rows_total
radar_poll_success_total / radar_poll_failure_total{reason}
```

## Cumplimiento SRS

| Categoría | Req | Estado |
|---|---|---|
| RF Fase 1 | RF-1.1 polling OpenRouter 30s | ✅ |
| | RF-1.2 retransmisión WS con Origin guard | ✅ |
| | RF-1.3 tabla time-series + índice compuesto | ✅ |
| | RF-1.4 scatter chart live + sr-only Top5 | ✅ |
| RF Fase 2 | RF-2.1 filtros por categoría (4) | ✅ |
| | RF-2.2 modo histórico (`/history`) | ✅ |
| | RF-2.3 `GET /api/ai-models/history` | ✅ |
| | RF-2.4 panel lateral con details + history sparkline | ✅ |
| RF Fase 3 | RF-3.1 batch insert 15s + chunks 500 | ✅ |
| | RF-3.2 fallback a caché + persistencia en disco | ✅ |
| RS Fase 1 | RS-1.1 TLS 1.3 (Caddy ACME) | ✅ |
| | RS-1.2 Origin guard (same-origin/allow-list) | ✅ |
| | RS-1.3 queries parametrizadas (cliente Supabase) | ✅ |
| RS Fase 2 | RS-2.1 rate-limit 45 req/min/IP | ✅ |
| | RS-2.2 Zod para todas las APIs externas | ✅ |
| | RS-2.3 ENV vars (nunca expuestas al FE) | ✅ |
| RNF | RNF-4.1 <150ms (medido + alerta slow_total) | ✅ |
| | RNF-4.2 índice `(model_id, timestamp DESC)` | ✅ |
| | RNF-4.3 TS estricto compartido FE/BE | ✅ |
| | RNF-4.4 docker-compose con volumen persistente | ✅ |
| RA WCAG 2.2 AA | RA-4.1 contraste 4.5:1 | ✅ |
| | RA-4.2 tabla sr-only Top5 | ✅ |
| | RA-4.3 teclado + focus visible + aria-pressed | ✅ |
| | RA-4.4 aria-live="polite" en cambios | ✅ |

## Smoke tests

```bash
pnpm --filter backend exec tsx smoke/ws.test.ts      # WS snapshot + Origin guard
pnpm --filter backend exec tsx smoke/http.test.ts     # routes + 400/404/429 + CORS
pnpm --filter backend exec tsx smoke/metrics.test.ts  # /metrics + histogramas
```

## Estructura de decisiones

- **Workspace pnpm** con `@llm-radar/types` para evitar drift FE/BE.
- **`v_latest_metrics`** (vista) alimentada por índice compuesto para queries <50ms.
- **Caché persistente** en `~/.cache/metrics-cache.json` con flush cada 5s (atómico vía `.tmp` + rename).
- **Histogramas** de latencia en código (sin Prometheus client) — cero deps externas, export estándar text format.
- **Caddy 2** elegido sobre nginx: TLS 1.3 + ACME + HTTP/3 out-of-the-box, config declarativa en JSON.
- **Categorías** incluyen `multimodal` además de reasoning/coding/flash.

## Gustavo Vidal