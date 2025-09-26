FROM node:20-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++ gcc musl-dev

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Configurar pnpm para permitir build scripts y instalar dependencias
RUN pnpm config set ignore-scripts false \
    && pnpm install --prod=false \
    && cd node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3 \
    && npm run install --build-from-source

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Limpiar devDependencies para producción
RUN pnpm prune --prod

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]