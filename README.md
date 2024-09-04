<div align="center">
<img width="196px" alt="Eradrin Iamge" src="./assets/Eradrin.png">

# Eradrin Bot

Eradrin Bot is a Discord bot that acts as a chatbot using the Gemini AI API <br/> and also provides direct links to character sheets for a D&D campaign on the Nivel20 site.<br/>This is especially useful because the Nivel20 search engine is extremely slow and inefficient.

</div>

## ✨ Features

- **Chatbot**: Uses the Gemini AI API to interact with users.

![aks](./assets/ask.png)

- **Direct links to character sheets**: Provides quick and direct links to character sheets on Nivel20.

![character](./assets/character.png)

## 📦 Requirements

- Node.js
- Discord Bot Token
- Gemini AI API Key
- **`.env`** file with the following variables:
  - **`CLIENT_ID`**
  - **`TOKEN`**
  - **`GUILD_ID`**
  - **`GEMINI_API_KEY`**

## ⚡️ Quick start

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

## 🎯 Upcoming Features

I am planning to add the following features to enhance the D&D experience:

 - [x] **Dice Roller**: A feature to roll dice directly within Discord, supporting various types of dice (e.g., d20, d12, d10, d8, d6, d4).
 - [ ] **Random Loot Generator**: Automatically generate loot for encounters, including items, gold, and other stuff.
 - [ ] **Plot Generator**: Create random plots for encounters or adventures.
 - [ ] **Encounter Generator**: Create random encounters with different levels of difficulty and variety of monsters.
 - [ ] **NPC Generator**: Generate random NPCs with unique names, backgrounds, and characteristics.


## 👩‍💻 Author

- [TanisJam](https://mnr.ar)
