import { initDatabase } from '../src/database/config';
import KnowledgeChunk from '../src/database/models/KnowledgeChunk';
import { Op } from 'sequelize';

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

const source = params.source || '';
const query = params.query || '';
const limit = parseInt(params.limit || '10', 10);

/**
 * Display summary statistics about the knowledge base
 */
async function showStats(): Promise<void> {
  try {
    // Get total count of chunks
    const totalChunks = await KnowledgeChunk.count();
    
    // Get count by source
    const sources = await KnowledgeChunk.findAll({
      attributes: ['metadata'],
      raw: true
    });
    
    const sourceStats: Record<string, number> = {};
    sources.forEach(chunk => {
      try {
        const metadata = JSON.parse(chunk.metadata);
        const source = metadata.source || 'unknown';
        sourceStats[source] = (sourceStats[source] || 0) + 1;
      } catch (e) {
        // Skip if metadata can't be parsed
      }
    });
    
    console.log('\n=== Knowledge Base Statistics ===');
    console.log(`Total chunks: ${totalChunks}`);
    console.log('\nChunks by source:');
    
    if (Object.keys(sourceStats).length === 0) {
      console.log('  No source data found');
    } else {
      Object.entries(sourceStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`  ${source}: ${count} chunks`);
        });
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error getting statistics:', error);
  }
}

/**
 * Search for chunks matching a query
 */
async function searchChunks(query: string, sourceFilter?: string, limit = 5): Promise<void> {
  try {
    const whereConditions: any[] = [];
    
    // Add content search condition
    if (query) {
      whereConditions.push({
        content: {
          [Op.like]: `%${query}%`
        }
      });
    }
    
    // Add source filter if provided
    if (sourceFilter) {
      const chunks = await KnowledgeChunk.findAll({
        attributes: ['id', 'metadata'],
        raw: true
      });
      
      const matchingIds = chunks
        .filter(chunk => {
          try {
            const metadata = JSON.parse(chunk.metadata);
            return metadata.source && metadata.source.toLowerCase() === sourceFilter.toLowerCase();
          } catch (e) {
            return false;
          }
        })
        .map(chunk => chunk.id);
      
      if (matchingIds.length > 0) {
        whereConditions.push({
          id: {
            [Op.in]: matchingIds
          }
        });
      } else {
        console.log(`No chunks found with source: ${sourceFilter}`);
        return;
      }
    }
    
    // Build the final where clause
    const whereClause = whereConditions.length > 0
      ? { [Op.and]: whereConditions }
      : {};
    
    // Execute the search
    const chunks = await KnowledgeChunk.findAll({
      where: whereClause,
      limit,
      order: [['id', 'ASC']]
    });
    
    if (chunks.length === 0) {
      console.log('No matching chunks found');
      return;
    }
    
    console.log(`\n=== Found ${chunks.length} matching chunks ===\n`);
    
    chunks.forEach((chunk, index) => {
      try {
        const metadata = JSON.parse(chunk.metadata);
        const source = metadata.source || 'unknown';
        const fileName = metadata.fileName || '';
        
        console.log(`[${index + 1}] Chunk #${chunk.id} (Source: ${source}${fileName ? ', File: ' + fileName : ''})`);
        console.log('-----------------------------------------------------------');
        console.log(chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''));
        console.log('-----------------------------------------------------------\n');
      } catch (e) {
        console.log(`[${index + 1}] Chunk #${chunk.id} (Error parsing metadata)`);
        console.log('-----------------------------------------------------------');
        console.log(chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''));
        console.log('-----------------------------------------------------------\n');
      }
    });
    
  } catch (error) {
    console.error('Error searching chunks:', error);
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    console.log('Connecting to database...');
    await initDatabase();
    
    // Show stats
    await showStats();
    
    // If query is provided, search for chunks
    if (query) {
      await searchChunks(query, source, limit);
    } else if (source) {
      // If only source is provided, show chunks from that source
      await searchChunks('', source, limit);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Show usage
function showUsage() {
  console.log(`
Usage: pnpm verify-knowledge [-- options]

Options:
  --query=<text>     Search for chunks containing this text
  --source=<name>    Filter by source category
  --limit=<number>   Maximum number of results to show (default: 10)

Examples:
  # Show general statistics
  pnpm verify-knowledge

  # Search for chunks about "Elowen"
  pnpm verify-knowledge -- --query=Elowen

  # Show chunks from the player-characters source
  pnpm verify-knowledge -- --source=player-characters

  # Search for "Elowen" in player-characters source
  pnpm verify-knowledge -- --query=Elowen --source=player-characters
`);
}

// Check if help is requested
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Run the script
main(); 