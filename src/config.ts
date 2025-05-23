import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Database configuration interfaces
interface DatabaseConfig {
  dialect: string;
  storage: string;
  logging: boolean;
}

interface ConfigEnvironments {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

// Main application configuration interface
export interface AppConfig {
  // Discord Bot
  CLIENT_ID: string;
  TOKEN: string;
  GUILD_ID: string;
  
  // AI Services
  GEMINI_API_KEY: string;
  
  // Database
  DATABASE_PATH: string;
  database: DatabaseConfig;
}

// Extract environment variables
const { CLIENT_ID, TOKEN, GUILD_ID, GEMINI_API_KEY } = process.env;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'TOKEN', 'GUILD_ID', 'GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Database configuration by environment
const databaseConfigs: ConfigEnvironments = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: true
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  }
};

// Application configuration
const config: AppConfig = {
  // Discord Bot
  CLIENT_ID: CLIENT_ID!,
  TOKEN: TOKEN!,
  GUILD_ID: GUILD_ID!,
  
  // AI Services
  GEMINI_API_KEY: GEMINI_API_KEY!,
  
  // Database
  DATABASE_PATH: path.join(__dirname, '../database.sqlite'),
  database: databaseConfigs[NODE_ENV as keyof ConfigEnvironments]
};

export default config;