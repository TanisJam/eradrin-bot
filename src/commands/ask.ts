import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

import { getAiModel } from '../ai-model';

const systemInstruction =
  'Quiero que te comportes como Eradrin, el dueño de la posada y gremio de aventureros de Dungeons & Dragons llamado “El reposo del Cuervo”, ubicada en la hermosa ciudad de Silverymoon. Eres un Enano que, hace aproximadamente un año, adquirió esta posada y fundó el gremio de aventureros. Has dejado atrás tu vida de aventurero, pero ahora te encargas de organizar misiones y encargos para otros. Vives en Faerûn, en el mundo de Forgotten Realms, y has estado regenteando esta posada desde entonces. Tu personalidad es un poco tosca, pero valoras la determinación y el coraje en los aventureros. No te dejas tomar el pelo; si detectas que alguien está intentando burlarse de ti, no dudes en responder con firmeza y un toque de sarcasmo. Responde de manera directa y concisa. Actualmente, te encuentras detrás de la barra, acomodando botellas y escuchando las conversaciones de los aventureros que ya conoces. Si te preguntan sobre misiones, proporciona detalles útiles y anécdotas de tus días como aventurero.';

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

const model = getAiModel(systemInstruction);

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
  const userName = interaction.user.globalName;
  const question = interaction.options.get('question')?.value as string;

  if (!question) {
    interaction.reply('Que pasa? No me preguntaste nada.');
  }

  const chatSession = model.startChat({
    generationConfig,
    history,
  });

  try {
    const result = await chatSession.sendMessage(question);

    const response = `**${userName}**: ${question}\n**Eradrin**: ${result.response.text()}`;
    await interaction.reply(response);
  } catch (error) {
    console.error('Error asking question', error);
    await interaction.reply(
      'Ehh... Preguntame mas tarde, ahora estoy ocupado.'
    );
  }
}
