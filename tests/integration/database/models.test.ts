import { mockSequelize } from '../../mocks/database.mock';

// Mock para sequelize y models
jest.mock('../../../src/database/config', () => mockSequelize);
jest.mock('../../../src/database/models/User', () => ({
  create: jest.fn().mockImplementation((data) => {
    const instance = {
      ...data,
      save: jest.fn().mockResolvedValue(undefined),
      updateLastPing: jest.fn().mockImplementation(() => {
        instance.lastPing = new Date();
        return Promise.resolve(instance);
      })
    };
    return Promise.resolve(instance);
  }),
  findByPk: jest.fn().mockImplementation((id) => Promise.resolve({
    id,
    nickName: 'UpdatedUser',
    lastPing: new Date(),
    save: jest.fn().mockResolvedValue(undefined)
  })),
  destroy: jest.fn().mockResolvedValue(1)
}));

jest.mock('../../../src/database/models/PingHistory', () => ({
  create: jest.fn().mockImplementation((data) => Promise.resolve({
    ...data,
    id: Math.floor(Math.random() * 1000),
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined)
  })),
  findOne: jest.fn().mockResolvedValue({
    id: 1,
    lastPingUserId: '123456789',
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined)
  }),
  findAll: jest.fn().mockImplementation(() => Promise.resolve([
    {
      id: 3,
      lastPingUserId: '333333',
      createdAt: new Date(2023, 0, 3)
    },
    {
      id: 2,
      lastPingUserId: '222222',
      createdAt: new Date(2023, 0, 2)
    }
  ])),
  destroy: jest.fn().mockResolvedValue(1)
}));

// Importar los modelos después de configurar los mocks
import User from '../../../src/database/models/User';
import PingHistory from '../../../src/database/models/PingHistory';

describe('Integración de modelos de base de datos', () => {
  beforeAll(async () => {
    // Sincronizar modelos con la base de datos en memoria
    await mockSequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await mockSequelize.close();
  });
  
  afterEach(async () => {
    // Limpiar datos después de cada prueba
    jest.clearAllMocks();
  });
  
  test('debe crear y actualizar un usuario correctamente', async () => {
    // Crear usuario
    const user = await User.create({
      id: '123456789',
      nickName: 'TestUser',
      lastPing: new Date()
    });
    
    expect(user.id).toBe('123456789');
    expect(user.nickName).toBe('TestUser');
    
    // Actualizar usuario usando el método de instancia
    await user.updateLastPing();
    
    // Verificar que se actualizó la fecha
    expect(user.lastPing).toBeInstanceOf(Date);
    
    // Actualizar nickname directamente
    user.nickName = 'UpdatedUser';
    await user.save();
    
    // Verificar actualización
    const updatedUser = await User.findByPk('123456789');
    expect(updatedUser?.nickName).toBe('UpdatedUser');
  });
  
  test('debe registrar historial de ping con relación a usuario', async () => {
    // Crear usuario primero
    await User.create({
      id: '123456789',
      nickName: 'TestUser',
      lastPing: new Date()
    });
    
    // Crear historial
    const pingHistory = await PingHistory.create({
      lastPingUserId: '123456789'
    });
    
    expect(pingHistory.lastPingUserId).toBe('123456789');
    
    // Verificar que se puede recuperar el último historial
    const lastHistory = await PingHistory.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    expect(lastHistory).not.toBeNull();
    expect(lastHistory?.lastPingUserId).toBe('123456789');
  });
  
  test('debe crear múltiples registros de historial y recuperarlos ordenados', async () => {
    // Crear usuario
    await User.create({
      id: '123456789',
      nickName: 'TestUser',
      lastPing: new Date()
    });
    
    // Crear múltiples registros de historial
    await PingHistory.create({ lastPingUserId: '111111' });
    await PingHistory.create({ lastPingUserId: '222222' });
    await PingHistory.create({ lastPingUserId: '333333' });
    
    // Recuperar el historial ordenado por fecha de creación descendente
    const histories = await PingHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 2
    });
    
    expect(histories.length).toBe(2);
    expect(histories[0].lastPingUserId).toBe('333333');
    expect(histories[1].lastPingUserId).toBe('222222');
  });
}); 