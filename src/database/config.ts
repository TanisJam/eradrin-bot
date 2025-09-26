import { Sequelize } from 'sequelize';
import config from '../config';
import { logger } from '../utils/logger';

// Sequelize instance for SQLite connection
const sequelize = new Sequelize({
  dialect: config.database.dialect as 'sqlite',
  storage: config.database.storage,
  logging: config.database.logging ? console.log : false
});

/**
 * Initializes the database connection and synchronizes models
 * @param force Si es true, elimina y recrea las tablas (¡CUIDADO: elimina datos existentes!)
 * @param alter Si es true, altera las tablas existentes para que coincidan con los modelos
 */
export const initDatabase = async (force: boolean = false, alter: boolean = false): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida exitosamente.');
    
    if (force) {
      // CUIDADO: force:true elimina todas las tablas y datos
      logger.warn('⚠️ MODO FORCE: ¡Todas las tablas se eliminarán y recrearán!');
      await sequelize.sync({ force: true });
      logger.info('✅ Base de datos restablecida y modelos sincronizados.');
    } else if (alter) {
      // Altera las tablas existentes para añadir nuevas columnas/restricciones
      // NOTA: SQLite tiene limitaciones para alterar tablas, puede dar problemas
      logger.info('Alterando tablas para que coincidan con los modelos...');
      try {
        await sequelize.sync({ alter: true });
        logger.info('✅ Tablas alteradas y modelos sincronizados.');
      } catch (error) {
        logger.error('Error al alterar tablas, volviendo a sincronización normal:', error);
        // Si falla alterar, intentamos con sync normal
        await sequelize.sync();
        logger.info('✅ Modelos sincronizados sin alterar tablas.');
      }
    } else {
      // En producción usamos sync normal para preservar los datos
      await sequelize.sync();
      logger.info('Modelos sincronizados con la base de datos.');
    }
  } catch (error) {
    logger.error('No se pudo conectar a la base de datos:', error);
    throw error; // Propagate error to be handled at a higher level
  }
};

export default sequelize;
