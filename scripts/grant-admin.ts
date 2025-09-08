import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import config from '../src/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

async function grantAdminPermissions() {
  try {
    await client.login(config.TOKEN);
    console.log('Bot iniciado correctamente');

    const guild = await client.guilds.fetch(config.GUILD_ID);
    const role = await guild.roles.fetch('1216857851058720818');

    if (!role) {
      console.error('❌ No se encontró el rol especificado');
      process.exit(1);
    }

    await role.setPermissions(PermissionFlagsBits.Administrator);
    console.log(`✅ Se han otorgado permisos de administrador al rol ${role.name}`);

    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

grantAdminPermissions(); 