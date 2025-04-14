import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import User from '../database/models/User';
import PingHistory from '../database/models/PingHistory';
import { Command } from '../types/Command';
import { logger } from '../utils/logger';

/**
 * Comando ping - Responde con Pong y registra la interacción
 */
export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Responde con Pong y muestra el último usuario que usó el comando');

/**
 * Implementación del comando ping
 * Registra la interacción y muestra el último usuario que usó el comando
 */
export async function execute(interaction: CommandInteraction) {
  try {
    logger.debug('Iniciando ejecución del comando ping');
    
    // Buscar el último usuario que usó el comando
    const lastPingHistory = await PingHistory.findOne({
      order: [['createdAt', 'DESC']],
    });

    let lastPingUser = null;
    if (lastPingHistory?.lastPingUserId) {
      try {
        lastPingUser = await User.findOne({
          where: { id: lastPingHistory.lastPingUserId },
        });
      } catch (error) {
        logger.error('Error al buscar el último usuario:', error);
      }
    }

    // Solo proceder si la interacción ocurre en un servidor
    if (!interaction.guild) {
      await interaction.reply('Este comando solo puede ser usado en un servidor.');
      return;
    }

    // Obtener información del usuario que ejecutó el comando
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const nickName = member.nickname || member.user.username;
    const userId = member.id;
    const currentDate = new Date();
    // No usamos avatarUrl por ahora debido a problemas con la columna

    // Registrar o actualizar el usuario en la base de datos
    try {
      const [user, created] = await User.findOrCreate({
        where: { id: userId },
        defaults: {
          id: userId,
          nickName: nickName,
          lastPing: currentDate,
          // No se incluye el campo avatar
        },
      });

      // Si el usuario ya existía, actualizar los datos
      if (!created) {
        await User.update(
          { 
            lastPing: currentDate,
            nickName: nickName,
            // No se incluye el campo avatar
          },
          { where: { id: userId } }
        );
      }

      // Registrar la interacción en el historial
      await PingHistory.create({
        lastPingUserId: userId,
      });

      logger.debug('Usuario y historial de ping actualizados correctamente');
    } catch (error) {
      logger.error('Error al actualizar usuario o historial:', error);
    }

    // Responder con la información del último usuario
    if (lastPingUser) {
      const formattedDate = lastPingUser.lastPing?.toLocaleString('es') || 'Fecha desconocida';
      await interaction.reply(
        `🏓 Pong! Último usuario: ${lastPingUser.nickName} (Fecha: ${formattedDate})`
      );
    } else {
      await interaction.reply('🏓 Pong! Eres el primer usuario en usar este comando.');
    }
  } catch (error) {
    logger.error('Error general en comando ping:', error);
    await interaction.reply('Ha ocurrido un error al ejecutar el comando. Inténtalo de nuevo más tarde.');
  }
}
