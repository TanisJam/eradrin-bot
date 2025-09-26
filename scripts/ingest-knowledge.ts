import fs from 'fs';
import path from 'path';
import { initDatabase } from '../src/database/config';
import RAGService from '../src/services/RAG.service';
import { logger } from '../src/utils/logger';

// Process command line arguments
const args = process.argv.slice(2);
const params: Record<string, string> = {};

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
  logger.error('Error: El modo directory requiere el parámetro --directory');
  showUsage();
}

if (mode === 'file' && !fileName) {
  logger.error('Error: El modo file requiere el parámetro --file');
  showUsage();
}

// Process a single file
async function processFile(filePath: string, chunkSize: number): Promise<void> {
  try {
    // Get the source from the parent directory name
    const relativePath = path.relative(path.join(process.cwd(), 'knowledge'), filePath);
    const pathParts = relativePath.split(path.sep);
    
    // If the file is in a subdirectory, use the directory name as the source
    // Otherwise, use 'general' as the source
    let source = 'general';
    if (pathParts.length > 1) {
      source = pathParts[0];
    }
    
    const fileName = path.basename(filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`Error: Archivo "${filePath}" no encontrado`);
      return;
    }

    logger.info(`Procesando archivo: ${filePath}`);
    logger.info(`Fuente: ${source}`);
    logger.info(`Tamaño de fragmento: ${chunkSize} caracteres`);

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    logger.info(`Tamaño del archivo: ${fileContent.length} caracteres`);

    // Ingest the knowledge
    const chunkCount = await RAGService.ingestKnowledge(
      fileContent,
      chunkSize,
      { source, fileName }
    );

    logger.info(`${fileName} procesado correctamente`);
    logger.info(`Se crearon ${chunkCount} fragmentos de conocimiento`);
    logger.info('-----------------------------------');
  } catch (error) {
    logger.error('Error al procesar archivo:', error);
  }
}

// Process all files in a directory
async function processDirectory(dirPath: string, chunkSize: number): Promise<void> {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      logger.error(`Error: Directorio "${dirPath}" no encontrado`);
      return;
    }

    logger.info(`Procesando directorio: ${dirPath}`);
    
    // Get all files recursively
    const getFilesRecursively = (dir: string): string[] => {
      const dirents = fs.readdirSync(dir, { withFileTypes: true });
      const files = dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFilesRecursively(res) : res;
      });
      return Array.prototype.concat(...files);
    };

    // Filter for text files (.txt, .md)
    const files = getFilesRecursively(dirPath)
      .filter(file => file.endsWith('.txt') || file.endsWith('.md'));

    if (files.length === 0) {
      logger.info(`No se encontraron archivos de texto en ${dirPath}`);
      return;
    }

    logger.info(`Se encontraron ${files.length} archivos de texto para procesar`);
    
    // Process each file
    for (const file of files) {
      await processFile(file, chunkSize);
    }
    
    logger.info(`Todos los archivos en ${dirPath} procesados correctamente`);
  } catch (error) {
    logger.error('Error al procesar directorio:', error);
  }
}

// Process the entire knowledge directory with all subdirectories
async function processAllKnowledge(chunkSize: number): Promise<void> {
  try {
    const knowledgeDirPath = path.join(process.cwd(), 'knowledge');
    
    // Check if knowledge directory exists
    if (!fs.existsSync(knowledgeDirPath)) {
      logger.info(`Creando directorio de conocimiento en ${knowledgeDirPath}`);
      fs.mkdirSync(knowledgeDirPath, { recursive: true });
      logger.info(`No hay archivos para procesar. Crea subdirectorios y añade archivos a ${knowledgeDirPath}`);
      return;
    }

    logger.info(`Procesando todo el conocimiento en ${knowledgeDirPath}`);
    
    // Process the entire directory structure
    await processDirectory(knowledgeDirPath, chunkSize);
    
    logger.info('Todo el conocimiento procesado correctamente');
  } catch (error) {
    logger.error('Error al procesar el directorio de conocimiento:', error);
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    logger.info('Inicializando base de datos...');
    await initDatabase();
    
    const knowledgeDirPath = path.join(process.cwd(), 'knowledge');
    
    switch (mode) {
      case 'all':
        await processAllKnowledge(chunkSize);
        break;
      
      case 'directory':
        const dirPath = path.join(knowledgeDirPath, directory);
        await processDirectory(dirPath, chunkSize);
        break;
      
      case 'file':
        const filePath = path.join(knowledgeDirPath, fileName);
        await processFile(filePath, chunkSize);
        break;
      
      default:
        logger.error(`Modo inválido: ${mode}`);
        showUsage();
    }
    
    logger.info('Ingestión de conocimiento completada.');
    process.exit(0);
  } catch (error) {
    logger.error('Error durante la ingestión de conocimiento:', error);
    process.exit(1);
  }
}

// Run the script
main(); 