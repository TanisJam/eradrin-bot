import { mockSequelize, mockUser, mockPingHistory } from '../../mocks/database.mock';
import { data as pingData, execute as pingExecute } from '../../../src/commands/ping';
import { InteractionMock } from '../../mocks/discord.mock';

// Mocks para las pruebas
jest.mock('../../../src/database/config', () => mockSequelize);
jest.mock('../../../src/database/models/User', () => mockUser);
jest.mock('../../../src/database/models/PingHistory', () => mockPingHistory);
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}));

describe('Integración de comandos con Discord', () => {
  beforeAll(async () => {
    // Inicializar la base de datos en memoria
    await mockSequelize.sync({ force: true });
  });

  afterAll(async () => {
    await mockSequelize.close();
  });

  afterEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('Comando ping', () => {
    test('debe tener una estructura válida', () => {
      expect(pingData).toBeDefined();
      expect(pingData.name).toBe('ping');
      expect(pingData.description).toBeDefined();
      expect(typeof pingExecute).toBe('function');
    });

    test('debe registrar un usuario y su interacción en la base de datos', async () => {
      // Configurar mocks
      mockUser.findOrCreate.mockResolvedValue([
        {
          id: '12345',
          nickName: 'NickTest',
          lastPing: new Date(),
          save: jest.fn().mockResolvedValue(undefined)
        },
        true
      ]);
      
      mockPingHistory.findOne.mockResolvedValue(null);
      mockPingHistory.create.mockResolvedValue({
        id: 1,
        lastPingUserId: '12345',
        createdAt: new Date()
      });
      
      // Crear un mock de interacción
      const mockInteraction = new InteractionMock({
        user: { id: '12345', username: 'TestUser' },
        guild: {
          members: {
            fetch: jest.fn().mockResolvedValue({
              nickname: 'NickTest',
              id: '12345',
              user: { username: 'TestUser' }
            })
          }
        }
      });

      // Ejecutar el comando
      await pingExecute(mockInteraction as any);

      // Verificar que se guardó el usuario en la base de datos
      expect(mockUser.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '12345' }
        })
      );

      // Verificar que se registró la interacción
      expect(mockPingHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lastPingUserId: '12345'
        }),
        expect.any(Object)
      );

      // Verificar la respuesta al usuario
      expect(mockInteraction.replied).toBe(true);
      expect(mockInteraction.replies[0].content).toMatch(/Pong! Eres el primer usuario/);
    });

    test('debe mostrar el último usuario que usó el comando', async () => {
      // Configurar mocks
      mockUser.findOrCreate.mockResolvedValue([
        {
          id: '12345',
          nickName: 'NickTest',
          lastPing: new Date(),
          save: jest.fn().mockResolvedValue(undefined)
        },
        true
      ]);
      
      mockPingHistory.findOne.mockResolvedValue({
        lastPingUserId: '9999'
      });
      
      mockUser.findOne.mockResolvedValue({
        id: '9999',
        nickName: 'PreviousUser',
        lastPing: new Date(),
        toLocaleString: () => '01/01/2023'
      });
      
      mockPingHistory.create.mockResolvedValue({
        id: 2,
        lastPingUserId: '12345',
        createdAt: new Date()
      });

      // Crear un mock de interacción para un nuevo usuario
      const mockInteraction = new InteractionMock({
        user: { id: '12345', username: 'TestUser' },
        guild: {
          members: {
            fetch: jest.fn().mockResolvedValue({
              nickname: 'NickTest',
              id: '12345',
              user: { username: 'TestUser' }
            })
          }
        }
      });

      // Ejecutar el comando
      await pingExecute(mockInteraction as any);

      // Verificar que se creó el nuevo usuario
      expect(mockUser.findOrCreate).toHaveBeenCalled();

      // Verificar que se registró una nueva interacción
      expect(mockPingHistory.create).toHaveBeenCalled();

      // Verificar la respuesta al usuario
      expect(mockInteraction.replied).toBe(true);
      expect(mockInteraction.replies[0].content).toMatch(/Pong! Último usuario: PreviousUser/);
    });
  });
}); 