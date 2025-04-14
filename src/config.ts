import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Define interface for configuration
export interface AppConfig {
  CLIENT_ID: string;
  TOKEN: string;
  GUILD_ID: string;
  GEMINI_API_KEY: string;
  DATABASE_PATH: string;
}

// Extract environment variables
const { CLIENT_ID, TOKEN, GUILD_ID, GEMINI_API_KEY } = process.env;

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'TOKEN', 'GUILD_ID', 'GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Application configuration
const config: AppConfig = {
  CLIENT_ID: CLIENT_ID!,
  TOKEN: TOKEN!,
  GUILD_ID: GUILD_ID!,
  GEMINI_API_KEY: GEMINI_API_KEY!,
  DATABASE_PATH: path.join(__dirname, '../database.sqlite'),
};

export default config;