FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages/types ./packages/types
COPY backend ./backend
RUN pnpm --filter @llm-radar/types build
RUN pnpm --filter backend build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 8080
CMD ["node", "backend/dist/index.js"]