FROM node:20-alpine

# Instalar dependencias del sistema necesarias para compilar sqlite3
RUN apk add --no-cache python3 py3-pip make g++ gcc musl-dev \
    && python3 -m pip install --break-system-packages setuptools

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias sin sqlite3
RUN pnpm install --ignore-scripts

# Instalar sqlite3 manualmente con node-gyp
RUN npm install sqlite3 --build-from-source

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]