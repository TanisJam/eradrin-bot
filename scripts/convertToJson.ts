import fs from 'fs';
import path from 'path';
import { logger } from '../src/utils/logger';

// Read the characters.txt file
const filePath = path.join(__dirname, '../data/characters.txt');
const outputPath = path.join(__dirname, '../data/characters.json');

// Read the file content
const fileContent = fs.readFileSync(filePath, 'utf8');

// Parse each line
const characters = fileContent.split('\n')
  .filter(line => line.trim() !== '') // Remove empty lines
  .map(line => {
    // Split the line into name and url using the first colon
    const [name, url] = line.split(': ');
    
    // Add .json to the end of the URL
    const jsonUrl = `${url}.json`;
    
    return {
      name,
      url: jsonUrl
    };
  });

// Convert to JSON
const jsonContent = JSON.stringify(characters, null, 2);

// Write to file
fs.writeFileSync(outputPath, jsonContent);

logger.info(`Convertidos ${characters.length} personajes a formato JSON`);
logger.info(`Guardado en ${outputPath}`); 