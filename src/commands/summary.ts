import { CommandInteraction, SlashCommandBuilder, TextChannel, Client, Message, Collection } from 'discord.js';
import { getAiModel } from '../ai-model';

const systemInstruction =
  'Eres un asistente de resumen de conversaciones. Tu tarea es analizar una serie de mensajes de una conversación de Discord y proporcionar un resumen conciso y claro de los principales temas discutidos, puntos clave, decisiones tomadas o cualquier información importante compartida. Mantén un tono neutral y objetivo. Organiza tu resumen de manera coherente, agrupando temas relacionados. Cuando respondas adoptaras la perspectiva de Eradrin, el tabernero y dueño del Reposo del Cuervo, le contarás al usuario de lo que se estuvo hablando como si lo hubieras escuchado tú mismo, en la taberna. Tu personalidad es un poco tosca, pero valoras la determinación y el coraje en los aventureros. No te dejas tomar el pelo; si detectas que alguien está intentando burlarse de ti, no dudes en responder con firmeza y un toque de sarcasmo. Responde de manera directa y concisa. Actualmente, te encuentras detrás de la barra, acomodando botellas y escuchando las conversaciones de los aventureros que ya conoces.';

const model = getAiModel(systemInstruction);

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

// Limitación aproximada de tokens para evitar exceder los límites del modelo
const MAX_TOKENS_ESTIMATE = 60000; // Límite conservador para modelos Gemini
const AVG_CHARS_PER_TOKEN = 4; // Estimación aproximada
const MAX_CHARS = MAX_TOKENS_ESTIMATE * AVG_CHARS_PER_TOKEN;

// Configuración de cooldown (en milisegundos)
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutos
const cooldowns = new Map<string, number>();

// Configuración de límites de mensajes
const DEFAULT_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LIMIT = 200;
const DISCORD_API_LIMIT = 100; // Límite de la API de Discord para obtener mensajes

export const data = new SlashCommandBuilder()
  .setName('summary')
  .setDescription('Resume los últimos mensajes del canal')
  .addIntegerOption((option) =>
    option
      .setName('count')
      .setDescription(`Número de mensajes a resumir (máximo ${MAX_MESSAGE_LIMIT}, por defecto ${DEFAULT_MESSAGE_LIMIT})`)
      .setRequired(false)
  );

/**
 * Extrae solo el contenido de texto de un mensaje
 */
function extractMessageContent(msg: Message): string {
  // Solo retornamos el contenido de texto del mensaje
  return msg.content || '';
}

/**
 * Truncates the conversation text to stay within token limits
 */
function truncateConversation(conversationText: string): { text: string, wasTruncated: boolean } {
  if (conversationText.length <= MAX_CHARS) {
    return { text: conversationText, wasTruncated: false };
  }
  
  // Si necesitamos truncar, mantenemos los mensajes más recientes
  const lines = conversationText.split('\n');
  let truncatedText = '';
  let currentLength = 0;
  let wasTruncated = false;

  // Empezamos desde los mensajes más recientes (al final del array)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (currentLength + line.length + 1 <= MAX_CHARS) { // +1 por el salto de línea
      truncatedText = line + (truncatedText ? '\n' + truncatedText : '');
      currentLength += line.length + 1;
    } else {
      wasTruncated = true;
      break;
    }
  }
  
  return { text: truncatedText, wasTruncated };
}

/**
 * Verifica si un usuario está en cooldown y retorna el tiempo restante en segundos
 */
function checkCooldown(userId: string): number {
  const now = Date.now();
  const lastUsed = cooldowns.get(userId);
  
  if (lastUsed) {
    const timeLeft = COOLDOWN_TIME - (now - lastUsed);
    if (timeLeft > 0) {
      return Math.ceil(timeLeft / 1000); // Convertir a segundos
    }
  }
  
  // No hay cooldown activo, actualizar el timestamp
  cooldowns.set(userId, now);
  return 0;
}

/**
 * Formatea el tiempo de cooldown en un formato legible
 */
function formatTimeLeft(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''} y ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
  } else {
    return `${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Obtiene mensajes respetando los límites de la API de Discord
 */
async function fetchMessages(channel: TextChannel, limit: number): Promise<Collection<string, Message>> {
  let allMessages = new Collection<string, Message>();
  
  if (limit <= DISCORD_API_LIMIT) {
    // Si está dentro del límite de la API, hacer una sola solicitud
    return await channel.messages.fetch({ limit });
  }
  
  // Si necesitamos más mensajes que el límite de la API, hacemos múltiples solicitudes
  let lastMessageId: string | undefined = undefined;
  let fetchedCount = 0;
  
  while (fetchedCount < limit) {
    const fetchCount = Math.min(limit - fetchedCount, DISCORD_API_LIMIT);
    const options: { limit: number; before?: string } = { limit: fetchCount };
    
    // Si tenemos un ID del último mensaje, usarlo como punto de referencia
    if (lastMessageId) {
      options.before = lastMessageId;
    }
    
    const messages = await channel.messages.fetch(options);
    
    if (messages.size === 0) break;
    
    // Añadir mensajes a la colección
    for (const [id, message] of messages) {
      allMessages.set(id, message);
    }
    
    fetchedCount += messages.size;
    
    // Obtener el último mensaje para la próxima solicitud
    const messagesArray = Array.from(messages.values());
    if (messagesArray.length > 0) {
      lastMessageId = messagesArray[messagesArray.length - 1].id;
    } else {
      break;
    }
  }
  
  return allMessages;
}

export async function execute(interaction: CommandInteraction, client: Client) {
  if (!interaction.channel) {
    await interaction.reply('Este comando solo puede ser usado en canales de texto.');
    return;
  }
  
  // Comprobar cooldown
  const userId = interaction.user.id;
  const cooldownTime = checkCooldown(userId);
  
  if (cooldownTime > 0) {
    await interaction.reply({
      content: `Debes esperar ${formatTimeLeft(cooldownTime)} antes de usar este comando nuevamente.`,
      ephemeral: true // Solo el usuario que ejecutó el comando puede ver este mensaje
    });
    return;
  }

  await interaction.deferReply();
  
  try {
    const count = interaction.options.get('count')?.value as number || DEFAULT_MESSAGE_LIMIT;
    const limit = Math.min(count, MAX_MESSAGE_LIMIT); // Limitar al máximo configurado

    const channel = interaction.channel as TextChannel;
    
    // Usar la función personalizada para obtener mensajes respetando el límite de la API
    const messages = await fetchMessages(channel, limit);

    if (messages.size === 0) {
      await interaction.editReply('No hay mensajes para resumir en este canal.');
      return;
    }

    // Convertir los mensajes a formato de texto para el modelo
    const messagesArray = Array.from(messages.values())
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp) // Ordenar de más antiguo a más reciente
      .filter(msg => msg.content && msg.content.trim().length > 0); // Solo mensajes con texto
      
    if (messagesArray.length === 0) {
      await interaction.editReply('No hay mensajes de texto para resumir en este canal.');
      return;
    }
      
    const rawConversationText = messagesArray
      .map(msg => {
        const content = extractMessageContent(msg);
        return content ? `${msg.author.username}: ${content}` : '';
      })
      .filter(text => text.length > 0) // Filtrar mensajes vacíos
      .join('\n');
    
    if (!rawConversationText.trim()) {
      await interaction.editReply('No hay suficiente contenido para resumir en los mensajes recientes.');
      return;
    }

    // Verificar si necesitamos truncar la conversación
    const { text: conversationText, wasTruncated } = truncateConversation(rawConversationText);
    
    const chatSession = model.startChat({
      generationConfig,
    });

    const prompt = `Por favor resume la siguiente conversación de Discord:\n\n${conversationText}`;
    const result = await chatSession.sendMessage(prompt);
    const summary = result.response.text();

    let responseText = `**Resumen de los últimos ${messagesArray.length} mensajes:**\n\n${summary}`;
    
    if (wasTruncated) {
      responseText += '\n\n*Nota: La conversación era muy larga y se resumieron solo los mensajes más recientes.*';
    }

    await interaction.editReply(responseText);
  } catch (error) {
    console.error('Error al resumir mensajes:', error);
    await interaction.editReply('Hubo un error al intentar resumir los mensajes. Por favor intenta de nuevo más tarde.');
    
    // Si hay un error, eliminamos el cooldown para que el usuario pueda volver a intentarlo
    cooldowns.delete(userId);
  }
} 