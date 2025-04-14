import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { CharacterService } from '../services/Character.service';
import Character from '../database/models/Character';
import { BODY_PARTS } from '../types/Combat.type';
import { getAiModel } from '../ai-model';

// Crear una instancia del servicio
const characterService = new CharacterService();

const systemInstruction =
  'Eres un narrador de combates al estilo Dwarf Fortress. Te daré una descripción básica de un ataque y debes transformarla ' +
  'en una descripción breve pero impactante del daño físico causado. ' +
  'Incluye detalles anatómicos precisos y específicos sobre cómo se rompen huesos, se desgarran músculos o se dañan órganos. ' +
  'La descripción debe ser muy concisa (máximo 1-2 líneas) y añadir 1-2 emojis relacionados con el tipo de daño. ' +
  'Usa un lenguaje directo pero vívido que capture la esencia brutal de Dwarf Fortress. ' +
  'Ejemplo: "🦴💥 El impacto fractura el cráneo de X, enviando esquirlas de hueso al cerebro mientras la sangre brota por sus oídos."';

const model = getAiModel(systemInstruction);

const generationConfig = {
  temperature: 0.9,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 256,
};

export const data = new SlashCommandBuilder()
  .setName('bonk')
  .setDescription('Dale un bonk a otro usuario')
  .addUserOption((option) =>
    option
      .setName('target')
      .setDescription('Usuario a bonkear')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('target');
    if (!targetUser) {
      await interaction.editReply('Debes seleccionar un usuario válido');
      return;
    }

    if (targetUser.id === interaction.user.id) {
      await interaction.editReply('No puedes bonkearte a ti mismo');
      return;
    }

    try {
      // Obtener o crear personajes
      let attackerChar = await Character.findOne({
        where: { userId: interaction.user.id },
      });

      if (!attackerChar) {
        attackerChar = await characterService.generateRandomCharacter(
          interaction.user.id,
          interaction.user.username
        );
      }

      let defenderChar = await Character.findOne({
        where: { userId: targetUser.id },
      });

      if (!defenderChar) {
        defenderChar = await characterService.generateRandomCharacter(
          targetUser.id,
          targetUser.username
        );
      }

      // Ejecutar el ataque a una parte del cuerpo aleatoria
      const result = await characterService.attack(
        attackerChar.id,
        defenderChar.id,
        BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)]
      );

      // Mejorar la descripción usando AI
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      const enhancedResult = await chatSession.sendMessage(result.description);
      const enhancedDescription = enhancedResult.response.text();

      // Crear el embed con los avatares y la descripción mejorada
      const embed = {
        color: 0xff0000,
        author: {
          name: `Bonk!`,
        },
        description: enhancedDescription,
      };

      // Enviar mensaje con los avatares como archivos adjuntos
      await interaction.editReply({
        content: `# ${interaction.user.displayName} :right_facing_fist: ${targetUser.displayName}`,
        embeds: [embed],
        files: [
          {
            attachment: interaction.user.displayAvatarURL({ size: 128 }),
            name: 'attacker.png',
          },
          {
            attachment: targetUser.displayAvatarURL({ size: 128 }),
            name: 'defender.png',
          },
        ],
      });
    } catch (dbError) {
      console.error('Error de base de datos:', dbError);
      await interaction.editReply(
        'Error al acceder a la base de datos. Por favor, inténtalo de nuevo.'
      );
    }
  } catch (error) {
    console.error('Error en comando bonk:', error);
    await interaction.editReply('Ocurrió un error al ejecutar el bonk');
  }
}
