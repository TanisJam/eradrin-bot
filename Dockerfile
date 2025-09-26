FROM node:20-alpine AS builder

# Instalar pnpm y dependencias necesarias para compilar sqlite3
RUN apk add --no-cache python3 make g++ gcc musl-dev \
    && npm install -g pnpm typescript

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Instalar dependencias incluyendo devDependencies para el build
RUN pnpm install --prod=false \
    && cd node_modules/sqlite3 \
    && pnpm run install --build-from-source

# Copy source files and build
COPY . .
RUN which tsc && tsc --version && echo "TypeScript is available" \
    && pnpm run build && ls -la dist/ && echo "Build completed successfully"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias necesarias para la ejecución
RUN apk add --no-cache python3 make g++ gcc musl-dev \
    && npm install -g pnpm

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy built files and database
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database.sqlite ./database.sqlite

# Verify files were copied correctly
RUN ls -la dist/ && ls -la dist/src/ && echo "Files copied successfully"

# Command to run the application
CMD ["node", "dist/src/index.js"]
