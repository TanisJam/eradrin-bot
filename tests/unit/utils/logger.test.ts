import { logger } from '../../../src/utils/logger';

// Sobreescribir mock para poder probar este módulo específicamente
jest.unmock('../../../src/utils/logger');

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });
  
  test('debe registrar mensajes de información', () => {
    logger.info('Mensaje de información');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] Mensaje de información/),
    );
  });

  test('debe registrar mensajes de advertencia', () => {
    logger.warn('Mensaje de advertencia');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[WARN\] Mensaje de advertencia/),
    );
  });

  test('debe registrar mensajes de error', () => {
    logger.error('Mensaje de error');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\] Mensaje de error/),
    );
  });

  test('debe registrar mensajes de depuración cuando no está en producción', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    logger.debug('Mensaje de depuración');
    expect(consoleDebugSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG\] Mensaje de depuración/),
    );
    
    // Restaurar el entorno original
    process.env.NODE_ENV = oldEnv;
  });

  test('no debe registrar mensajes de depuración en producción', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    logger.debug('Mensaje de depuración');
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    
    // Restaurar el entorno original
    process.env.NODE_ENV = oldEnv;
  });
}); 