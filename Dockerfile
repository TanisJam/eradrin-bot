# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files AND pnpm config
COPY package.json pnpm-lock.yaml .pnpmrc ./

# Install ALL dependencies with build scripts allowed (needed for sqlite3 native compilation)
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript (will fail if there are errors)
RUN pnpm build

# ================================
# Stage 3: Production
# ================================
FROM node:20-alpine AS runner

# Install runtime dependencies for sqlite3
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files AND pnpm config
COPY package.json pnpm-lock.yaml .pnpmrc ./

# Install production dependencies with build scripts allowed (needed for sqlite3 native compilation)
RUN pnpm install --frozen-lockfile --prod --dangerously-allow-all-builds

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create directory for database with proper permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose port (if needed for healthcheck in future)
EXPOSE 3000

# Health check - simple process check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Start the bot
CMD ["node", "dist/src/index.js"]
