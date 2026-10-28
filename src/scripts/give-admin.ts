import { Client, GatewayIntentBits, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import config from '../config';
import { logger } from '../utils/logger';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Bot conectado como ${client.user?.tag}`);
  
  try {
    const guildId = config.GUILD_ID;
    const roleId = '1216857851058720818';
    
    const guild = await client.guilds.fetch(guildId);
    
    if (!guild) {
      console.error('El bot no está en el servidor especificado');
      process.exit(1);
    }
    
    // Verificar si el bot tiene permisos para modificar roles
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      console.error('❌ El bot no tiene permisos para gestionar roles');
      process.exit(1);
    }
    
    // Obtener el rol por ID
    const role = await guild.roles.fetch(roleId);
    
    if (!role) {
      console.error('No se encontró el rol con ID:', roleId);
      process.exit(1);
    }
    
    // Verificar si el bot puede modificar este rol
    if (botMember.roles.highest.position <= role.position) {
      console.error('❌ El bot no puede modificar este rol porque está posicionado más alto o al mismo nivel que el rol más alto del bot');
      process.exit(1);
    }
    
    console.log(`=== Información del Rol Antes: ${role.name} ===`);
    const permissionsBefore = new PermissionsBitField(role.permissions.bitfield);
    console.log(`¿Tiene Admin?: ${permissionsBefore.has(PermissionFlagsBits.Administrator) ? 'Sí ✅' : 'No ❌'}`);
    
    // Establecer el permiso de administrador
    try {
      console.log('Otorgando permisos de administrador...');
      
      await role.setPermissions([PermissionFlagsBits.Administrator]);
      
      // Verificar que se hayan aplicado los cambios
      const updatedRole = await guild.roles.fetch(roleId, { force: true });
      const newPermissions = new PermissionsBitField(updatedRole?.permissions.bitfield || 0n);
      
      console.log(`\n=== Información del Rol Después: ${updatedRole?.name} ===`);
      console.log(`¿Tiene Admin?: ${newPermissions.has(PermissionFlagsBits.Administrator) ? 'Sí ✅' : 'No ❌'}`);
      
      if (newPermissions.has(PermissionFlagsBits.Administrator)) {
        console.log('✅ ¡Éxito! El rol ahora tiene permisos de administrador');
      } else {
        console.log('❌ No se pudo otorgar permisos de administrador');
      }
      
    } catch (error) {
      console.error('Error al modificar permisos:', error);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(config.TOKEN);
