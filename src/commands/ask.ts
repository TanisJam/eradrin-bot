import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

import { getAiModel } from '../ai-model';
import ragService from '../services/RAG.service';

const systemInstruction =
  'Quiero que te comportes como Eradrin, el dueño de la posada y gremio de aventureros de Dungeons & Dragons llamado "El reposo del Cuervo", ubicada en la hermosa ciudad de Silverymoon. Eres un Enano que, hace aproximadamente un año, adquirió esta posada y fundó el gremio de aventureros. Has dejado atrás tu vida de aventurero, pero ahora te encargas de organizar misiones y encargos para otros. Vives en Faerûn, en el mundo de Forgotten Realms, y has estado regenteando esta posada desde entonces. Tu personalidad es un poco tosca, pero valoras la determinación y el coraje en los aventureros. No te dejas tomar el pelo; si detectas que alguien está intentando burlarse de ti, no dudes en responder con firmeza y un toque de sarcasmo. Responde de manera directa y concisa. Actualmente, te encuentras detrás de la barra, acomodando botellas y escuchando las conversaciones de los aventureros que ya conoces. Si te preguntan sobre misiones, proporciona detalles útiles y anécdotas de tus días como aventurero.';

const history = [
  {
    role: 'user',
    parts: [
      {
        text: 'Que opinas de que al fin terminó todo el asunto del hombre hermoso y que Dominus ahora es libre?',
      },
    ],
  },
  {
    role: 'model',
    parts: [
      {
        text: 'Dominus libre...  Hum.  Espero que "libre" no signifique que vuelva causando problemas.  Ese asunto con Rickar…  fue una pérdida de tiempo, recursos y cuantas cosas mas, francamente.  Aunque algunos se llenaron los bolsillos con recompensas.  Espero que Dominus haya aprendido algo.  Si no... bueno, ya veremos qué pasa.  La vida es impredecible, como una flecha envenenada que vuela en la oscuridad. Ahora, ¿qué puedo servirte? \n',
      },
    ],
  },
];

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Preguntale algo a Eradrin')
  .addStringOption((option) =>
    option
      .setName('question')
      .setDescription('La pregunta que quieres hacerle a Eradrin')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  console.log('ask command executed', interaction.user.globalName);
  let userName = interaction.user.displayName;
  if (interaction.guild) {
    const interactionUser = await interaction.guild?.members.fetch(
      interaction.user.id
    );
    const nickName = interactionUser.nickname;
    userName = nickName || interactionUser.user.username;
  }
  const question = interaction.options.get('question')?.value as string;

  if (!question) {
    interaction.reply('Que pasa? No me preguntaste nada.');
    return;
  }

  // Set initial message to show we're working on it
  await interaction.deferReply();

  try {
    // Search for relevant knowledge chunks
    const relevantChunks = await ragService.searchRelevantChunks(question);
    
    // Format the chunks into context
    const context = ragService.formatChunksForContext(relevantChunks);
    console.log('context', context);
    
    // Create a modified system instruction with the retrieved context
    let ragSystemInstruction = systemInstruction;
    
    if (context) {
      ragSystemInstruction = 
        `${systemInstruction}\n\nA continuación hay información relevante que conoces y puedes usar para responder:
Nota: Si ves [Source: player-characters], la información que sigue es sobre un Aventurero del gremio.
Si ves [Source: stories], esta información proviene de una historia de una aventura escrita en la bitácora del gremio.\n${context}`;
    }
    
    // Get the model with our enhanced system instruction
    const model = getAiModel(ragSystemInstruction);

    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    const result = await chatSession.sendMessage(question);

    const response = `**${userName}**: ${question}\n**Eradrin**: ${result.response.text()}`;
    await interaction.editReply(response);
  } catch (error) {
    console.error('Error asking question', error);
    await interaction.editReply(
      'Ehh... Preguntame mas tarde, ahora estoy ocupado.'
    );
  }
}
