"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../src/utils/logger");
// Read the characters.txt file
const filePath = path_1.default.join(__dirname, '../data/characters.txt');
const outputPath = path_1.default.join(__dirname, '../data/characters.json');
// Read the file content
const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
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
fs_1.default.writeFileSync(outputPath, jsonContent);
logger_1.logger.info(`Convertidos ${characters.length} personajes a formato JSON`);
logger_1.logger.info(`Guardado en ${outputPath}`);
