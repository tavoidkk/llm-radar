FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages/types ./packages/types
COPY frontend ./frontend
RUN pnpm --filter @llm-radar/types build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter frontend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/frontend/node_modules ./frontend/node_modules
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "start"]