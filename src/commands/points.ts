import { CommandInteraction } from 'discord.js';
import User from '../database/models/User';

export const execute = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  const [user] = await User.findOrCreate({
    where: { id: userId },
    defaults: {
      nickName: interaction.user.username,
      points: 0,
    },
  });

  await interaction.reply(`Tienes ${user} puntos!`);
};

export const data = {
  name: 'points',
  description: 'Muestra tus puntos',
};
