import { Sequelize } from 'sequelize';
import config from '../src/config';
import ImpersonationCharacter from '../src/database/models/ImpersonationCharacter';

/**
 * Script para recrear la tabla ImpersonationCharacters
 * ADVERTENCIA: Este script eliminará la tabla y todos sus datos
 */
async function resetImpersonationTable() {
  try {
    console.log('🔄 Iniciando recreación de tabla ImpersonationCharacters...');
    
    // Primero nos conectamos a la base de datos
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.DATABASE_PATH,
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');
    
    // Eliminamos la tabla directamente usando una consulta SQL
    console.log('🗑️ Eliminando tabla ImpersonationCharacters...');
    await sequelize.query('DROP TABLE IF EXISTS "ImpersonationCharacters"');
    console.log('✅ Tabla eliminada correctamente.');
    
    // Volvemos a inicializar la base de datos para recrear la tabla
    console.log('🔄 Recreando tabla con el modelo actualizado...');
    
    // Forzamos la sincronización de solo el modelo ImpersonationCharacter
    await ImpersonationCharacter.sync({ force: true });
    
    console.log('✅ Tabla ImpersonationCharacters recreada correctamente!');
    console.log('ℹ️ La tabla ahora está vacía. Los usuarios tendrán que volver a crear sus personajes.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al recrear la tabla:', error);
    process.exit(1);
  }
}

// Pedimos confirmación antes de ejecutar
console.log('⚠️ ADVERTENCIA: Este script eliminará todos los personajes de impersonación existentes.');
console.log('⚠️ Esta acción no se puede deshacer.');
console.log('⚠️ Presiona Ctrl+C para cancelar o espera 5 segundos para continuar...');

setTimeout(resetImpersonationTable, 5000); 