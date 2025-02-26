import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import User from '../database/models/User';
import PingHistory from '../database/models/PingHistory';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');

// Return a pong with the last user that used the command and the date, and register the new interaction in the database
export async function execute(interaction: CommandInteraction) {
  // Check in PingHistory table what is the last user that used the command
  const lastPingUserId = await PingHistory.findOne({
    order: [['lastPingUserId', 'DESC']],
  });

  let lastPingUser = null;

  // check if there is a last ping user

  try {
    lastPingUser = await User.findOne({
      where: { id: lastPingUserId?.lastPingUserId },
    });
  } catch (error) {
    console.log('No hay un último usuario');
  }

  if (interaction.guild) {
    const interactionUser = await interaction.guild?.members.fetch(
      interaction.user.id
    );
    const nickName = interactionUser.nickname;
    const userId = interactionUser.id;
    const date = new Date();

    // Find the new user in the database and update the lastPing date or create a new user
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        nickName: nickName,
        lastPing: date,
      },
    });

    // Update the user
    if (!user.isNewRecord) {
      await User.update(
        { lastPing: date },
        {
          where: { id: userId },
        }
      );
    }

    // Register the new interaction in the database
    await PingHistory.create({
      lastPingUserId: userId,
    });
  }

  // Reply with the last user that used the command and the date if there is a last ping user

  if (lastPingUserId) {
    await interaction.reply(
      `Pong! Último usuario: ${lastPingUser?.nickName} Fecha: ${lastPingUser?.lastPing}`
    );
  } else {
    await interaction.reply('Pong!');
  }
}
