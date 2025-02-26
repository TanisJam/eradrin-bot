import {
  CommandInteraction,
  SlashCommandBuilder,
  ComponentType,
} from 'discord.js';
import { Nivel20Service } from '../services/nivel20.service';
import { createCharacterButtons } from '../utils/discord.utils';

const INTERACTION_TIMEOUT = 60000; // 1 min
const nivel20Service = new Nivel20Service();

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Recibe información de un personaje')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('Nombre del personaje')
      .setMinLength(2)
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  try {
    await interaction.deferReply();
    const name = interaction.options.get('name')?.value as string;
    const characters = await nivel20Service.searchCharacters(name);

    if (characters.length === 0) {
      await interaction.editReply(`No se encontró coincidencia con ${name}`);
      return;
    }

    if (characters.length === 1) {
      const charStats = await nivel20Service.getCharacterStats(characters[0].link);
      if (charStats) {
        const embed = charStats.toEmbed();
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('No se pudo cargar la información del personaje.');
      }
      return;
    }

    const rows = createCharacterButtons(characters);
    const message = await interaction.editReply({
      content: `Se encontraron los siguientes personajes:\n${characters
        .map((char, index) => `${index + 1}. ${char.name}`)
        .join('\n')}`,
      components: rows,
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: INTERACTION_TIMEOUT,
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: 'No puedes interactuar con este comando.',
          ephemeral: true,
        });
        return;
      }

      const index = parseInt(i.customId.split('_')[1]);
      const selectedChar = characters[index];
      const charStats = await nivel20Service.getCharacterStats(
        selectedChar.link
      );

      if (charStats) {
        const embed = charStats.toEmbed();
        await i.reply({ embeds: [embed] });
      } else {
        await i.reply('No se pudo cargar la información del personaje.');
      }
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] });
    });
  } catch (error) {
    await interaction.editReply('Ocurrió un error al procesar tu solicitud.');
  }
}
