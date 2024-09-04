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
  )
  .addStringOption((option) =>
    option
      .setName('advantage')
      .setDescription('Si la tirada es con ventaja o desventaja')
      .addChoices(
        { name: 'ventaja', value: 'adv' },
        { name: 'desventaja', value: 'dis' }
      )
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const dice = interaction.options.get('dice')?.value;
  const number = (interaction.options.get('number')?.value as number) || 1;
  const mod = (interaction.options.get('mod')?.value as number) || 0;
  const dc = (interaction.options.get('dc')?.value as number) || 0;
  const advantage = interaction.options.get('advantage')?.value;
  const iterations =
    (interaction.options.get('iterations')?.value as number) || 1;

  if (advantage !== undefined && number < 2) {
    return interaction.reply(
      '🔸*La tirada debe tener al menos dos dados para poder usar ventaja o desventaja*'
    );
  }

  let rolls = [];

  const rollString = `${number}d${dice}${
    advantage === 'adv' ? `kh1` : advantage === 'dis' ? `kl1` : ''
  }${mod ? `${mod > 0 ? `+${mod}` : mod}` : ''}`;

  let succesedRolls = 0;
  let sumRolls = 0;

  for (let i = 0; i < (iterations > 100 ? 100 : iterations); i++) {
    const roll = new DiceRoll(rollString);
    sumRolls += roll.total;
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

  if (iterations > 20) {
    const start = rolls.slice(0, 7);
    const end = rolls.slice(-7);
    rolls = [...start, '. . . . .', ...end];
  }

  if (iterations > 1) {
    rolls.push('=======');
    rolls.push(`🔹*Tiradas realizadas:* **${iterations}**`);
    rolls.push(`🔹*Suma total de las tiradas:* **${sumRolls}**`);
    rolls.push(
      `🔹*Media de las tiradas:* **${Math.round(sumRolls / iterations)}**`
    );
  }
  if (dc > 0) {
    rolls.push(`===DC: ${dc}===`);
  }
  if (dc > 0 && succesedRolls > 0 && iterations > 1) {
    rolls.push(`**${succesedRolls}** tiradas han sido exitosas!`);
  }

  const rollMessage = rolls.join('\n');

  await interaction.reply(`Resultados de la tirada:\n${rollMessage}`);
}
