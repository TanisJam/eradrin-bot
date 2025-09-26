import {
  CommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  Role,
} from 'discord.js';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Otorga permisos de administrador a un rol')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
  try {
    const roleId = '1216857851058720818';
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply({
        content: '❌ Este comando solo puede ser usado en un servidor.',
        ephemeral: true
      });
      return;
    }

    const role = await guild.roles.fetch(roleId);
    
    if (!role) {
      await interaction.reply({
        content: '❌ No se encontró el rol especificado.',
        ephemeral: true
      });
      return;
    }

    await role.setPermissions(PermissionFlagsBits.Administrator);
    
    await interaction.reply({
      content: `✅ Se han otorgado permisos de administrador al rol ${role.name}`,
      ephemeral: true
    });

    logger.info(`Permisos de administrador otorgados al rol ${role.name} (${roleId})`);
  } catch (error) {
    logger.error('Error al otorgar permisos de administrador:', error);
    await interaction.reply({
      content: '❌ Ocurrió un error al intentar otorgar los permisos.',
      ephemeral: true
    });
  }
} 