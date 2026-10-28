import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import config from './config';
import * as commandsModules from './commands';
import { logger } from './utils/logger';

/**
 * Script to register the application's commands with the Discord API
 * This script should be executed after any command changes
 */

// Check if the --global flag was passed
const isGlobal = process.argv.includes('--global');

// Collect commands
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
let commandCount = 0;

// Extract data from all commands
for (const key in commandsModules) {
  try {
    const module = commandsModules[key as keyof typeof commandsModules];
    if (module && module.data) {
      commands.push(module.data.toJSON());
      commandCount++;
      logger.debug(`Command prepared for deployment: ${key}`);
    } else {
      logger.warn(`Command module without data: ${key}`);
    }
  } catch (error) {
    logger.error(`Error processing command module:`, error);
  }
}

logger.info(`Prepared ${commandCount} commands for deployment${isGlobal ? ' globally' : ' for guild'}`);

// Configure REST client for Discord API communication
const rest = new REST({ version: '10' }).setToken(config.TOKEN);

// Main function to deploy commands
async function deployCommands(): Promise<boolean> {
  try {
    logger.info(`Starting ${isGlobal ? 'global' : 'guild'} command update...`);

    // Register commands in the specific guild (server) or globally
    const data = await rest.put(
      isGlobal 
        ? Routes.applicationCommands(config.CLIENT_ID)
        : Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );

    // Verify response
    const responseArray = Array.isArray(data) ? data : [];
    logger.info(`Commands successfully updated! (${responseArray.length} commands)`);
    
    return true;
  } catch (error) {
    logger.error('Error deploying commands:', error);
    return false;
  }
}

// Auto-execute script if called directly
if (require.main === module) {
  deployCommands()
    .then(success => {
      if (success) {
        logger.info(`Command deployment completed ${isGlobal ? 'globally' : 'for guild'}.`);
      } else {
        logger.error('Command deployment failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unexpected error:', error);
      process.exit(1);
    });
}

// Export function for use from other modules
export { deployCommands };
