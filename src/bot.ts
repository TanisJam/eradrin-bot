import { Client, IntentsBitField, Events, Collection } from 'discord.js';
import config from './config';
import * as commandsModules from './commands';
import { initDatabase } from './database/config';
import { Command } from './types/Command';
import { logger } from './utils/logger';

// Create Discord client with necessary intents
export const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ],
});

// Collection to store commands
client.commands = new Collection<string, Command>();

// Initialize and register commands
const commands = Object(commandsModules) as Record<string, Command>;
Object.keys(commands).forEach((commandName) => {
  client.commands.set(commandName, commands[commandName]);
  logger.info(`Command registered: ${commandName}`);
});

// Event when bot is ready
client.once(Events.ClientReady, async () => {
  try {
    // Comprobar si es un inicio seguro (sin alterar tablas)
    const safeStart = process.env.SAFE_START === 'true';
    
    if (safeStart) {
      logger.info('Running in safe mode. Database alter operations are disabled.');
      await initDatabase(false, false);
    } else {
      // Modo normal, permite alterar si es necesario
      await initDatabase();
    }
    
    logger.info(`${client.user?.username} is online!`);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
});

// Handle command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Only handle slash commands
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const command = client.commands.get(commandName);

  if (!command) {
    logger.warn(`Command not found: ${commandName}`);
    return;
  }

  try {
    logger.info(`Executing command: ${commandName}`);
    await command.execute(interaction, client);
  } catch (error) {
    logger.error(`Error executing command ${commandName}:`, error);
    
    // Respond to user with error message
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'There was an error executing this command. Please try again later.',
        ephemeral: true
      });
    } else if (interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error executing this command. Please try again later.',
        ephemeral: true
      });
    }
  }
});

// Log in the bot
client.login(config.TOKEN).catch(error => {
  logger.error('Error logging in the bot:', error);
  process.exit(1);
});

// Handle uncaught rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled error:', error);
});

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}
