FROM node:20

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias con npm (no pnpm)
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar TypeScript ignorando errores
RUN npm run build || true

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]