import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Client } from 'discord.js';

/**
 * Interface for Discord slash commands
 * Standardizes the structure for all bot commands
 */
export interface Command {
  /**
   * Command definition with name, description and parameters
   */
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  
  /**
   * Function to execute when the command is triggered
   * @param interaction The Discord interaction that triggered the command
   * @param client Optional Discord client instance
   */
  execute: (interaction: CommandInteraction, client?: Client) => Promise<void>;
} 