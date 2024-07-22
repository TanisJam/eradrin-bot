import dotenv from 'dotenv';
dotenv.config();

const { CLIENT_ID, TOKEN, GUILD_ID, GEMINI_API_KEY } = process.env;

if (!CLIENT_ID || !TOKEN || !GUILD_ID || !GEMINI_API_KEY) {
  throw new Error('Missing environment variables');
}


const config: Record<string, string> = {
  CLIENT_ID,
  TOKEN,
  GUILD_ID,
  GEMINI_API_KEY,
};

export default config;