import config from '../config';
import {
  CommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  Client,
  GuildMember,
  Collection,
} from 'discord.js';

const ROLE_NAME = 'YA JUGUÉ';

export const data = new SlashCommandBuilder()
  .setName('rolreset')
  .setDescription("Quita el rol 'Ya jugé'")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function removeRoleFromMember(
  member: GuildMember,
  roleName: string
): Promise<boolean> {
  const role = member.roles.cache.find((role) => role.name === roleName);
  if (!role) return false;

  await member.roles.remove(role);
  console.log(`Rol ${roleName} removido de ${member.user.username}`);
  return true;
}

async function removeRoleFromAllMembers(
  members: Collection<string, GuildMember>,
  roleName: string
): Promise<number> {
  let count = 0;

  for (const [_, member] of members) {
    const wasRemoved = await removeRoleFromMember(member, roleName);
    if (wasRemoved) count++;
  }

  return count;
}

export async function execute(interaction: CommandInteraction, client: Client) {
  try {
    await interaction.deferReply();

    const guild = await client.guilds.fetch(config.GUILD_ID);
    const members = await guild.members.fetch();

    if (!members.size) {
      await interaction.editReply('No se encontraron miembros');
      return;
    }

    const removedCount = await removeRoleFromAllMembers(members, ROLE_NAME);
    await interaction.editReply(
      `Se removieron ${removedCount} roles ${ROLE_NAME}`
    );
  } catch (error) {
    console.error('Error en comando rolreset:', error);
    await interaction.editReply(
      'Ocurrió un error al intentar remover los roles'
    );
  }
}
