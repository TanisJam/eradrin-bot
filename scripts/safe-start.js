"use strict";
/**
 * Script para iniciar el servidor de manera segura
 * Evita usar 'alter: true' para evitar problemas con SQLite
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../src/utils/logger");
logger_1.logger.info('🔒 Iniciando el servidor en modo seguro (sin alterar tablas)...');
// Definir la ruta al archivo principal del bot
const botScriptPath = path_1.default.resolve(__dirname, '../dist/bot.js');
// Verificar si es TypeScript o JavaScript
const isTypescript = process.argv.includes('--ts');
const nodeCommand = isTypescript ? 'ts-node' : 'node';
const scriptPath = isTypescript ? '../src/bot.ts' : botScriptPath;
// Establecer variable de entorno para indicar inicio seguro
process.env.SAFE_START = 'true';
// Iniciar el proceso del bot
const botProcess = (0, child_process_1.spawn)(nodeCommand, [scriptPath], {
    stdio: 'inherit',
    env: Object.assign(Object.assign({}, process.env), { SAFE_START: 'true' // Evitar alterar tablas
     })
});
botProcess.on('close', (code) => {
    logger_1.logger.info(`Proceso del bot finalizado con código ${code}`);
});
logger_1.logger.info(`🚀 Servidor iniciado con ${nodeCommand} ${scriptPath}`);
