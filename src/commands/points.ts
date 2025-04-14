import { CommandInteraction } from 'discord.js';
import User from '../database/models/User';

export const execute = async (interaction: CommandInteraction) => {
  const userId = interaction.user.id;

  const [user] = await User.findOrCreate({
    where: { id: userId },
    defaults: {
      id: userId,
      nickName: interaction.user.username,
      lastPing: new Date(),
    },
  });

  await interaction.reply(`Hola ${user.nickName}! Gracias por usar este comando.`);
};

export const data = {
  name: 'points',
  description: 'Muestra tus puntos',
};
