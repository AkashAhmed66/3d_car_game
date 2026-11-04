
# =========================================
# Stage 1: Dependencies
# =========================================
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable

# Copy complete project source
COPY . .

# Ensure public directory exists
RUN mkdir -p public

# Install dependencies using the detected package manager
RUN if [ -f pnpm-lock.yaml ]; then \
        corepack pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci; \
    else \
        echo "ERROR: No package-lock.json or pnpm-lock.yaml found"; \
        exit 1; \
    fi


# =========================================
# Stage 2: Application Builder
# =========================================
FROM deps AS builder

ENV NEXT_TELEMETRY_DISABLED=1

# Build the production application
RUN if [ -f pnpm-lock.yaml ]; then \
        corepack pnpm run build; \
    else \
        npm run build; \
    fi


# =========================================
# Stage 3: Production Runtime
# =========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create an unprivileged application user
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Copy standalone production server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Run as non-root
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
