import fs from 'fs';
import path from 'path';
import { initDatabase } from '../database/config';
import RAGService from '../services/RAG.service';

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
  Usage: pnpm ingest-knowledge [-- options]
  
  Options:
    --mode       Mode of operation: 'all' processes entire knowledge directory, 
                'directory' processes a specific directory, 'file' processes a specific file.
                Default: all
    --directory  (Only in directory mode) Name of the directory in knowledge/ to process
    --file       (Only in file mode) Path to file relative to knowledge/ directory
    --chunkSize  Size of text chunks in characters (default: 500)
  
  Examples:
    # Process entire knowledge directory structure:
    pnpm ingest-knowledge

    # Process all files in a specific directory:
    pnpm ingest-knowledge -- --mode=directory --directory=player-characters
    
    # Process a single file:
    pnpm ingest-knowledge -- --mode=file --file=player-characters/elowen.txt
    
    # Process all files with custom chunk size:
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
  console.error('Error: Directory mode requires --directory parameter');
  showUsage();
}

if (mode === 'file' && !fileName) {
  console.error('Error: File mode requires --file parameter');
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
      console.error(`Error: File "${filePath}" not found`);
      return;
    }

    console.log(`Processing file: ${filePath}`);
    console.log(`Source: ${source}`);
    console.log(`Chunk size: ${chunkSize} characters`);

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`File size: ${fileContent.length} characters`);

    // Ingest the knowledge
    const chunkCount = await RAGService.ingestKnowledge(
      fileContent,
      chunkSize,
      { source, fileName }
    );

    console.log(`Successfully processed ${fileName}`);
    console.log(`Created ${chunkCount} knowledge chunks`);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Process all files in a directory
async function processDirectory(dirPath: string, chunkSize: number): Promise<void> {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      console.error(`Error: Directory "${dirPath}" not found`);
      return;
    }

    console.log(`Processing directory: ${dirPath}`);
    
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
      console.log(`No text files found in ${dirPath}`);
      return;
    }

    console.log(`Found ${files.length} text files to process`);
    
    // Process each file
    for (const file of files) {
      await processFile(file, chunkSize);
    }
    
    console.log(`All files in ${dirPath} processed successfully`);
  } catch (error) {
    console.error('Error processing directory:', error);
  }
}

// Process the entire knowledge directory with all subdirectories
async function processAllKnowledge(chunkSize: number): Promise<void> {
  try {
    const knowledgeDirPath = path.join(process.cwd(), 'knowledge');
    
    // Check if knowledge directory exists
    if (!fs.existsSync(knowledgeDirPath)) {
      console.log(`Creating knowledge directory at ${knowledgeDirPath}`);
      fs.mkdirSync(knowledgeDirPath, { recursive: true });
      console.log(`No files to process. Create subdirectories and add files to ${knowledgeDirPath}`);
      return;
    }

    console.log(`Processing all knowledge in ${knowledgeDirPath}`);
    
    // Process the entire directory structure
    await processDirectory(knowledgeDirPath, chunkSize);
    
    console.log('All knowledge processed successfully');
  } catch (error) {
    console.error('Error processing knowledge directory:', error);
  }
}

// Main function
async function main() {
  try {
    // Initialize database
    console.log('Initializing database...');
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
        console.error(`Invalid mode: ${mode}`);
        showUsage();
    }
    
    console.log('Knowledge ingestion completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during knowledge ingestion:', error);
    process.exit(1);
  }
}

// Run the script
main(); 