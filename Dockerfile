FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Deps stage ---
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
# Explicitly build better-sqlite3 native module
RUN pnpm rebuild better-sqlite3

# --- Builder stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy better-sqlite3 native module (pnpm stores under .pnpm virtual store)
COPY --from=builder --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3 \
  ./node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3

# Migration script (tek seferlik JSON → SQLite aktarımı için)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# data/ dizini volume olarak mount edilecek
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3005
ENV PORT=3005
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
