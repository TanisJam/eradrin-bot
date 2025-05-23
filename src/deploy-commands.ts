import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import config from './config';
import * as commandsModules from './commands';
import { logger } from './utils/logger';

/**
 * Script to register the application's commands with the Discord API
 * This script should be executed after any command changes
 * 
 * Options:
 * --delete-global: Delete all global commands before deploying guild commands
 */

// Parse command line arguments
const args = process.argv.slice(2);
const shouldDeleteGlobal = args.includes('--delete-global');

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

logger.info(`Prepared ${commandCount} commands for deployment`);

// Configure REST client for Discord API communication
const rest = new REST({ version: '10' }).setToken(config.TOKEN);

// Function to delete global commands
async function deleteGlobalCommands(): Promise<boolean> {
  try {
    logger.info('Deleting global commands...');

    // Put an empty array to delete all global commands
    await rest.put(
      Routes.applicationCommands(config.CLIENT_ID),
      { body: [] }
    );

    logger.info('Global commands successfully deleted!');
    return true;
  } catch (error) {
    logger.error('Error deleting global commands:', error);
    return false;
  }
}

// Main function to deploy commands
async function deployCommands(): Promise<boolean> {
  try {
    logger.info('Starting command update...');

    // Register commands in the specific guild (server)
    const data = await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
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
  // Determine execution flow based on args
  const executeDeployment = async () => {
    // If --delete-global is provided, delete global commands first
    if (shouldDeleteGlobal) {
      logger.info('Global command deletion requested via --delete-global flag');
      const globalSuccess = await deleteGlobalCommands();
      if (!globalSuccess) {
        logger.warn('Global command deletion failed, continuing with guild commands...');
      }
    }

    // Deploy guild commands
    const success = await deployCommands();
    if (success) {
      logger.info('Command deployment completed.');
      return true;
    } else {
      logger.error('Command deployment failed.');
      return false;
    }
  };

  executeDeployment()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unexpected error:', error);
      process.exit(1);
    });
}

// Export function for use from other modules
export { deployCommands, deleteGlobalCommands };
