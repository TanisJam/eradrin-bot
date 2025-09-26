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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../src/database/config");
const KnowledgeChunk_1 = __importDefault(require("../src/database/models/KnowledgeChunk"));
const readline_1 = __importDefault(require("readline"));
const logger_1 = require("../src/utils/logger");
// Process command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const source = ((_a = args.find(arg => arg.startsWith('--source='))) === null || _a === void 0 ? void 0 : _a.split('=')[1]) || '';
// Create interface for user input
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
/**
 * Clear all knowledge chunks
 */
function clearAllKnowledge() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const count = yield KnowledgeChunk_1.default.count();
            if (count === 0) {
                logger_1.logger.info('No se encontraron fragmentos de conocimiento en la base de datos.');
                return;
            }
            yield KnowledgeChunk_1.default.destroy({ where: {}, truncate: true });
            logger_1.logger.info(`Se eliminaron correctamente todos los ${count} fragmentos de conocimiento.`);
        }
        catch (error) {
            logger_1.logger.error('Error al eliminar fragmentos de conocimiento:', error);
        }
    });
}
/**
 * Clear knowledge chunks from a specific source
 */
function clearSourceKnowledge(source) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all chunks
            const chunks = yield KnowledgeChunk_1.default.findAll({
                attributes: ['id', 'metadata'],
                raw: true
            });
            // Filter chunks by source
            const chunksToDelete = chunks.filter(chunk => {
                try {
                    const metadata = JSON.parse(chunk.metadata);
                    return metadata.source && metadata.source.toLowerCase() === source.toLowerCase();
                }
                catch (e) {
                    return false;
                }
            });
            if (chunksToDelete.length === 0) {
                logger_1.logger.info(`No se encontraron fragmentos de conocimiento con la fuente: ${source}`);
                return;
            }
            // Delete chunks by ID
            const chunkIds = chunksToDelete.map(chunk => chunk.id);
            yield KnowledgeChunk_1.default.destroy({
                where: {
                    id: chunkIds
                }
            });
            logger_1.logger.info(`Se eliminaron correctamente ${chunksToDelete.length} fragmentos de conocimiento de la fuente: ${source}`);
        }
        catch (error) {
            logger_1.logger.error('Error al eliminar fragmentos de conocimiento:', error);
        }
    });
}
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database
            logger_1.logger.info('Conectando a la base de datos...');
            yield (0, config_1.initDatabase)();
            if (source) {
                if (force) {
                    yield clearSourceKnowledge(source);
                }
                else {
                    rl.question(`¿Estás seguro de que deseas eliminar todos los fragmentos de conocimiento de la fuente "${source}"? (s/N): `, (answer) => __awaiter(this, void 0, void 0, function* () {
                        if (answer.toLowerCase() === 's') {
                            yield clearSourceKnowledge(source);
                        }
                        else {
                            logger_1.logger.info('Operación cancelada.');
                        }
                        rl.close();
                    }));
                }
            }
            else {
                if (force) {
                    yield clearAllKnowledge();
                }
                else {
                    rl.question('¿Estás seguro de que deseas eliminar TODOS los fragmentos de conocimiento? Esta acción no se puede deshacer. (s/N): ', (answer) => __awaiter(this, void 0, void 0, function* () {
                        if (answer.toLowerCase() === 's') {
                            yield clearAllKnowledge();
                        }
                        else {
                            logger_1.logger.info('Operación cancelada.');
                        }
                        rl.close();
                    }));
                }
            }
            // If force is true, we don't need to wait for user input, so close rl
            if (force) {
                rl.close();
            }
        }
        catch (error) {
            logger_1.logger.error('Error:', error);
            rl.close();
            process.exit(1);
        }
    });
}
// Show usage
function showUsage() {
    console.log(`
Uso: pnpm clear-knowledge [opciones]

Opciones:
  --force           Omitir la confirmación
  --source=<nombre> Eliminar solo fragmentos de una fuente específica

Ejemplos:
  # Eliminar todo el conocimiento (con confirmación)
  pnpm clear-knowledge

  # Eliminar todo el conocimiento sin confirmación
  pnpm clear-knowledge --force

  # Eliminar solo fragmentos de la fuente player-characters
  pnpm clear-knowledge --source=player-characters
`);
}
// Check if help is requested
if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    rl.close();
    process.exit(0);
}
// Add event handler for readline close to exit the process
rl.on('close', () => {
    process.exit(0);
});
// Run the script
main();
