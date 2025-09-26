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
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../src/utils/logger");
const BASE_URL = 'https://nivel20.com';
const CAMPAIGN_URL = `${BASE_URL}/games/dnd-5/campaigns/76536-el-reposo-del-cuervo/characters`;
function fetchCharactersFromPage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = `${CAMPAIGN_URL}?page=${page}`;
            logger_1.logger.info(`Obteniendo personajes de la página ${page}: ${url}`);
            const response = yield axios_1.default.get(url);
            const $ = (0, cheerio_1.load)(response.data);
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
                .filter((char) => char !== null);
        }
        catch (error) {
            logger_1.logger.error(`Error al obtener la página ${page}:`, error);
            return [];
        }
    });
}
function fetchAllCharacters() {
    return __awaiter(this, void 0, void 0, function* () {
        const totalPages = 13;
        let allCharacters = [];
        for (let page = 1; page <= totalPages; page++) {
            const pageCharacters = yield fetchCharactersFromPage(page);
            allCharacters = [...allCharacters, ...pageCharacters];
            // Small delay to avoid hitting the server too quickly
            yield new Promise(resolve => setTimeout(resolve, 1000));
        }
        return allCharacters;
    });
}
function saveCharactersToFile(characters) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = path_1.default.join(__dirname, '../data/characters.txt');
        // Create directory if it doesn't exist
        const dir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const content = characters.map(char => `${char.name}: ${BASE_URL}${char.link}`).join('\n');
        fs_1.default.writeFileSync(outputPath, content);
        logger_1.logger.info(`Guardados ${characters.length} personajes en ${outputPath}`);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Comenzando a obtener todos los personajes...');
        const characters = yield fetchAllCharacters();
        logger_1.logger.info(`Se encontraron ${characters.length} personajes en total`);
        yield saveCharactersToFile(characters);
        logger_1.logger.info('¡Completado!');
    });
}
main().catch(error => {
    logger_1.logger.error('Error en la ejecución principal:', error);
    process.exit(1);
});
