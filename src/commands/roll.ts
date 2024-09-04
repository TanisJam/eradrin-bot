import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
const { DiceRoll } = require('@dice-roller/rpg-dice-roller');

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Tira unos dados')
  .addIntegerOption((option) =>
    option
      .setName('dice')
      .setDescription('El dado a tirar')
      .setRequired(true)
      .addChoices(
        { name: 'd2', value: 2 },
        { name: 'd4', value: 4 },
        { name: 'd6', value: 6 },
        { name: 'd8', value: 8 },
        { name: 'd10', value: 10 },
        { name: 'd12', value: 12 },
        { name: 'd20', value: 20 },
        { name: 'd100', value: 100 }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName('number')
      .setDescription('El numero de dados a tirar')
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName('mod')
      .setDescription('El modificador a añadir al resultado')
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName('dc')
      .setDescription('La dificultad del rol')
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName('iterations')
      .setDescription('El numero de veces que se repite el rol')
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const dice = interaction.options.get('dice')?.value;
  const number = interaction.options.get('number')?.value || 1;
  const mod = (interaction.options.get('mod')?.value as number) || 0;
  const dc = (interaction.options.get('dc')?.value as number) || 0;
  const iterations =
    (interaction.options.get('iterations')?.value as number) || 1;

  const rolls = [];

  const rollString = `${number}d${dice}${
    mod ? `${mod > 0 ? `+${mod}` : mod}` : ''
  }`;

  let succesedRolls = 0;
  for (let i = 0; i < (iterations > 100 ? 100 : iterations); i++) {
    const roll = new DiceRoll(rollString);
    const result = `${roll}`.replace(/=\s*(-?\d+)/, '= **$1**');
    if (dc > 0) {
      const success = roll.total >= dc;
      if (success) {
        rolls.push(`✅${result}`);
        succesedRolls++;
      } else {
        rolls.push(`❌~~${result}~~`);
      }
    } else {
      rolls.push(result);
    }
  }

  if (dc > 0 && succesedRolls > 0 && iterations > 1) {
    rolls.push('=======');
    rolls.push(`**${succesedRolls}** tiradas han sido exitosas!`);
  }

  const rollMessage = rolls.join('\n');

  await interaction.reply(`Resultados de la tirada:\n${rollMessage}`);
}
