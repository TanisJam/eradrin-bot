import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import CharacterService from '../services/Character.service';
import Character from '../database/models/Character';
import { BODY_PARTS } from '../types/Combat.type';

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
        where: { userId: interaction.user.id }
      });

      if (!attackerChar) {
        attackerChar = await CharacterService.generateRandomCharacter(
          interaction.user.id,
          interaction.user.username
        );
      }

      let defenderChar = await Character.findOne({
        where: { userId: targetUser.id }
      });

      if (!defenderChar) {
        defenderChar = await CharacterService.generateRandomCharacter(
          targetUser.id,
          targetUser.username
        );
      }

      // Ejecutar el ataque a una parte del cuerpo aleatoria
      const result = await CharacterService.attack(
        attackerChar.id,
        defenderChar.id,
        BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)]
      );

      await interaction.editReply(result.description);
    } catch (dbError) {
      console.error('Error de base de datos:', dbError);
      await interaction.editReply('Error al acceder a la base de datos. Por favor, inténtalo de nuevo.');
    }
  } catch (error) {
    console.error('Error en comando bonk:', error);
    await interaction.editReply('Ocurrió un error al ejecutar el bonk');
  }
}
