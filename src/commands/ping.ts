import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import User from '../database/models/User';
import PingHistory from '../database/models/PingHistory';
import { Command } from '../types';
import { logger } from '../utils/logger';
import { TransactionService } from '../services/Transaction.service';

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

    // Usar transacción para asegurar consistencia en las operaciones de base de datos
    const [lastPingUser] = await TransactionService.executeInTransaction(async (transaction) => {
      // Buscar el último usuario que usó el comando dentro de la transacción
      const lastPingHistory = await PingHistory.findOne({
        order: [['createdAt', 'DESC']],
        transaction
      });

      // Registrar o actualizar el usuario en la base de datos
      const [user, created] = await User.findOrCreate({
        where: { id: userId },
        defaults: {
          id: userId,
          nickName: nickName,
          lastPing: currentDate,
        },
        transaction
      });

      // Si el usuario ya existía, actualizar los datos usando el método de instancia
      if (!created) {
        user.nickName = nickName;
        user.lastPing = currentDate;
        await user.save({ transaction });
      }

      // Registrar la interacción en el historial
      await PingHistory.create({
        lastPingUserId: userId,
      }, { transaction });

      logger.debug('Usuario y historial de ping actualizados correctamente');

      // Buscar información del último usuario que hizo ping (si existe)
      let lastUser = null;
      if (lastPingHistory?.lastPingUserId) {
        lastUser = await User.findOne({
          where: { id: lastPingHistory.lastPingUserId },
          transaction
        });
      }

      return [lastUser];
    }, "Actualización de registros de ping");

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
