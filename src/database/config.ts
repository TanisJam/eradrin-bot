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
 * @param force Si es true, elimina y recrea las tablas (¡CUIDADO: elimina datos existentes!)
 * @param alter Si es true, altera las tablas existentes para que coincidan con los modelos
 */
export const initDatabase = async (force: boolean = false, alter: boolean = false): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    if (force) {
      // CUIDADO: force:true elimina todas las tablas y datos
      console.warn('⚠️ FORCE MODE: All tables will be dropped and recreated!');
      await sequelize.sync({ force: true });
      console.log('✅ Database reset and models synchronized.');
    } else if (alter) {
      // Altera las tablas existentes para añadir nuevas columnas/restricciones
      // NOTA: SQLite tiene limitaciones para alterar tablas, puede dar problemas
      console.log('Altering tables to match models...');
      try {
        await sequelize.sync({ alter: true });
        console.log('✅ Tables altered and models synchronized.');
      } catch (error) {
        console.error('Error altering tables, falling back to normal sync:', error);
        // Si falla alterar, intentamos con sync normal
        await sequelize.sync();
        console.log('✅ Models synchronized without altering tables.');
      }
    } else {
      // En producción usamos sync normal para preservar los datos
      await sequelize.sync();
      console.log('Models synchronized with database.');
    }
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error; // Propagate error to be handled at a higher level
  }
};

export default sequelize;
