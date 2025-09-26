import { execute } from '../../../src/commands/points';
import User from '../../../src/database/models/User';

// Mock para User
jest.mock('../../../src/database/models/User', () => ({
  findOrCreate: jest.fn()
}));

describe('Comando points', () => {
  let mockInteraction: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para la interacción
    mockInteraction = {
      user: {
        id: 'user123',
        username: 'TestUser'
      },
      reply: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configurar el mock de findOrCreate para que devuelva un usuario
    (User.findOrCreate as jest.Mock).mockResolvedValue([
      { 
        id: 'user123', 
        nickName: 'TestUser',
        lastPing: new Date() 
      },
      false // indicando que el usuario no fue creado (ya existía)
    ]);
  });
  
  test('debe responder con un mensaje que incluye el nombre del usuario', async () => {
    await execute(mockInteraction);
    
    // Verificar que se buscó al usuario
    expect(User.findOrCreate).toHaveBeenCalledWith({
      where: { id: 'user123' },
      defaults: {
        id: 'user123',
        nickName: 'TestUser',
        lastPing: expect.any(Date)
      }
    });
    
    // Verificar que se respondió con el mensaje esperado
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Hola TestUser! Gracias por usar este comando.')
    );
  });
  
  test('debe crear un nuevo usuario si no existe', async () => {
    // Modificar el mock para indicar que el usuario fue creado
    (User.findOrCreate as jest.Mock).mockResolvedValue([
      { 
        id: 'user123', 
        nickName: 'TestUser',
        lastPing: new Date() 
      },
      true // indicando que el usuario fue creado
    ]);
    
    await execute(mockInteraction);
    
    // Verificar que se creó al usuario con los datos correctos
    expect(User.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: {
          id: 'user123',
          nickName: 'TestUser',
          lastPing: expect.any(Date)
        }
      })
    );
    
    // Verificar que se respondió correctamente
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Hola TestUser!')
    );
  });
}); 