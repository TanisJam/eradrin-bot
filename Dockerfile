FROM node:20

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias con npm (no pnpm)
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Comando para ejecutar la aplicación
CMD ["node", "dist/src/index.js"]