import { REST, Routes, SlashCommandOptionsOnlyBuilder } from 'discord.js';
import config from './config';
import * as commandsModules from './commands';

type Command = {
  data: SlashCommandOptionsOnlyBuilder;
};

const commands = [];

for (const command of Object.values<Command>(commandsModules)) {
  commands.push(command.data);
}

const rest = new REST({ version: '9' }).setToken(config.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
