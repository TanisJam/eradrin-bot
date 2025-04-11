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
const COOLDOWN_TIME = 1 * 60 * 1000; // 1 minuto
const cooldowns = new Map<string, number>();

// Configuración de límites de mensajes
const DEFAULT_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LIMIT = 200;
const DISCORD_API_LIMIT = 100; // Límite de la API de Discord para obtener mensajes
const DISCORD_MESSAGE_CHAR_LIMIT = 2000; // Límite de caracteres para mensajes de Discord

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

/**
 * Divide un texto largo en múltiples partes para respetar el límite de caracteres de Discord
 */
function splitMessageContent(content: string, charLimit: number = DISCORD_MESSAGE_CHAR_LIMIT): string[] {
  if (content.length <= charLimit) {
    return [content];
  }
  
  const parts: string[] = [];
  let currentPart = '';
  
  // Dividir por párrafos para evitar cortar en medio de una oración
  const paragraphs = content.split('\n\n');
  
  for (const paragraph of paragraphs) {
    // Si el párrafo por sí solo excede el límite, dividirlo por líneas
    if (paragraph.length > charLimit) {
      const lines = paragraph.split('\n');
      
      for (const line of lines) {
        // Si la línea por sí sola excede el límite, dividirla por fragmentos
        if (line.length > charLimit) {
          let remainingLine = line;
          
          while (remainingLine.length > 0) {
            // Encontrar un buen punto de división (preferiblemente al final de una oración o después de un espacio)
            let cutPoint = charLimit;
            if (cutPoint < remainingLine.length) {
              // Buscar el último punto o espacio antes del límite
              const lastPeriod = remainingLine.lastIndexOf('.', cutPoint);
              const lastSpace = remainingLine.lastIndexOf(' ', cutPoint);
              
              if (lastPeriod > 0 && lastPeriod > cutPoint - 30) {
                cutPoint = lastPeriod + 1; // Incluir el punto
              } else if (lastSpace > 0) {
                cutPoint = lastSpace + 1; // Incluir el espacio
              }
            }
            
            // Si no cabe en la parte actual, añadir nueva parte
            if (currentPart.length + remainingLine.slice(0, cutPoint).length > charLimit) {
              parts.push(currentPart);
              currentPart = remainingLine.slice(0, cutPoint);
            } else {
              currentPart += (currentPart.length > 0 ? '\n' : '') + remainingLine.slice(0, cutPoint);
            }
            
            // Preparar para la próxima iteración
            remainingLine = remainingLine.slice(cutPoint);
            
            // Si la parte actual está llena, añadirla a las partes y reiniciar
            if (currentPart.length >= charLimit * 0.9) {
              parts.push(currentPart);
              currentPart = '';
            }
          }
        } else {
          // Si la línea cabe en la parte actual, añadirla
          if (currentPart.length + line.length + 1 > charLimit) {
            parts.push(currentPart);
            currentPart = line;
          } else {
            currentPart += (currentPart.length > 0 ? '\n' : '') + line;
          }
        }
      }
    } else {
      // Si el párrafo cabe en la parte actual, añadirlo
      if (currentPart.length + paragraph.length + 2 > charLimit) {
        parts.push(currentPart);
        currentPart = paragraph;
      } else {
        currentPart += (currentPart.length > 0 ? '\n\n' : '') + paragraph;
      }
    }
  }
  
  // Añadir la última parte si no está vacía
  if (currentPart.length > 0) {
    parts.push(currentPart);
  }
  
  return parts;
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

    let summaryText = `**Resumen de los últimos ${messagesArray.length} mensajes:**\n\n${summary}`;
    
    if (wasTruncated) {
      summaryText += '\n\n*Nota: La conversación era muy larga y se resumieron solo los mensajes más recientes.*';
    }

    // Dividir el mensaje si es demasiado largo
    const messageParts = splitMessageContent(summaryText);
    
    // Enviar la primera parte como respuesta
    await interaction.editReply(messageParts[0]);
    
    // Enviar partes adicionales como mensajes de seguimiento
    if (messageParts.length > 1) {
      for (let i = 1; i < messageParts.length; i++) {
        await channel.send(messageParts[i]);
      }
    }
  } catch (error) {
    console.error('Error al resumir mensajes:', error);
    await interaction.editReply('Hubo un error al intentar resumir los mensajes. Por favor intenta de nuevo más tarde.');
    
    // Si hay un error, eliminamos el cooldown para que el usuario pueda volver a intentarlo
    cooldowns.delete(userId);
  }
} 