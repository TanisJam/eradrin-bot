import path from 'path';

interface DatabaseConfig {
  dialect: string;
  storage: string;
}

interface ConfigEnvironments {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
}

const config: ConfigEnvironments = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite')
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite')
  }
};

const env = process.env.NODE_ENV || 'development';
export default config[env as keyof ConfigEnvironments]; 