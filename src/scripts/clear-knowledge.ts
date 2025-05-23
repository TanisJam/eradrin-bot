import { initDatabase } from '../database/config';
import KnowledgeChunk from '../database/models/KnowledgeChunk';
import readline from 'readline';

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
      console.log('No knowledge chunks found in the database.');
      return;
    }
    
    await KnowledgeChunk.destroy({ where: {}, truncate: true });
    console.log(`Successfully deleted all ${count} knowledge chunks.`);
  } catch (error) {
    console.error('Error clearing knowledge chunks:', error);
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
      console.log(`No knowledge chunks found with source: ${source}`);
      return;
    }
    
    // Delete chunks by ID
    const chunkIds = chunksToDelete.map(chunk => chunk.id);
    await KnowledgeChunk.destroy({
      where: {
        id: chunkIds
      }
    });
    
    console.log(`Successfully deleted ${chunksToDelete.length} knowledge chunks from source: ${source}`);
  } catch (error) {
    console.error('Error clearing knowledge chunks:', error);
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    console.log('Connecting to database...');
    await initDatabase();
    
    if (source) {
      if (force) {
        await clearSourceKnowledge(source);
      } else {
        rl.question(`Are you sure you want to delete all knowledge chunks from source "${source}"? (y/N): `, async (answer) => {
          if (answer.toLowerCase() === 'y') {
            await clearSourceKnowledge(source);
          } else {
            console.log('Operation cancelled.');
          }
          rl.close();
        });
      }
    } else {
      if (force) {
        await clearAllKnowledge();
      } else {
        rl.question('Are you sure you want to delete ALL knowledge chunks? This cannot be undone. (y/N): ', async (answer) => {
          if (answer.toLowerCase() === 'y') {
            await clearAllKnowledge();
          } else {
            console.log('Operation cancelled.');
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
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Show usage
function showUsage() {
  console.log(`
Usage: pnpm clear-knowledge [options]

Options:
  --force           Skip confirmation prompt
  --source=<name>   Clear only chunks from a specific source

Examples:
  # Clear all knowledge (with confirmation)
  pnpm clear-knowledge

  # Clear all knowledge without confirmation
  pnpm clear-knowledge --force

  # Clear only chunks from player-characters source
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