// Configuración global para pruebas
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.test si existe
dotenv.config({ path: '.env.test' });

// Asegúrate de que estamos usando SQLite en memoria para pruebas
process.env.DB_STORAGE = ':memory:';

// Desactivar logs durante las pruebas
jest.mock('../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
})); 