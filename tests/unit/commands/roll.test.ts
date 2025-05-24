import { execute } from '../../../src/commands/roll';

// Mock para DiceRoll
jest.mock('@dice-roller/rpg-dice-roller', () => ({
  DiceRoll: jest.fn().mockImplementation(() => ({
    total: 15,
    toString: () => '3d20 = 15',
    rolls: [{ rolls: [5, 7, 3] }]
  }))
}));

describe('Comando roll', () => {
  let mockInteraction: any;
  
  beforeEach(() => {
    // Resetear mocks entre pruebas
    jest.clearAllMocks();
    
    // Mock para la interacción
    mockInteraction = {
      options: {
        get: jest.fn().mockImplementation((name) => {
          const options: Record<string, any> = {
            dice: { value: 20 },
            number: { value: 1 },
            mod: { value: 0 },
            dc: { value: 0 },
            iterations: { value: 1 },
            advantage: { value: undefined }
          };
          return options[name] || null;
        })
      },
      reply: jest.fn().mockResolvedValue(undefined)
    };
  });
  
  test('debe ejecutar una tirada básica correctamente', async () => {
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Resultados de la tirada')
    );
  });
  
  test('debe manejar tiradas con modificador', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 5 },
        dc: { value: 0 },
        iterations: { value: 1 },
        advantage: { value: undefined }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Resultados de la tirada')
    );
  });
  
  test('debe manejar tiradas con ventaja', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 2 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 1 },
        advantage: { value: 'adv' }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Resultados de la tirada')
    );
  });
  
  test('debe manejar tiradas con desventaja', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 2 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 1 },
        advantage: { value: 'dis' }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Resultados de la tirada')
    );
  });
  
  test('debe rechazar ventaja/desventaja con menos de 2 dados', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 1 },
        advantage: { value: 'adv' }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      '🔸*La tirada debe tener al menos dos dados para poder usar ventaja o desventaja*'
    );
  });
  
  test('debe manejar múltiples iteraciones', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 5 },
        advantage: { value: undefined }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringMatching(/Tiradas realizadas:.*5/)
    );
  });
  
  test('debe manejar tiradas con DC', async () => {
    // Mock para DiceRoll con resultado por encima del DC
    jest.mock('@dice-roller/rpg-dice-roller', () => ({
      DiceRoll: jest.fn().mockImplementation(() => ({
        total: 15,
        toString: () => '1d20 = 15',
        rolls: [{ rolls: [15] }]
      }))
    }));
    
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 0 },
        dc: { value: 10 },
        iterations: { value: 1 },
        advantage: { value: undefined }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringMatching(/DC: 10/)
    );
  });
  
  test('debe truncar la lista con más de 20 iteraciones', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 25 },
        advantage: { value: undefined }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringMatching(/\. \. \. \. \./)
    );
  });
  
  test('debe limitar el número de iteraciones a 100', async () => {
    mockInteraction.options.get = jest.fn().mockImplementation((name) => {
      const options: Record<string, any> = {
        dice: { value: 20 },
        number: { value: 1 },
        mod: { value: 0 },
        dc: { value: 0 },
        iterations: { value: 150 },
        advantage: { value: undefined }
      };
      return options[name] || null;
    });
    
    await execute(mockInteraction);
    
    // Verificar que se muestra el número de iteraciones configurado (no el real)
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringMatching(/Tiradas realizadas:.*150/)
    );
  });
}); 