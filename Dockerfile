FROM node:20-alpine AS builder

# Instalar pnpm y dependencias necesarias para compilar sqlite3
RUN apk add --no-cache python3 make g++ gcc musl-dev \
    && npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Instalar dependencias y compilar sqlite3
RUN pnpm install --frozen-lockfile \
    && cd node_modules/sqlite3 \
    && pnpm run install --build-from-source

# Copy source files and build
COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias necesarias para la ejecución
RUN apk add --no-cache python3 make g++ gcc musl-dev \
    && npm install -g pnpm

# Copy package files, built files, and node_modules
COPY --from=builder /app/package*.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Copy database file
COPY --from=builder /app/database.sqlite ./database.sqlite

# Command to run the application
CMD ["node", "dist/bot.js"]
