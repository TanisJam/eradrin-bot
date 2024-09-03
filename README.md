![Eradrin Iamge](./assets/Eradrin.png)

# Eradrin Bot

Eradrin Bot is a Discord bot that acts as a chatbot using the Gemini AI API and also provides direct links to character sheets for a Dungeons & Dragons campaign on the Nivel20 site. This is especially useful because the Nivel20 search engine is extremely slow and inefficient.

## Features

- **Chatbot**: Uses the Gemini AI API to interact with users.

![aks](./assets/ask.png)

- **Direct links to character sheets**: Provides quick and direct links to character sheets on Nivel20.

![character](./assets/character.png)

## Requirements

- Node.js
- Discord Bot Token
- Gemini AI API Key
- **`.env`** file with the following variables:
  - **`CLIENT_ID`**
  - **`TOKEN`**
  - **`GUILD_ID`**
  - **`GEMINI_API_KEY`**

## Installation

1. Clone this repository:

   `git clone https://github.com/your-username/eradrin-bot.git
cd eradrin-bot`

2. Install the dependencies:

   `npm install`

3. Create a **`.env`** file in the root of the project and add your credentials:

```bash
CLIENT_ID=12345678901234567890
TOKEN=123456789qwertyuiop
GUILD_ID=12345678901234567890
GEMINI_API_KEY=123456789qwertyuiop
```

4. Build the project:

   `npm run build`

5. Start the bot:

   `npm start`

## Scripts

- **`build`**: Compiles the TypeScript project.
- **`start`**: Starts the bot.
- **`dev`**: Starts the bot in development mode with automatic reloading.
- **`deploy:commands`**: Compiles the project and deploys the Discord commands.

## Development

To contribute to the development of Eradrin Bot, follow these steps:

1. Fork the repository.
2. Create a new branch (**`git checkout -b feature/new-feature`**).
3. Make your changes and commit them (**`git commit -am 'Add new feature'`**).
4. Push your changes (**`git push origin feature/new-feature`**).
5. Open a Pull Request.

## Upcoming Features

I am planning to add the following features to enhance the D&D experience:

- **Dice Roller**: A feature to roll dice directly within Discord, supporting various types of dice (e.g., d20, d12, d10, d8, d6, d4).
- **Random Loot Generator**: Automatically generate loot for encounters, including items, gold, and magical artifacts.
- **Encounter Generator**: Create random encounters with different levels of difficulty and variety of monsters.
- **NPC Generator**: Generate random NPCs with unique names, backgrounds, and characteristics.

## Author

- [TanisJam](https://mnr.ar)
