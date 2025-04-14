import { Sequelize } from 'sequelize';
import config from '../config';

// Sequelize instance for SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.DATABASE_PATH,
  logging: false
});

/**
 * Initializes the database connection and synchronizes models
 */
export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // En producción usamos sync normal para preservar los datos
    await sequelize.sync();
    console.log('Models synchronized with database.');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error; // Propagate error to be handled at a higher level
  }
};

export default sequelize;
