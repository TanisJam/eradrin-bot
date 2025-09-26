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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../src/database/config");
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
// Define usage info
const showUsage = () => {
    console.log(`
  Uso: pnpm ingest-knowledge [-- opciones]
  
  Opciones:
    --mode       Modo de operación: 'all' procesa todo el directorio de conocimiento, 
                'directory' procesa un directorio específico, 'file' procesa un archivo específico.
                Predeterminado: all
    --directory  (Solo en modo directory) Nombre del directorio en knowledge/ a procesar
    --file       (Solo en modo file) Ruta al archivo relativa al directorio knowledge/
    --chunkSize  Tamaño de los fragmentos de texto en caracteres (predeterminado: 500)
  
  Ejemplos:
    # Procesar toda la estructura del directorio de conocimiento:
    pnpm ingest-knowledge

    # Procesar todos los archivos en un directorio específico:
    pnpm ingest-knowledge -- --mode=directory --directory=player-characters
    
    # Procesar un solo archivo:
    pnpm ingest-knowledge -- --mode=file --file=player-characters/elowen.txt
    
    # Procesar todos los archivos con un tamaño de fragmento personalizado:
    pnpm ingest-knowledge -- --chunkSize=800
  `);
    process.exit(1);
};
// Get parameters
const mode = params.mode || 'all';
const directory = params.directory || '';
const fileName = params.file || '';
const chunkSize = parseInt(params.chunkSize || '500', 10);
// Validate parameters
if (mode === 'directory' && !directory) {
    logger_1.logger.error('Error: El modo directory requiere el parámetro --directory');
    showUsage();
}
if (mode === 'file' && !fileName) {
    logger_1.logger.error('Error: El modo file requiere el parámetro --file');
    showUsage();
}
// Process a single file
function processFile(filePath, chunkSize) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get the source from the parent directory name
            const relativePath = path_1.default.relative(path_1.default.join(process.cwd(), 'knowledge'), filePath);
            const pathParts = relativePath.split(path_1.default.sep);
            // If the file is in a subdirectory, use the directory name as the source
            // Otherwise, use 'general' as the source
            let source = 'general';
            if (pathParts.length > 1) {
                source = pathParts[0];
            }
            const fileName = path_1.default.basename(filePath);
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                logger_1.logger.error(`Error: Archivo "${filePath}" no encontrado`);
                return;
            }
            logger_1.logger.info(`Procesando archivo: ${filePath}`);
            logger_1.logger.info(`Fuente: ${source}`);
            logger_1.logger.info(`Tamaño de fragmento: ${chunkSize} caracteres`);
            // Read file content
            const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
            logger_1.logger.info(`Tamaño del archivo: ${fileContent.length} caracteres`);
            // Ingest the knowledge
            const chunkCount = yield RAG_service_1.default.ingestKnowledge(fileContent, chunkSize, { source, fileName });
            logger_1.logger.info(`${fileName} procesado correctamente`);
            logger_1.logger.info(`Se crearon ${chunkCount} fragmentos de conocimiento`);
            logger_1.logger.info('-----------------------------------');
        }
        catch (error) {
            logger_1.logger.error('Error al procesar archivo:', error);
        }
    });
}
// Process all files in a directory
function processDirectory(dirPath, chunkSize) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if directory exists
            if (!fs_1.default.existsSync(dirPath)) {
                logger_1.logger.error(`Error: Directorio "${dirPath}" no encontrado`);
                return;
            }
            logger_1.logger.info(`Procesando directorio: ${dirPath}`);
            // Get all files recursively
            const getFilesRecursively = (dir) => {
                const dirents = fs_1.default.readdirSync(dir, { withFileTypes: true });
                const files = dirents.map((dirent) => {
                    const res = path_1.default.resolve(dir, dirent.name);
                    return dirent.isDirectory() ? getFilesRecursively(res) : res;
                });
                return Array.prototype.concat(...files);
            };
            // Filter for text files (.txt, .md)
            const files = getFilesRecursively(dirPath)
                .filter(file => file.endsWith('.txt') || file.endsWith('.md'));
            if (files.length === 0) {
                logger_1.logger.info(`No se encontraron archivos de texto en ${dirPath}`);
                return;
            }
            logger_1.logger.info(`Se encontraron ${files.length} archivos de texto para procesar`);
            // Process each file
            for (const file of files) {
                yield processFile(file, chunkSize);
            }
            logger_1.logger.info(`Todos los archivos en ${dirPath} procesados correctamente`);
        }
        catch (error) {
            logger_1.logger.error('Error al procesar directorio:', error);
        }
    });
}
// Process the entire knowledge directory with all subdirectories
function processAllKnowledge(chunkSize) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const knowledgeDirPath = path_1.default.join(process.cwd(), 'knowledge');
            // Check if knowledge directory exists
            if (!fs_1.default.existsSync(knowledgeDirPath)) {
                logger_1.logger.info(`Creando directorio de conocimiento en ${knowledgeDirPath}`);
                fs_1.default.mkdirSync(knowledgeDirPath, { recursive: true });
                logger_1.logger.info(`No hay archivos para procesar. Crea subdirectorios y añade archivos a ${knowledgeDirPath}`);
                return;
            }
            logger_1.logger.info(`Procesando todo el conocimiento en ${knowledgeDirPath}`);
            // Process the entire directory structure
            yield processDirectory(knowledgeDirPath, chunkSize);
            logger_1.logger.info('Todo el conocimiento procesado correctamente');
        }
        catch (error) {
            logger_1.logger.error('Error al procesar el directorio de conocimiento:', error);
        }
    });
}
// Main function
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize database
            logger_1.logger.info('Inicializando base de datos...');
            yield (0, config_1.initDatabase)();
            const knowledgeDirPath = path_1.default.join(process.cwd(), 'knowledge');
            switch (mode) {
                case 'all':
                    yield processAllKnowledge(chunkSize);
                    break;
                case 'directory':
                    const dirPath = path_1.default.join(knowledgeDirPath, directory);
                    yield processDirectory(dirPath, chunkSize);
                    break;
                case 'file':
                    const filePath = path_1.default.join(knowledgeDirPath, fileName);
                    yield processFile(filePath, chunkSize);
                    break;
                default:
                    logger_1.logger.error(`Modo inválido: ${mode}`);
                    showUsage();
            }
            logger_1.logger.info('Ingestión de conocimiento completada.');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error durante la ingestión de conocimiento:', error);
            process.exit(1);
        }
    });
}
// Run the script
main();
