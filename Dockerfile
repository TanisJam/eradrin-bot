FROM node:20-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 py3-pip py3-setuptools make g++ gcc musl-dev \
    && python3 -m pip install --break-system-packages setuptools

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --prod=false

# Compilar sqlite3 explícitamente
RUN pnpm rebuild sqlite3

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Limpiar devDependencies para producción
RUN pnpm prune --prod

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]