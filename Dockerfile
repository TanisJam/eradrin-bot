FROM node:20

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar todas las dependencias
RUN pnpm install

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN pnpm run build

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]