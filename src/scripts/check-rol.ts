import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import config from '../config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Bot conectado como ${client.user?.tag}`);
  
  try {
    // Asumiendo que sabes el ID de tu servidor (GUILD_ID en tu config)
    const guildId = config.GUILD_ID;
    const roleId = '1216857851058720818';
    
    const guild = await client.guilds.fetch(guildId);
    
    if (!guild) {
      console.error('El bot no está en el servidor especificado');
      process.exit(1);
    }
    
    // Obtener el rol por ID
    const role = await guild.roles.fetch(roleId);
    
    if (!role) {
      console.error('No se encontró el rol con ID:', roleId);
      process.exit(1);
    }
    
    console.log(`=== Información del Rol: ${role.name} ===`);
    console.log(`Color: ${role.hexColor}`);
    console.log(`Posición: ${role.position}`);
    console.log(`Hoisted: ${role.hoist ? 'Sí' : 'No'}`);
    console.log(`Mentionable: ${role.mentionable ? 'Sí' : 'No'}`);
    
    // Obtener los permisos del rol
    console.log('\n=== Permisos del Rol ===');
    const permissions = new PermissionsBitField(role.permissions.bitfield);
    
    // Permisos importantes para un bot
    const keyPermissions = [
      'Administrator',
      'ManageGuild',
      'ManageRoles',
      'ManageChannels',
      'ManageMessages',
      'ManageWebhooks',
      'KickMembers',
      'BanMembers',
      'SendMessages',
      'EmbedLinks',
      'AttachFiles',
      'ReadMessageHistory',
      'UseApplicationCommands',
      'AddReactions',
      'ViewChannel'
    ];
    
    for (const perm of keyPermissions) {
      const has = permissions.has(PermissionsBitField.Flags[perm as keyof typeof PermissionsBitField.Flags]);
      console.log(`${has ? '✅' : '❌'} ${perm}`);
    }
    
    // Mostrar todos los permisos
    console.log('\n=== Todos los Permisos ===');
    for (const [permName, permValue] of Object.entries(PermissionsBitField.Flags)) {
      const has = permissions.has(permValue);
      console.log(`${has ? '✅' : '❌'} ${permName}`);
    }
    
  } catch (error) {
    console.error('Error al obtener información del rol:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(config.TOKEN);
