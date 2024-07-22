import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import { load } from 'cheerio';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Recibe información de un personaje')
  .addStringOption((option) =>
    option
      .setName('name')
      .setDescription('Nombre del personaje')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();
  const name = interaction.options.get('name')?.value as string;
  const url = `https://nivel20.com/games/dnd-5/campaigns/76536-el-reposo-del-cuervo/characters?utf8=%E2%9C%93&q=${name}`;
  const response = await axios.get(url);
  const html = response.data;
  const $ = load(html);
  const characters = $('.campaign-characters');

  const charactersDescs = characters.find('.character-desc');
  const responseText = charactersDescs.map((i, el) => {
    const character = $(el);
    const name = character.find('a').text();
    const link = character.find('a').attr('href');
    return `Información sobre [${name}](https://nivel20.com${link})`;
  });

  if (responseText.get().join('') === '') {
    await interaction.editReply(`No se encontró coincidencia con ${name}`);
  } else {
    await interaction.editReply(responseText.get().join(''));
  }
}
