import { Client, GatewayIntentBits, TextChannel, Collection, Message, ThreadChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Configura el cliente con los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Variables para configurar
const CHANNEL_ID = process.env.CHANNEL_ID || '1064309394604556341'; // ID del canal a escanear
const OUTPUT_DIR = path.join(process.cwd(), 'knowledge', 'stories');

// Tipos
interface MessageData {
  id: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  content: string;
  createdAt: Date;
  threadId?: string;
}

// Función para crear un nombre de archivo a partir del contenido del mensaje
function createFilenameFromContent(content: string): string {
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
async function saveMessageAsMarkdown(message: MessageData, threads: Map<string, MessageData[]>) {
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
  console.log(`Mensaje guardado como ${filePath}`);
}

// Función para obtener todos los mensajes de un canal
async function fetchAllChannelMessages(channel: TextChannel): Promise<MessageData[]> {
  console.log(`Obteniendo mensajes del canal #${channel.name}...`);
  
  const allMessages: MessageData[] = [];
  let lastId: string | undefined;
  
  // Bucle para obtener todos los mensajes usando paginación
  while (true) {
    const options = { limit: 100 } as { limit: number; before?: string };
    if (lastId) options.before = lastId;
    
    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;
    
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
    
    lastId = messages.last()?.id;
    console.log(`Obtenidos ${messages.size} mensajes. Total: ${allMessages.length}`);
  }
  
  return allMessages;
}

// Función para obtener todos los hilos de un canal y sus mensajes
async function fetchAllThreadsWithMessages(channel: TextChannel): Promise<Map<string, MessageData[]>> {
  console.log(`Obteniendo hilos del canal #${channel.name}...`);
  
  // Obtener hilos activos
  const activeThreads = await channel.threads.fetchActive();
  // Obtener hilos archivados (públicos)
  const archivedThreadsPublic = await channel.threads.fetchArchived();
  // Obtener hilos archivados (privados)
  const archivedThreadsPrivate = await channel.threads.fetchArchived({ type: 'private' });
  
  // Combinar todos los hilos
  const allThreads = [
    ...activeThreads.threads.values(),
    ...archivedThreadsPublic.threads.values(), 
    ...archivedThreadsPrivate.threads.values()
  ];
  
  console.log(`Total de hilos encontrados: ${allThreads.length}`);
  
  // Mapa para relacionar mensajes principales con sus hilos
  const threadMessages = new Map<string, MessageData[]>();
  
  // Obtener mensajes de cada hilo
  for (const thread of allThreads) {
    // El ID del mensaje principal es el mismo que el del hilo en la mayoría de los casos
    const parentMessageId = thread.id;
    
    const messages = await fetchThreadMessagesSimple(thread);
    
    if (messages.length > 0) {
      threadMessages.set(parentMessageId, messages);
    }
  }
  
  return threadMessages;
}

// Función simplificada para obtener solo los mensajes de un hilo
async function fetchThreadMessagesSimple(thread: ThreadChannel): Promise<MessageData[]> {
  console.log(`Obteniendo mensajes del hilo #${thread.name}...`);
  
  const allMessages: MessageData[] = [];
  let lastId: string | undefined;
  
  while (true) {
    const options = { limit: 100 } as { limit: number; before?: string };
    if (lastId) options.before = lastId;
    
    const messages = await thread.messages.fetch(options);
    if (messages.size === 0) break;
    
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
    
    lastId = messages.last()?.id;
    console.log(`Obtenidos ${messages.size} mensajes del hilo. Total: ${allMessages.length}`);
  }
  
  return allMessages;
}

// Función principal
async function main() {
  try {
    console.log('Iniciando script para obtener mensajes...');
    
    if (!CHANNEL_ID) {
      console.error('Error: CHANNEL_ID no está configurado. Configúralo en el archivo .env o directamente en el script.');
      process.exit(1);
    }
    
    client.once('ready', async () => {
      console.log(`Bot conectado como ${client.user?.tag}`);
      
      try {
        // Obtener el canal
        const channel = await client.channels.fetch(CHANNEL_ID);
        
        if (!channel || !(channel instanceof TextChannel)) {
          console.error('Canal no encontrado o no es un canal de texto');
          process.exit(1);
        }
        
        // Obtener todos los hilos y sus mensajes primero
        const threadsWithMessages = await fetchAllThreadsWithMessages(channel);
        
        // Obtener mensajes del canal principal
        const channelMessages = await fetchAllChannelMessages(channel);
        
        // Guardar cada mensaje como un archivo markdown
        console.log('Guardando mensajes como archivos markdown...');
        for (const message of channelMessages) {
          await saveMessageAsMarkdown(message, threadsWithMessages);
        }
        
        console.log('Proceso completado con éxito');
        process.exit(0);
      } catch (error) {
        console.error('Error al procesar mensajes:', error);
        process.exit(1);
      }
    });
    
    // Iniciar sesión con el token del bot
    await client.login(process.env.TOKEN);
    
  } catch (error) {
    console.error('Error general:', error);
    process.exit(1);
  }
}

main().catch(console.error); 