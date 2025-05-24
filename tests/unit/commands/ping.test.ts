// Importar los mocks primero
import { mockUser, mockPingHistory, resetMocks, mockUserFindOrCreate, mockUserFindOne, mockPingHistoryFindOne } from '../../mocks/database.mock';
import { execute } from '../../../src/commands/ping';
import { TransactionService } from '../../../src/services/Transaction.service';

// Mocks
jest.mock('../../../src/services/Transaction.service');
jest.mock('../../../src/database/models/User', () => mockUser);
jest.mock('../../../src/database/models/PingHistory', () => mockPingHistory);
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}));

describe('Comando ping', () => {
  let mockInteraction: any;
  
  beforeEach(() => {
    // Limpiar todos los mocks
    resetMocks();
    
    // Crear un mock de la interacción
    mockInteraction = {
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            nickname: 'TestUser',
            id: '123456789',
            user: {
              username: 'TestUser'
            }
          })
        }
      },
      user: {
        id: '123456789'
      },
      reply: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock para TransactionService
    (TransactionService.executeInTransaction as jest.Mock).mockImplementation(
      async (callback) => {
        return callback({});
      }
    );
  });
  
  test('debe responder con el último usuario cuando existe', async () => {
    // Configurar mocks para simular un usuario previo
    const mockLastUser = {
      nickName: 'LastUser',
      lastPing: new Date(),
      toLocaleString: () => '01/01/2023'
    };
    
    // Mock para PingHistory.findOne
    mockPingHistoryFindOne({
      lastPingUserId: '987654321'
    });
    
    // Mock para User.findOne y User.findOrCreate
    mockUserFindOne(mockLastUser);
    mockUserFindOrCreate({
      id: '123456789', 
      nickName: 'TestUser', 
      lastPing: new Date()
    }, true);
    
    // Ejecutar comando
    await execute(mockInteraction);
    
    // Verificar resultado
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Pong! Último usuario: LastUser')
    );
    
    // Verificar que se guardó la interacción
    expect(mockPingHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lastPingUserId: '123456789'
      }),
      expect.any(Object)
    );
  });
  
  test('debe responder correctamente cuando no hay historial previo', async () => {
    // Configurar mocks para caso sin historial
    mockPingHistoryFindOne(null);
    mockUserFindOrCreate({
      id: '123456789', 
      nickName: 'TestUser', 
      lastPing: new Date()
    }, true);
    
    // Ejecutar comando
    await execute(mockInteraction);
    
    // Verificar resultado
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Pong! Eres el primer usuario')
    );
  });
  
  test('debe actualizar usuario existente', async () => {
    // Configurar mocks para simular un usuario ya existente
    const mockExistingUser = { 
      id: '123456789', 
      nickName: 'OldNickname', 
      lastPing: new Date(2022, 0, 1),
      save: jest.fn().mockResolvedValue(undefined)
    };
    
    mockPingHistoryFindOne(null);
    
    // Simular que el usuario existe y se actualiza
    mockUser.findOrCreate.mockResolvedValue([mockExistingUser, false]);
    
    // Ejecutar comando
    await execute(mockInteraction);
    
    // Verificar que se actualiza el usuario
    expect(mockExistingUser.nickName).toBe('TestUser');
    expect(mockExistingUser.lastPing).toBeInstanceOf(Date);
    expect(mockExistingUser.save).toHaveBeenCalled();
  });
  
  test('debe manejar errores correctamente', async () => {
    // Simular un error
    (TransactionService.executeInTransaction as jest.Mock).mockRejectedValue(
      new Error('Test error')
    );
    
    // Ejecutar comando
    await execute(mockInteraction);
    
    // Verificar respuesta de error
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Ha ocurrido un error al ejecutar el comando')
    );
  });
  
  test('debe rechazar comandos fuera de un servidor', async () => {
    // Remover guild para simular comando fuera de servidor
    mockInteraction.guild = null;
    
    // Ejecutar comando
    await execute(mockInteraction);
    
    // Verificar que se rechaza el comando
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      'Este comando solo puede ser usado en un servidor.'
    );
  });
}); 