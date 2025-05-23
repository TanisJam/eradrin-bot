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
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../src/database/config");
require("../src/database/models/ImpersonationCharacter"); // Importar el modelo para asegurarnos de que se registre
const logger_1 = require("../src/utils/logger");
/**
 * Script para sincronizar la base de datos con los modelos actualizados
 * Utiliza la opción 'alter: true' para modificar las tablas existentes
 */
function syncDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('🔄 Iniciando sincronización de la base de datos...');
            // Pasamos 'alter: true' para que modifique las tablas existentes
            yield (0, config_1.initDatabase)(false, true);
            logger_1.logger.info('✅ Base de datos sincronizada correctamente.');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('❌ Error al sincronizar la base de datos:', error);
            process.exit(1);
        }
    });
}
// Ejecutar la función
syncDatabase();
