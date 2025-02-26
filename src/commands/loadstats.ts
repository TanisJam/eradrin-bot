import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import { CharacterSheet } from '../models/character-sheet';

export const data = new SlashCommandBuilder()
  .setName('loadstats')
  .setDescription('Carga los stats de un personaje desde una URL')
  .addStringOption((option) =>
    option
      .setName('url')
      .setDescription('URL del JSON con los stats del personaje')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();
  try {
    const interactionUrl = interaction.options.get('url')?.value as string;
    const url = `${interactionUrl}.json`;
    const response = await axios.get(url);
    const characterData = response.data;

    const character = new CharacterSheet(characterData, interactionUrl);
    const characterEmbed = character.toEmbed();

    await interaction.editReply({ embeds: [characterEmbed] });
  } catch (error) {
    await interaction.editReply(
      'Error al cargar los stats del personaje. Verifica que la URL sea correcta.'
    );
  }
}
