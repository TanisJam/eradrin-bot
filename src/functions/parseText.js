const formatMessage = (roll, user, rollMessage) => {
  console.log('Rolls:', roll.rolls);
  const userNameMessage = `<@${user.id}>:game_die:`;
  const tiradaMessage = `${roll.notation} (${roll.rolls
    .map(strikeThrough)
    .filter(Boolean)
    .join(', ')})`;

  if (!rollMessage) {
    return `${userNameMessage}\n***Tirada***: ${tiradaMessage}\n***Total: ${roll.total}***`;
  }

  return `${userNameMessage}\n***${rollMessage}***: ${tiradaMessage}\n***Total: ${roll.total}***`;
};

const strikeThroughAndBold = (text) => {
  const parsedText = text.rolls.map((t) => {
    const number = t[Object.getOwnPropertySymbols(t)[0]];
    const keep = t[Object.getOwnPropertySymbols(t)[2]];

    if (!keep) {
      return `~~${number.toString()}~~`;
    } else {
      return `**${number.toString()}**`;
    }
  });

  return parsedText.join(', ');
};

const strikeThrough = (text) => {
  console.log('text', text);
  if (!text.rolls) {
    return null;
  }
  const parsedText = text.rolls.map((t) => {
    const number = t[Object.getOwnPropertySymbols(t)[0]];
    const keep = t[Object.getOwnPropertySymbols(t)[2]];

    if (!keep) {
      return `~~${number.toString()}~~`;
    } else {
      return number.toString();
    }
  });

  return parsedText.join(', ');
};

module.exports = {
  formatMessage,
  strikeThroughAndBold,
  strikeThrough,
};
