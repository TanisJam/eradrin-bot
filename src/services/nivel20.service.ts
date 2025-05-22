import axios from 'axios';
import { load } from 'cheerio';
import { Character } from '../types/Character';
import { CharacterSheet } from '../models/character-sheet';

const BASE_URL = 'https://nivel20.com';
const CAMPAIGN_URL = `${BASE_URL}/games/dnd-5/campaigns/76536-el-reposo-del-cuervo/characters`;

export class Nivel20Service {
  async searchCharacters(name: string): Promise<Character[]> {
    try {
      const response = await axios.get(`${CAMPAIGN_URL}?utf8=%E2%9C%93&q=${name}`);
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
      console.error('Error al buscar personajes', error);
      return [];
    }
  }

  async getCharacterStats(url: string): Promise<CharacterSheet | null> {
    const URL = `${BASE_URL}${url}`;
    try {
      const response = await axios.get(`${URL}.json`);
      const characterData = response.data;
      
      return new CharacterSheet(characterData, URL);
    } catch (error) {
      console.error('Error al cargar los stats del personaje', error);
      return null;
    }
  }
}
