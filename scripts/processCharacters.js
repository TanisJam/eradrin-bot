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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../src/utils/logger");
// Ruta a los archivos
const charactersFilePath = path_1.default.join(__dirname, '../data/characters.json');
const outputDir = path_1.default.join(__dirname, '../knowledge/player-characters');
// Asegurar que el directorio existe
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
// Función para sanitizar nombres de archivo
function sanitizeFilename(filename) {
    return filename
        .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .toLowerCase();
}
// Función para convertir a formato markdown
function createMarkdownContent(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    let content = `# ${((_b = (_a = data.printable_hash) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.name) || 'Personaje'}\n\n`;
    // Agregar campos solo si existen
    if ((_d = (_c = data.printable_hash) === null || _c === void 0 ? void 0 : _c.info) === null || _d === void 0 ? void 0 : _d.level_desc) {
        content += `**Nivel:** ${data.printable_hash.info.level_desc}\n\n`;
    }
    if ((_f = (_e = data.printable_hash) === null || _e === void 0 ? void 0 : _e.info) === null || _f === void 0 ? void 0 : _f.race_name) {
        content += `**Raza:** ${data.printable_hash.info.race_name}`;
        // Añadir subraza si existe
        if ((_h = (_g = data.printable_hash) === null || _g === void 0 ? void 0 : _g.info) === null || _h === void 0 ? void 0 : _h.subrace_name) {
            content += ` (${data.printable_hash.info.subrace_name})`;
        }
        content += '\n\n';
    }
    // Campos adicionales
    if ((_k = (_j = data.printable_hash) === null || _j === void 0 ? void 0 : _j.fields) === null || _k === void 0 ? void 0 : _k.alineamiento) {
        content += `## Alineamiento\n${data.printable_hash.fields.alineamiento}\n\n`;
    }
    if ((_m = (_l = data.printable_hash) === null || _l === void 0 ? void 0 : _l.fields) === null || _m === void 0 ? void 0 : _m.apariencia) {
        content += `## Apariencia\n${data.printable_hash.fields.apariencia}\n\n`;
    }
    if ((_p = (_o = data.printable_hash) === null || _o === void 0 ? void 0 : _o.fields) === null || _p === void 0 ? void 0 : _p.edad) {
        content += `## Edad\n${data.printable_hash.fields.edad}\n\n`;
    }
    if ((_r = (_q = data.printable_hash) === null || _q === void 0 ? void 0 : _q.fields) === null || _r === void 0 ? void 0 : _r.historia) {
        content += `## Historia\n${data.printable_hash.fields.historia}\n\n`;
    }
    return content;
}
// Función para procesar un personaje
function processCharacter(character) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info(`Procesando: ${character.name} (${character.url})`);
            const response = yield axios_1.default.get(character.url);
            const data = response.data;
            if (!data || !data.printable_hash) {
                logger_1.logger.warn(`No se encontraron datos para: ${character.name}`);
                return;
            }
            const markdown = createMarkdownContent(data);
            const filename = sanitizeFilename(character.name);
            const outputPath = path_1.default.join(outputDir, `${filename}.md`);
            fs_1.default.writeFileSync(outputPath, markdown);
            logger_1.logger.info(`Archivo creado: ${outputPath}`);
        }
        catch (error) {
            logger_1.logger.error(`Error procesando ${character.name}:`, error);
        }
    });
}
// Función principal
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Leer el archivo JSON
            const charactersData = JSON.parse(fs_1.default.readFileSync(charactersFilePath, 'utf8'));
            logger_1.logger.info(`Encontrados ${charactersData.length} personajes para procesar`);
            // Procesar cada personaje con un pequeño retraso entre solicitudes
            for (let i = 0; i < charactersData.length; i++) {
                yield processCharacter(charactersData[i]);
                // Pequeña pausa entre solicitudes para no sobrecargar el servidor
                if (i < charactersData.length - 1) {
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            logger_1.logger.info('Procesamiento completado!');
        }
        catch (error) {
            logger_1.logger.error('Error en el proceso:', error);
        }
    });
}
// Ejecutar programa principal
main().catch(error => {
    logger_1.logger.error('Error general:', error);
    process.exit(1);
});
