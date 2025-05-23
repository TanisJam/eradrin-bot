"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("../src/utils/logger");
dotenv.config();
// Configura el cliente con los intents necesarios
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ]
});
// Variables para configurar
const CHANNEL_ID = process.env.CHANNEL_ID || '1064309394604556341'; // ID del canal a escanear
const OUTPUT_DIR = path.join(process.cwd(), 'knowledge', 'stories');
// Función para crear un nombre de archivo a partir del contenido del mensaje
function createFilenameFromContent(content) {
    // Obtener las primeras 10 palabras o menos
    const words = content.trim().split(/\s+/).slice(0, 10);
    // Unir las palabras con guiones y limpiar caracteres no válidos para nombres de archivo
    return words.join('-')
        .replace(/[\/\\:*?"<>|]/g, '') // Eliminar caracteres no válidos para nombres de archivo
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .substring(0, 100) // Limitar longitud
        .toLowerCase() + '.md';
}
// Función para guardar un mensaje y sus hilos como archivo markdown
function saveMessageAsMarkdown(message, threads) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        // Crear nombre de archivo a partir del contenido
        const fileName = createFilenameFromContent(message.content);
        const filePath = path.join(OUTPUT_DIR, fileName);
        // Crear contenido del archivo markdown
        let markdownContent = `# ${message.content.substring(0, 200)}\n\n`;
        markdownContent += message.content + '\n\n';
        // Añadir hilos si existen
        const threadMessages = threads.get(message.id);
        if (threadMessages && threadMessages.length > 0) {
            markdownContent += '## Respuestas\n\n';
            threadMessages.forEach(reply => {
                markdownContent += `### ${reply.author.username} - ${new Date(reply.createdAt).toLocaleString()}\n\n`;
                markdownContent += reply.content + '\n\n';
            });
        }
        // Guardar archivo
        fs.writeFileSync(filePath, markdownContent);
        logger_1.logger.info(`Mensaje guardado como ${filePath}`);
    });
}
// Función para obtener todos los mensajes de un canal
function fetchAllChannelMessages(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        logger_1.logger.info(`Obteniendo mensajes del canal #${channel.name}...`);
        const allMessages = [];
        let lastId;
        // Bucle para obtener todos los mensajes usando paginación
        while (true) {
            const options = { limit: 100 };
            if (lastId)
                options.before = lastId;
            const messages = yield channel.messages.fetch(options);
            if (messages.size === 0)
                break;
            // Añadir mensajes a la colección
            messages.forEach(msg => {
                allMessages.push({
                    id: msg.id,
                    author: {
                        id: msg.author.id,
                        username: msg.author.username,
                        bot: msg.author.bot
                    },
                    content: msg.content,
                    createdAt: msg.createdAt
                });
            });
            lastId = (_a = messages.last()) === null || _a === void 0 ? void 0 : _a.id;
            logger_1.logger.info(`Obtenidos ${messages.size} mensajes. Total: ${allMessages.length}`);
        }
        return allMessages;
    });
}
// Función para obtener todos los hilos de un canal y sus mensajes
function fetchAllThreadsWithMessages(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Obteniendo hilos del canal #${channel.name}...`);
        // Obtener hilos activos
        const activeThreads = yield channel.threads.fetchActive();
        // Obtener hilos archivados (públicos)
        const archivedThreadsPublic = yield channel.threads.fetchArchived();
        // Obtener hilos archivados (privados)
        const archivedThreadsPrivate = yield channel.threads.fetchArchived({ type: 'private' });
        // Combinar todos los hilos
        const allThreads = [
            ...activeThreads.threads.values(),
            ...archivedThreadsPublic.threads.values(),
            ...archivedThreadsPrivate.threads.values()
        ];
        logger_1.logger.info(`Total de hilos encontrados: ${allThreads.length}`);
        // Mapa para relacionar mensajes principales con sus hilos
        const threadMessages = new Map();
        // Obtener mensajes de cada hilo
        for (const thread of allThreads) {
            // El ID del mensaje principal es el mismo que el del hilo en la mayoría de los casos
            const parentMessageId = thread.id;
            const messages = yield fetchThreadMessagesSimple(thread);
            if (messages.length > 0) {
                threadMessages.set(parentMessageId, messages);
            }
        }
        return threadMessages;
    });
}
// Función simplificada para obtener solo los mensajes de un hilo
function fetchThreadMessagesSimple(thread) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        logger_1.logger.info(`Obteniendo mensajes del hilo #${thread.name}...`);
        const allMessages = [];
        let lastId;
        while (true) {
            const options = { limit: 100 };
            if (lastId)
                options.before = lastId;
            const messages = yield thread.messages.fetch(options);
            if (messages.size === 0)
                break;
            messages.forEach(msg => {
                allMessages.push({
                    id: msg.id,
                    author: {
                        id: msg.author.id,
                        username: msg.author.username,
                        bot: msg.author.bot
                    },
                    content: msg.content,
                    createdAt: msg.createdAt,
                    threadId: thread.id
                });
            });
            lastId = (_a = messages.last()) === null || _a === void 0 ? void 0 : _a.id;
            logger_1.logger.info(`Obtenidos ${messages.size} mensajes del hilo. Total: ${allMessages.length}`);
        }
        return allMessages;
    });
}
// Función principal
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Iniciando script para obtener mensajes...');
            if (!CHANNEL_ID) {
                logger_1.logger.error('Error: CHANNEL_ID no está configurado. Configúralo en el archivo .env o directamente en el script.');
                process.exit(1);
            }
            client.once('ready', () => __awaiter(this, void 0, void 0, function* () {
                var _a;
                logger_1.logger.info(`Bot conectado como ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
                try {
                    // Obtener el canal
                    const channel = yield client.channels.fetch(CHANNEL_ID);
                    if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
                        logger_1.logger.error('Canal no encontrado o no es un canal de texto');
                        process.exit(1);
                    }
                    // Obtener todos los hilos y sus mensajes primero
                    const threadsWithMessages = yield fetchAllThreadsWithMessages(channel);
                    // Obtener mensajes del canal principal
                    const channelMessages = yield fetchAllChannelMessages(channel);
                    // Guardar cada mensaje como un archivo markdown
                    logger_1.logger.info('Guardando mensajes como archivos markdown...');
                    for (const message of channelMessages) {
                        yield saveMessageAsMarkdown(message, threadsWithMessages);
                    }
                    logger_1.logger.info('Proceso completado con éxito');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error al procesar mensajes:', error);
                    process.exit(1);
                }
            }));
            // Iniciar sesión con el token del bot
            yield client.login(process.env.TOKEN);
        }
        catch (error) {
            logger_1.logger.error('Error general:', error);
            process.exit(1);
        }
    });
}
main().catch(err => logger_1.logger.error('Error fatal:', err));
