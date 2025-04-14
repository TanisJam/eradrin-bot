import {
  CommandInteraction,
  SlashCommandBuilder,
  ComponentType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Nivel20Service } from '../services/nivel20.service';
import { createCharacterButtons } from '../utils/discord.utils';
import { CharacterService } from '../services/Character.service';
import Character from '../database/models/Character';
import BodyPart from '../database/models/BodyPart';

const INTERACTION_TIMEOUT = 60000; // 1 min
const nivel20Service = new Nivel20Service();
const characterService = new CharacterService();

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Ver o mejorar tu personaje')
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('Ver la información de tu personaje')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('train')
      .setDescription('Entrenar una estadística')
      .addStringOption(option =>
        option
          .setName('stat')
          .setDescription('Estadística a entrenar')
          .setRequired(true)
          .addChoices(
            { name: 'Fuerza', value: 'strength' },
            { name: 'Agilidad', value: 'agility' },
            { name: 'Resistencia', value: 'endurance' },
            { name: 'Recuperación', value: 'recovery' }
          )
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    // Buscar el personaje del usuario
    let character = await Character.findOne({
      where: { userId: interaction.user.id },
    });

    // Si no existe, crear uno nuevo
    if (!character) {
      character = await characterService.generateRandomCharacter(
        interaction.user.id,
        interaction.user.username
      );
    }

    // Obtener partes del cuerpo
    const bodyParts = await BodyPart.findAll({
      where: { characterId: character.id },
    });

    if (subcommand === 'view') {
      // Crear embed para mostrar información del personaje
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Personaje: ${character.name}`)
        .setDescription(`Raza: ${character.race}`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'Estadísticas', value: 
            `💪 Fuerza: ${character.stats.strength}\n` +
            `🏃 Agilidad: ${character.stats.agility || 10}\n` +
            `🛡️ Resistencia: ${character.stats.endurance}\n` +
            `❤️ Recuperación: ${character.stats.recovery}`,
            inline: true
          },
          { name: 'Estado', value: 
            `🩸 Sangrado: ${character.status.bleeding}/100\n` +
            `😖 Dolor: ${character.status.pain}/100\n` +
            `🤯 Consciencia: ${character.status.consciousness}/100\n` +
            `😩 Fatiga: ${character.status.fatigue}/100`,
            inline: true
          }
        );

      // Añadir partes del cuerpo
      const bodyPartsText = bodyParts.map(part => 
        `${getBodyPartEmoji(part.type)} ${part.name}: ${part.health}/100`
      ).join('\n');
      
      embed.addFields({ name: 'Partes del cuerpo', value: bodyPartsText });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'train') {
      const statToTrain = interaction.options.getString('stat');
      if (!statToTrain) {
        await interaction.editReply('Debes seleccionar una estadística para entrenar');
        return;
      }

      // Verificar si el personaje puede entrenar (ej. cooldown)
      const lastTrainingTime = character.getDataValue('lastTraining') || 0;
      const now = Date.now();
      const cooldownHours = 12; // 12 horas de cooldown
      const cooldownMs = cooldownHours * 60 * 60 * 1000;

      if (now - lastTrainingTime < cooldownMs) {
        const remainingTime = new Date(lastTrainingTime + cooldownMs);
        await interaction.editReply(`Debes esperar hasta ${remainingTime.toLocaleString()} para volver a entrenar.`);
        return;
      }

      // Incrementar la estadística
      const statToTrainTyped = statToTrain as 'strength' | 'agility' | 'endurance' | 'recovery';
      const currentValue = character.stats[statToTrainTyped] || 10;
      character.stats = {
        ...character.stats,
        [statToTrainTyped]: currentValue + 1
      };

      // Actualizar tiempo de último entrenamiento
      character.setDataValue('lastTraining', now);
      await character.save();

      // Crear embed para mostrar el resultado
      const statNames: {[key: string]: string} = {
        strength: 'Fuerza',
        agility: 'Agilidad',
        endurance: 'Resistencia',
        recovery: 'Recuperación'
      };

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`Entrenamiento completado`)
        .setDescription(`Has entrenado tu **${statNames[statToTrainTyped]}** y ha aumentado a **${currentValue + 1}**.\nPuedes volver a entrenar en ${cooldownHours} horas.`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  } catch (error) {
    console.error('Error en comando character:', error);
    await interaction.editReply('Ocurrió un error al procesar tu personaje');
  }
}

function getBodyPartEmoji(type: string): string {
  switch (type) {
    case 'head': return '🧠';
    case 'torso': return '👕';
    case 'arm': return '💪';
    case 'leg': return '🦵';
    default: return '🦴';
  }
}
