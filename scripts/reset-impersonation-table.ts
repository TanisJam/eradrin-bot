import { Sequelize } from 'sequelize';
import config from '../src/config';
import ImpersonationCharacter from '../src/database/models/ImpersonationCharacter';
import { logger } from '../src/utils/logger';

/**
 * Script para recrear la tabla ImpersonationCharacters
 * ADVERTENCIA: Este script eliminará la tabla y todos sus datos
 */
async function resetImpersonationTable() {
  try {
    logger.info('🔄 Iniciando recreación de tabla ImpersonationCharacters...');
    
    // Primero nos conectamos a la base de datos
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.DATABASE_PATH,
      logging: false
    });
    
    await sequelize.authenticate();
    logger.info('✅ Conexión a la base de datos establecida.');
    
    // Eliminamos la tabla directamente usando una consulta SQL
    logger.info('🗑️ Eliminando tabla ImpersonationCharacters...');
    await sequelize.query('DROP TABLE IF EXISTS "ImpersonationCharacters"');
    logger.info('✅ Tabla eliminada correctamente.');
    
    // Volvemos a inicializar la base de datos para recrear la tabla
    logger.info('🔄 Recreando tabla con el modelo actualizado...');
    
    // Forzamos la sincronización de solo el modelo ImpersonationCharacter
    await ImpersonationCharacter.sync({ force: true });
    
    logger.info('✅ Tabla ImpersonationCharacters recreada correctamente!');
    logger.info('ℹ️ La tabla ahora está vacía. Los usuarios tendrán que volver a crear sus personajes.');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al recrear la tabla:', error);
    process.exit(1);
  }
}

// Pedimos confirmación antes de ejecutar
logger.warn('⚠️ ADVERTENCIA: Este script eliminará todos los personajes de impersonación existentes.');
logger.warn('⚠️ Esta acción no se puede deshacer.');
logger.warn('⚠️ Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...');

setTimeout(resetImpersonationTable, 5000); 