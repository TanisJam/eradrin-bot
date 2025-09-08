// Importar los mocks primero
import { mockUser, mockPingHistory, resetMocks, mockUserFindOrCreate, mockUserFindOne, mockPingHistoryFindOne } from '../../mocks/database.mock';
import { execute } from '../../../src/commands/ping';
import { TransactionService } from '../../../src/services/Transaction.service';
import User from '../../../src/database/models/User';
import PingHistory from '../../../src/database/models/PingHistory';
import { logger } from '../../../src/utils/logger';

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
  
  test('debe registrar al usuario y responder con Pong cuando es el primer ping', async () => {
    // Mock para PingHistory.findOne (no hay pings previos)
    (PingHistory.findOne as jest.Mock).mockResolvedValue(null);
    
    // Mock para User.findOrCreate (crear nuevo usuario)
    (User.findOrCreate as jest.Mock).mockResolvedValue([
      {
        id: '123456789',
        nickName: 'TestUser',
        lastPing: new Date(),
        save: jest.fn().mockResolvedValue(undefined)
      },
      true // usuario creado
    ]);
    
    // Mock para PingHistory.create
    (PingHistory.create as jest.Mock).mockResolvedValue({});
    
    await execute(mockInteraction);
    
    // Verificar que se usó el servicio de transacciones
    expect(TransactionService.executeInTransaction).toHaveBeenCalled();
    
    // Verificar que se buscó el último ping
    expect(PingHistory.findOne).toHaveBeenCalledWith({
      order: [['createdAt', 'DESC']],
      transaction: expect.any(Object)
    });
    
    // Verificar que se creó/actualizó el usuario
    expect(User.findOrCreate).toHaveBeenCalledWith({
      where: { id: '123456789' },
      defaults: {
        id: '123456789',
        nickName: 'TestUser',
        lastPing: expect.any(Date)
      },
      transaction: expect.any(Object)
    });
    
    // Verificar que se creó una entrada en el historial
    expect(PingHistory.create).toHaveBeenCalledWith(
      { lastPingUserId: '123456789' },
      { transaction: expect.any(Object) }
    );
    
    // Verificar que se respondió correctamente
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      '🏓 Pong! Eres el primer usuario en usar este comando.'
    );
  });
  
  test('debe mostrar información del último usuario que hizo ping', async () => {
    // Fecha simulada para el último ping
    const lastPingDate = new Date('2023-01-01T12:00:00');
    
    // Mock para PingHistory.findOne (hay un ping previo)
    (PingHistory.findOne as jest.Mock).mockResolvedValue({
      lastPingUserId: 'previousUser123'
    });
    
    // Mock para User.findOrCreate (usuario existente)
    (User.findOrCreate as jest.Mock).mockResolvedValue([
      {
        id: '123456789',
        nickName: 'TestUser',
        lastPing: new Date(),
        save: jest.fn().mockResolvedValue(undefined)
      },
      false // usuario ya existía
    ]);
    
    // Mock para User.findOne (buscar último usuario)
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 'previousUser123',
      nickName: 'PreviousUser',
      lastPing: lastPingDate
    });
    
    // Mock para PingHistory.create
    (PingHistory.create as jest.Mock).mockResolvedValue({});
    
    await execute(mockInteraction);
    
    // Verificar que se buscó al usuario previo
    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: 'previousUser123' },
      transaction: expect.any(Object)
    });
    
    // Verificar que se respondió con la información del último usuario
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('🏓 Pong! Último usuario: PreviousUser')
    );
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining(lastPingDate.toLocaleString('es'))
    );
  });
  
  test('debe actualizar los datos si el usuario ya existe', async () => {
    // Mock para PingHistory.findOne
    (PingHistory.findOne as jest.Mock).mockResolvedValue(null);
    
    // Mock para el usuario existente con método save
    const mockUser = {
      id: '123456789',
      nickName: 'OldNick',
      lastPing: new Date('2022-01-01'),
      save: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock para User.findOrCreate (usuario existente)
    (User.findOrCreate as jest.Mock).mockResolvedValue([mockUser, false]);
    
    await execute(mockInteraction);
    
    // Verificar que se actualizaron los datos del usuario
    expect(mockUser.nickName).toBe('TestUser');
    expect(mockUser.lastPing).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalled();
  });
  
  test('debe manejar errores generales', async () => {
    // Simular un error en la transacción
    (TransactionService.executeInTransaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );
    
    await execute(mockInteraction);
    
    // Verificar que se registró el error
    expect(logger.error).toHaveBeenCalledWith(
      'Error general en comando ping:',
      expect.any(Error)
    );
    
    // Verificar que se respondió con un mensaje de error
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      'Ha ocurrido un error al ejecutar el comando. Inténtalo de nuevo más tarde.'
    );
  });
  
  test('debe rechazar el comando si no se usa en un servidor', async () => {
    // Modificar el mock para simular que no hay guild
    mockInteraction.guild = null;
    
    await execute(mockInteraction);
    
    // Verificar que se rechaza el comando
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      'Este comando solo puede ser usado en un servidor.'
    );
    
    // Verificar que no se realizaron operaciones de base de datos
    expect(TransactionService.executeInTransaction).not.toHaveBeenCalled();
  });
  
  test('debe usar el nombre de usuario si no hay nickname', async () => {
    // Modificar el mock para simular ausencia de nickname
    mockInteraction.guild.members.fetch.mockResolvedValue({
      nickname: null,
      user: {
        username: 'TestUser',
        id: '123456789'
      },
      id: '123456789'
    });
    
    // Mock para PingHistory y User
    (PingHistory.findOne as jest.Mock).mockResolvedValue(null);
    (User.findOrCreate as jest.Mock).mockResolvedValue([
      {
        id: '123456789',
        nickName: 'TestUser',
        lastPing: new Date(),
        save: jest.fn().mockResolvedValue(undefined)
      },
      true
    ]);
    
    await execute(mockInteraction);
    
    // Verificar que se usó el nombre de usuario en lugar del nickname
    expect(User.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.objectContaining({
          nickName: 'TestUser'
        })
      })
    );
  });
}); 