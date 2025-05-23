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
const config_1 = require("../src/database/config");
const KnowledgeChunk_1 = __importDefault(require("../src/database/models/KnowledgeChunk"));
const sequelize_1 = require("sequelize");
const RAG_service_1 = __importDefault(require("../src/services/RAG.service"));
const logger_1 = require("../src/utils/logger");
// Process command line arguments
const args = process.argv.slice(2);
const params = {};
// Parse arguments in format --key=value
args.forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        if (key && value) {
            params[key] = value;
        }
    }
});
const source = params.source || '';
const query = params.query || '';
const limit = parseInt(params.limit || '10', 10);
const mode = params.mode || 'strict';
const relaxedMode = mode === 'relaxed';
/**
 * Display summary statistics about the knowledge base
 */
function showStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get total count of chunks
            const totalChunks = yield KnowledgeChunk_1.default.count();
            // Get count by source
            const sources = yield KnowledgeChunk_1.default.findAll({
                attributes: ['metadata'],
                raw: true
            });
            const sourceStats = {};
            sources.forEach(chunk => {
                try {
                    const metadata = JSON.parse(chunk.metadata);
                    const source = metadata.source || 'unknown';
                    sourceStats[source] = (sourceStats[source] || 0) + 1;
                }
                catch (e) {
                    // Skip if metadata can't be parsed
                }
            });
            console.log('\n=== Knowledge Base Statistics ===');
            console.log(`Total chunks: ${totalChunks}`);
            console.log('\nChunks by source:');
            if (Object.keys(sourceStats).length === 0) {
                console.log('  No source data found');
            }
            else {
                Object.entries(sourceStats)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([source, count]) => {
                    console.log(`  ${source}: ${count} chunks`);
                });
            }
            console.log('\n');
        }
        catch (error) {
            logger_1.logger.error('Error al obtener estadísticas:', error);
        }
    });
}
/**
 * Search for chunks matching a query using RAG service
 */
function searchChunks(query_1, sourceFilter_1) {
    return __awaiter(this, arguments, void 0, function* (query, sourceFilter, limit = 5) {
        try {
            let chunks = [];
            if (query) {
                // Use RAG service to search with semantic similarity
                console.log(`Buscando con servicio RAG (modo ${relaxedMode ? 'relajado' : 'auto'})...`);
                // If source filter is provided, we'll filter results after search
                chunks = yield RAG_service_1.default.searchRelevantChunks(query, limit * 2, // Request more results to account for filtering
                0, // No additional chunks
                0.7, // Default threshold
                relaxedMode ? 1 : 2 // In relaxed mode, fallback more readily
                );
                // Apply source filter if provided
                if (sourceFilter) {
                    chunks = chunks.filter(chunk => {
                        try {
                            const metadata = JSON.parse(chunk.metadata);
                            return metadata.source && metadata.source.toLowerCase() === sourceFilter.toLowerCase();
                        }
                        catch (e) {
                            return false;
                        }
                    });
                    if (chunks.length === 0) {
                        console.log(`No se encontraron fragmentos con fuente: ${sourceFilter}`);
                        return;
                    }
                }
                // Limit results
                chunks = chunks.slice(0, limit);
            }
            else if (sourceFilter) {
                // If only source is provided, show chunks from that source using traditional search
                const matchingChunks = yield KnowledgeChunk_1.default.findAll({
                    where: {
                        metadata: {
                            [sequelize_1.Op.like]: `%"source":"${sourceFilter}"%`
                        }
                    },
                    limit,
                    order: [['id', 'ASC']]
                });
                chunks = matchingChunks;
                if (chunks.length === 0) {
                    console.log(`No se encontraron fragmentos con fuente: ${sourceFilter}`);
                    return;
                }
            }
            if (chunks.length === 0) {
                console.log('No se encontraron fragmentos coincidentes');
                return;
            }
            console.log(`\n=== Se encontraron ${chunks.length} fragmentos coincidentes ===\n`);
            chunks.forEach((chunk, index) => {
                try {
                    const metadata = JSON.parse(chunk.metadata);
                    const source = metadata.source || 'unknown';
                    const fileName = metadata.fileName || '';
                    console.log(`[${index + 1}] Fragmento #${chunk.id} (Fuente: ${source}${fileName ? ', Archivo: ' + fileName : ''})`);
                    console.log('-----------------------------------------------------------');
                    console.log(chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''));
                    console.log('-----------------------------------------------------------\n');
                }
                catch (e) {
                    console.log(`[${index + 1}] Fragmento #${chunk.id} (Error al analizar metadatos)`);
                    console.log('-----------------------------------------------------------');
                    console.log(chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''));
                    console.log('-----------------------------------------------------------\n');
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error al buscar fragmentos:', error);
        }
    });
}
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database
            console.log('Conectando a la base de datos...');
            yield (0, config_1.initDatabase)();
            // Show stats
            yield showStats();
            // If query is provided, search for chunks
            if (query) {
                yield searchChunks(query, source, limit);
            }
            else if (source) {
                // If only source is provided, show chunks from that source
                yield searchChunks('', source, limit);
            }
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error:', error);
            process.exit(1);
        }
    });
}
// Show usage
function showUsage() {
    console.log(`
Uso: pnpm verify-knowledge [-- opciones]

Opciones:
  --query=<texto>     Buscar fragmentos que contengan este texto
  --source=<nombre>   Filtrar por categoría de fuente
  --limit=<número>    Número máximo de resultados a mostrar (predeterminado: 10)
  --mode=<strict|relaxed>  Modo de búsqueda (predeterminado: strict)

Ejemplos:
  # Mostrar estadísticas generales
  pnpm verify-knowledge

  # Buscar fragmentos sobre "Elowen"
  pnpm verify-knowledge -- --query=Elowen

  # Mostrar fragmentos de la fuente player-characters
  pnpm verify-knowledge -- --source=player-characters

  # Buscar "Elowen" en la fuente player-characters
  pnpm verify-knowledge -- --query=Elowen --source=player-characters
  
  # Buscar con modo relajado
  pnpm verify-knowledge -- --query=Elowen --mode=relaxed
`);
}
// Check if help is requested
if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
}
// Run the script
main();
