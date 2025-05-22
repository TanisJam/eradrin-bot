import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Character {
  name: string;
  link: string;
}

const BASE_URL = 'https://nivel20.com';
const CAMPAIGN_URL = `${BASE_URL}/games/dnd-5/campaigns/76536-el-reposo-del-cuervo/characters`;

async function fetchCharactersFromPage(page: number): Promise<Character[]> {
  try {
    const url = `${CAMPAIGN_URL}?page=${page}`;
    console.log(`Fetching characters from page ${page}: ${url}`);
    
    const response = await axios.get(url);
    const $ = load(response.data);
    
    return $('.campaign-characters .character-desc')
      .map((_, el) => {
        const character = $(el);
        const name = character.find('a').text().trim();
        const link = character.find('a').attr('href');
        
        if (name && link) {
          return { name, link };
        }
        return null;
      })
      .get()
      .filter((char): char is Character => char !== null);
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    return [];
  }
}

async function fetchAllCharacters(): Promise<Character[]> {
  const totalPages = 13;
  let allCharacters: Character[] = [];
  
  for (let page = 1; page <= totalPages; page++) {
    const pageCharacters = await fetchCharactersFromPage(page);
    allCharacters = [...allCharacters, ...pageCharacters];
    
    // Small delay to avoid hitting the server too quickly
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return allCharacters;
}

async function saveCharactersToFile(characters: Character[]): Promise<void> {
  const outputPath = path.join(__dirname, '../../data/characters.txt');
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = characters.map(char => `${char.name}: ${BASE_URL}${char.link}`).join('\n');
  fs.writeFileSync(outputPath, content);
  
  console.log(`Saved ${characters.length} characters to ${outputPath}`);
}

async function main() {
  console.log('Starting to fetch all characters...');
  const characters = await fetchAllCharacters();
  console.log(`Found ${characters.length} characters total`);
  
  await saveCharactersToFile(characters);
  console.log('Done!');
}

main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
}); 