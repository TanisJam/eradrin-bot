"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const config_1 = __importDefault(require("../src/config"));
const ImpersonationCharacter_1 = __importDefault(require("../src/database/models/ImpersonationCharacter"));
const logger_1 = require("../src/utils/logger");
/**
 * Script para recrear la tabla ImpersonationCharacters
 * ADVERTENCIA: Este script eliminará la tabla y todos sus datos
 */
function resetImpersonationTable() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('🔄 Iniciando recreación de tabla ImpersonationCharacters...');
            // Primero nos conectamos a la base de datos
            const sequelize = new sequelize_1.Sequelize({
                dialect: 'sqlite',
                storage: config_1.default.DATABASE_PATH,
                logging: false
            });
            yield sequelize.authenticate();
            logger_1.logger.info('✅ Conexión a la base de datos establecida.');
            // Eliminamos la tabla directamente usando una consulta SQL
            logger_1.logger.info('🗑️ Eliminando tabla ImpersonationCharacters...');
            yield sequelize.query('DROP TABLE IF EXISTS "ImpersonationCharacters"');
            logger_1.logger.info('✅ Tabla eliminada correctamente.');
            // Volvemos a inicializar la base de datos para recrear la tabla
            logger_1.logger.info('🔄 Recreando tabla con el modelo actualizado...');
            // Forzamos la sincronización de solo el modelo ImpersonationCharacter
            yield ImpersonationCharacter_1.default.sync({ force: true });
            logger_1.logger.info('✅ Tabla ImpersonationCharacters recreada correctamente!');
            logger_1.logger.info('ℹ️ La tabla ahora está vacía. Los usuarios tendrán que volver a crear sus personajes.');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('❌ Error al recrear la tabla:', error);
            process.exit(1);
        }
    });
}
// Pedimos confirmación antes de ejecutar
logger_1.logger.warn('⚠️ ADVERTENCIA: Este script eliminará todos los personajes de impersonación existentes.');
logger_1.logger.warn('⚠️ Esta acción no se puede deshacer.');
logger_1.logger.warn('⚠️ Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...');
setTimeout(resetImpersonationTable, 5000);
