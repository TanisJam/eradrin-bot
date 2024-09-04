const { DiceRoll } = require('@dice-roller/rpg-dice-roller');
const {
  formatMessage,
  strikeThrough,
  strikeThroughAndBold,
} = require('./parseText');

function rollStats(message) {
  const { channel, author: user } = message;
  const rolls = Array.from({ length: 6 }, () => new DiceRoll('4d6kh3'));
  rolls.sort((a, b) => a - b);
  const total = rolls.reduce((acc, roll) => acc + roll.total, 0);

  const formattedRolls = rolls.map((roll) => {
    return `${roll.notation} (${roll.rolls
      .map(strikeThroughAndBold)
      .join(', ')}) = \`${roll.total}\`\n`;
  });
  const formattedOutput = `Stats aleatorios:\n${formattedRolls.join(
    ''
  )}Total = \`${total}\``;
  channel.send(`<@${user.id}> ${formattedOutput}`);
}

function handleRollCommand(message) {
  const { channel, author: user } = message;
  message.delete();
  const [_, roll, modifier, ...messageParts] = message.content.split(' ');

  if (modifier === 'adv' || modifier === 'dis') {
    const roller1 = new DiceRoll(roll);
    const roller2 = new DiceRoll(roll);
    const total =
      modifier === 'adv'
        ? Math.max(roller1.total, roller2.total)
        : Math.min(roller1.total, roller2.total);
    const formattedRolls = `${roller1.notation} (${roller1.rolls
      .map(strikeThrough)
      .filter(Boolean)
      .join(', ')}) = \`${roller1.total}\`\n${roller2.notation} (${roller2.rolls
      .map(strikeThrough)
      .filter(Boolean)
      .join(', ')}) = \`${roller2.total}\``;
    const rollMsg = messageParts.join(' ')
      ? modifier === 'adv'
        ? `Tirada de ${messageParts.join(' ')} con ventaja:`
        : `Tirada de ${messageParts.join(' ')} con desventaja:`
      : modifier === 'adv'
      ? 'Tirada con ventaja:'
      : 'Tirada con desventaja:';
    const formattedOutput = `${rollMsg}\n${formattedRolls}\n***Total*** = \`${total}\``;

    channel.send(`<@${user.id}> ${formattedOutput}`);
  } else {
    try {
      const roller = new DiceRoll(roll);
      channel.send(
        formatMessage(roller, user, [modifier, ...messageParts].join(' '))
      );
    } catch (error) {
      console.error('Error rolling dice!', error);
      channel.send(`<@${user.id}> Error en la tirada.\nRevisa el formato!`);
    }
  }
}

module.exports = {
  rollStats,
  handleRollCommand,
};
