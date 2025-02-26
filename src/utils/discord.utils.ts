import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Character } from '../types/Character';

export function createCharacterButtons(characters: Character[]): ActionRowBuilder<ButtonBuilder>[] {
  const buttons = characters.map((char, index) =>
    new ButtonBuilder()
      .setCustomId(`character_${index}`)
      .setLabel(`${index + 1}. ${char.name}`)
      .setStyle(ButtonStyle.Primary)
  );

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.slice(i, i + 5)
    );
    rows.push(row);
  }

  return rows;
}
