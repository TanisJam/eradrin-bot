import { initDatabase } from '../src/database/config';
import '../src/database/models/ImpersonationCharacter'; // Importar el modelo para asegurarnos de que se registre
import { logger } from '../src/utils/logger';

/**
 * Script para sincronizar la base de datos con los modelos actualizados
 * Utiliza la opción 'alter: true' para modificar las tablas existentes
 */
async function syncDatabase() {
  try {
    logger.info('🔄 Iniciando sincronización de la base de datos...');
    
    // Pasamos 'alter: true' para que modifique las tablas existentes
    await initDatabase(false, true);
    
    logger.info('✅ Base de datos sincronizada correctamente.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al sincronizar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar la función
syncDatabase(); 