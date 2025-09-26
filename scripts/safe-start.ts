/**
 * Script para iniciar el servidor de manera segura
 * Evita usar 'alter: true' para evitar problemas con SQLite
 */

import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../src/utils/logger';

logger.info('🔒 Iniciando el servidor en modo seguro (sin alterar tablas)...');

// Definir la ruta al archivo principal del bot
const botScriptPath = path.resolve(__dirname, '../dist/bot.js');

// Verificar si es TypeScript o JavaScript
const isTypescript = process.argv.includes('--ts');
const nodeCommand = isTypescript ? 'ts-node' : 'node';
const scriptPath = isTypescript ? '../src/bot.ts' : botScriptPath;

// Establecer variable de entorno para indicar inicio seguro
process.env.SAFE_START = 'true';

// Iniciar el proceso del bot
const botProcess = spawn(nodeCommand, [scriptPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SAFE_START: 'true' // Evitar alterar tablas
  }
});

botProcess.on('close', (code) => {
  logger.info(`Proceso del bot finalizado con código ${code}`);
});

logger.info(`🚀 Servidor iniciado con ${nodeCommand} ${scriptPath}`); 