import { initDatabase } from '../src/database/config';
import KnowledgeChunk from '../src/database/models/KnowledgeChunk';
import readline from 'readline';
import { logger } from '../src/utils/logger';

// Process command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const source = args.find(arg => arg.startsWith('--source='))?.split('=')[1] || '';

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Clear all knowledge chunks
 */
async function clearAllKnowledge(): Promise<void> {
  try {
    const count = await KnowledgeChunk.count();
    
    if (count === 0) {
      logger.info('No se encontraron fragmentos de conocimiento en la base de datos.');
      return;
    }
    
    await KnowledgeChunk.destroy({ where: {}, truncate: true });
    logger.info(`Se eliminaron correctamente todos los ${count} fragmentos de conocimiento.`);
  } catch (error) {
    logger.error('Error al eliminar fragmentos de conocimiento:', error);
  }
}

/**
 * Clear knowledge chunks from a specific source
 */
async function clearSourceKnowledge(source: string): Promise<void> {
  try {
    // Get all chunks
    const chunks = await KnowledgeChunk.findAll({
      attributes: ['id', 'metadata'],
      raw: true
    });
    
    // Filter chunks by source
    const chunksToDelete = chunks.filter(chunk => {
      try {
        const metadata = JSON.parse(chunk.metadata);
        return metadata.source && metadata.source.toLowerCase() === source.toLowerCase();
      } catch (e) {
        return false;
      }
    });
    
    if (chunksToDelete.length === 0) {
      logger.info(`No se encontraron fragmentos de conocimiento con la fuente: ${source}`);
      return;
    }
    
    // Delete chunks by ID
    const chunkIds = chunksToDelete.map(chunk => chunk.id);
    await KnowledgeChunk.destroy({
      where: {
        id: chunkIds
      }
    });
    
    logger.info(`Se eliminaron correctamente ${chunksToDelete.length} fragmentos de conocimiento de la fuente: ${source}`);
  } catch (error) {
    logger.error('Error al eliminar fragmentos de conocimiento:', error);
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    logger.info('Conectando a la base de datos...');
    await initDatabase();
    
    if (source) {
      if (force) {
        await clearSourceKnowledge(source);
      } else {
        rl.question(`¿Estás seguro de que deseas eliminar todos los fragmentos de conocimiento de la fuente "${source}"? (s/N): `, async (answer) => {
          if (answer.toLowerCase() === 's') {
            await clearSourceKnowledge(source);
          } else {
            logger.info('Operación cancelada.');
          }
          rl.close();
        });
      }
    } else {
      if (force) {
        await clearAllKnowledge();
      } else {
        rl.question('¿Estás seguro de que deseas eliminar TODOS los fragmentos de conocimiento? Esta acción no se puede deshacer. (s/N): ', async (answer) => {
          if (answer.toLowerCase() === 's') {
            await clearAllKnowledge();
          } else {
            logger.info('Operación cancelada.');
          }
          rl.close();
        });
      }
    }
    
    // If force is true, we don't need to wait for user input, so close rl
    if (force) {
      rl.close();
    }
  } catch (error) {
    logger.error('Error:', error);
    rl.close();
    process.exit(1);
  }
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