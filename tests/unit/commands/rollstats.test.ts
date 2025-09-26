import { execute } from '../../../src/commands/rollstats';
import { DiceRoll, exportFormats } from '@dice-roller/rpg-dice-roller';

// Mock para DiceRoll
jest.mock('@dice-roller/rpg-dice-roller', () => {
  return {
    DiceRoll: jest.fn(() => ({
      export: jest.fn(() => ({
        rolls: [
          {
            value: 15,
            rolls: [
              { value: 6, useInTotal: true },
              { value: 5, useInTotal: true },
              { value: 4, useInTotal: true },
              { value: 2, useInTotal: false }
            ]
          }
        ]
      }))
    })),
    exportFormats: {
      OBJECT: 'OBJECT'
    }
  };
});

describe('Comando rollstats', () => {
  let mockInteraction: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para la interacción
    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined)
    };
  });
  
  test('debe generar 6 tiradas para estadísticas', async () => {
    await execute(mockInteraction);
    
    // Verificar que se crearon 6 instancias de DiceRoll (4d6kh3)
    expect(DiceRoll).toHaveBeenCalledTimes(6);
    expect(DiceRoll).toHaveBeenCalledWith('4d6kh3');
    
    // Verificar que se respondió con las estadísticas
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Stats:')
    );
  });
  
  test('debe calcular correctamente el total de las estadísticas', async () => {
    // Con 6 tiradas de valor 15 cada una, el total debería ser 90
    await execute(mockInteraction);
    
    // Verificar que se muestra el total correcto
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Total: **90**')
    );
  });
  
  test('debe mostrar un emoji según el total', async () => {
    // El total 90 corresponde a un emoji específico
    await execute(mockInteraction);
    
    // Verificar que muestra algún emoji (no importa cuál específicamente)
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringMatching(/Total: \*\*90\*\*\n \:[a-z_]+\:/)
    );
  });
  
  test('debe mostrar los dados usados en negrita y los descartados tachados', async () => {
    await execute(mockInteraction);
    
    // Verificar el formato correcto
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('***6***, ***5***, ***4***, ~~2~~')
    );
  });
}); 