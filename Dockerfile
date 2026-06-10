# ── Stage 1: Install all dependencies (dev + prod, needed for build) ──────────
FROM node:22.11.0-slim AS deps
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build TypeScript ─────────────────────────────────────────────────
FROM node:22.11.0-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/

RUN pnpm build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:22.11.0-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    fonts-dejavu \
    fonts-noto \
    fonts-noto-cjk \
    fontconfig \
    curl \
    && ln -sf /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
    && echo "Asia/Jakarta" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Jakarta
ENV NODE_ENV=production
ENV RUN_IN_DOCKER=1

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
