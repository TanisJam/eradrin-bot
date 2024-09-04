import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiceRoll, exportFormats } from '@dice-roller/rpg-dice-roller';

const emojis = [
  ':skull:',
  ':smiling_face_with_tear:',
  ':slight_smile:',
  ':saluting_face:',
  ':sunglasses:',
  ':alien:',
];

export const data = new SlashCommandBuilder()
  .setName('rollstats')
  .setDescription(
    'Genera stats para tu proximo personaje (o te manda a point buy)'
  );

export async function execute(interaction: CommandInteraction) {
  const { OBJECT } = exportFormats;

  const sixRolls = Array.from({ length: 6 }, () => new DiceRoll('4d6kh3'));

  function convertRolls(
    rolls: {
      [x: string]: any;
      rolls: { value: any; useInTotal: any }[];
    }[]
  ) {
    const total = rolls[0].value;
    const rolled = rolls[0].rolls.map(
      (roll: { value: any; useInTotal: any }) => ({
        value: roll.value,
        used: roll.useInTotal,
      })
    );

    return `${rolled
      .map((r: { used: any; value: any }) =>
        r.used ? `***${r.value}***` : `~~${r.value}~~`
      )
      .join(', ')} = **\`${total}\`**`;
  }
  let total = 0;
  let response = `## :jigsaw: Stats:`;

  sixRolls.forEach((roll) => {
    // @ts-ignore
    const { rolls } = roll.export(OBJECT);
    total += rolls[0].value;
    const rolled = convertRolls(rolls);
    response += `\n${rolled}`;
  });

  await interaction.reply(
    `${response}\n=======\nTotal: **${total}**\n ${
      emojis[Math.floor((total - 50) / 10)]
    }`
  );
}
