# AGENTS.md — Guía para trabajar en LLM Radar

## Arquitectura general

- **Monorepo pnpm** con 3 paquetes: `@llm-radar/types`, `backend`, `frontend`.
- **Backend**: Node.js 20 + TypeScript estricto + `ws` + `@supabase/supabase-js` + Zod. Un solo proceso HTTP que sirve REST + WebSocket en el mismo puerto.
- **Frontend**: Next.js 14 (App Router) + Chart.js + Tailwind. Tipos compartidos importados desde `@llm-radar/types`.
- **DB**: Supabase/Postgres con tabla `metrics`, índice compuesto `(model_id, timestamp DESC)` y vista `v_latest_metrics`.
- **Infra**: docker-compose con `postgres` + `backend` + `frontend` + `caddy` (TLS 1.3 + ACME + HTTP/3).

## Convenciones

### TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` (los 3 paquetes).
- Tipos compartidos viven en `packages/types/src/index.ts`. **Nunca** dupliques interfaces entre BE/FE.
- Genera los tipos Supabase con `pnpm db:types` (requiere `SUPABASE_PROJECT_ID`).
- Props opcionales con `exactOptionalPropertyTypes` se manejan con spread condicional: `...(x !== undefined ? { foo: x } : {})`.

### Estructura del backend

```
backend/src/
├── api/              # HTTP routes, rate-limit, cors, handlers
├── observability/    # metrics counters/histograms → /metrics
├── ws/               # server, origin-guard, broadcaster
├── services/         # openrouter, artificial-analysis, poller, batcher, cache
├── schemas/          # Zod para payloads externos
├── config/           # env (Zod) + supabase client tipado
├── types/            # Database (regenerable con db:types)
└── index.ts          # bootstrap
```

- Servicios exportan una **factory** (`createX(): XHandle`) más una instancia singleton (`export const x = createX()`).
- El **poller** corre cada 30s, llama OpenRouter + (opcional) AA en paralelo, enriquece métricas, actualiza caché persistente, y enqueue en el batcher.
- El **batcher** flushea cada 15s en chunks de 500 (limita IOPS a Supabase).
- El **caché** persiste a disco atómicamente cada 5s (`fs.rename`); sobrevive restarts.
- El **router** HTTP mide latencia con `process.hrtime.bigint()` y emite histogramas + alerta si >150ms (RNF-4.1).

### Estructura del frontend

```
frontend/src/
├── app/              # App Router: /, /history
├── components/       # Componentes presentacionales con props tipadas
├── hooks/            # useRadarSocket (WS client con reconexión)
└── lib/              # api.ts (HTTP client tipado)
```

- Componentes **'use client'** cuando usen hooks o estado.
- **Accesibilidad**: `aria-pressed` en toggles, `role="group"` con `aria-label`, `aria-live="polite"` para updates, `<table className="sr-only">` para Top-5 (RA-4.2), skip-link en `layout.tsx`, `focus-visible:ring` global.
- **Tema**: `bg`, `surface`, `ink`, `accent`, `focus` en `tailwind.config.ts`. Mantén contraste ≥ 4.5:1.

### Seguridad

- **TLS 1.3** exclusivamente en prod (Caddy). En dev, HTTP plano sólo dentro de `localhost`.
- **WS Origin guard** en `backend/src/ws/origin-guard.ts`: allow-list + same-origin + sin-header (server-to-server).
- **Rate-limit 45 req/min/IP** con sliding window en memoria (`api/middleware/rate-limit.ts`). Headers: `X-RateLimit-*`, `Retry-After`.
- **Queries parametrizadas**: nunca construir SQL a mano. Usar el cliente Supabase.
- **ENV vars**: validadas con Zod en `config/env.ts`. Fallan el proceso si faltan (no degradar).
- **SUPABASE_SERVICE_ROLE_KEY** NUNCA debe llegar al frontend. Sólo backend.

### Observabilidad

- `GET /metrics` expone Prometheus text format (counters + histograms).
- Métricas: `radar_http_request_duration_ms_*`, `radar_ws_*`, `radar_cache_size`, `radar_batcher_inserted_rows_total`, `radar_poll_*`.
- Si una request supera 150ms, se loguea warning (`[latency] ...`) y se incrementa `radar_http_slow_requests_total`.

## Comandos útiles

```bash
# desarrollo
pnpm install
pnpm build:types
pnpm db:types        # regenera Database types desde Supabase
pnpm typecheck       # 3 paquetes strict
pnpm lint            # eslint --max-warnings=20
pnpm test            # vitest run
pnpm dev:backend     # tsx watch
pnpm dev:frontend    # next dev

# smoke tests (integration, sin vitest)
pnpm --filter backend exec tsx smoke/ws.test.ts
pnpm --filter backend exec tsx smoke/http.test.ts
pnpm --filter backend exec tsx smoke/metrics.test.ts

# producción
docker compose up -d --build
```

## Patrones a respetar

1. **Una fuente de verdad para tipos**: si añades un campo nuevo a `AiModel`, `MetricPayload` o `RadarEvent`, regenera `dist/` con `pnpm build:types` y asegúrate de que tanto backend como frontend compilen.
2. **No añadas dependencias grandes**: el stack es deliberadamente pequeño (zod, ws, supabase, chart.js). Si necesitas algo, justifica en el PR.
3. **Zod para TODO payload externo**: OpenRouter, AA, futuros providers. El backend no debe confiar en JSON sin validar.
4. **Accesibilidad no es opcional**: cada componente interactivo debe ser operable con teclado y anunciar cambios a screen readers.
5. **Tests para lógica crítica**: rate-limit, origin-guard, batcher, cache, benchmarks, categorizer, schemas Zod. Las nuevas features deben venir con tests.
6. **Logs estructurados pero minimalistas**: prefijo `[subsystem]` (`[poller]`, `[ws]`, `[batcher]`).

## SQL migrations

- Cada migration vive en `db/migrations/NNN_*.sql` con numeración secuencial.
- Las migraciones son **idempotentes** (`create or replace function`, `if not exists`).
- Tras añadir una migration, regenera los tipos: `pnpm db:types`.

## Próximos pasos sugeridos (no asignados)

- Reemplazar benchmarks sintéticos cuando tengas `ARTIFICIAL_ANALYSIS_API_KEY` (ya integrado, sólo falta la key).
- Worker dedicado para backpressure del batcher si la tabla supera 100k rows/min.
- Redis para rate-limit distribuido.
- OpenTelemetry tracing BE↔FE.
- Tests E2E con Playwright.