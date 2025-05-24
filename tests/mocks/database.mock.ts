import { Model } from 'sequelize';

// Mock para User
export const mockUser = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  prototype: {
    save: jest.fn(),
    updateLastPing: jest.fn()
  }
};

// Mock para PingHistory
export const mockPingHistory = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn(),
  prototype: {
    save: jest.fn()
  }
};

// Mock para sequelize
export const mockSequelize = {
  sync: jest.fn().mockResolvedValue(true),
  transaction: jest.fn().mockReturnValue({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  }),
  close: jest.fn().mockResolvedValue(undefined),
  authenticate: jest.fn().mockResolvedValue(undefined),
  define: jest.fn().mockReturnValue(Model)
};

// Funciones para configurar respuestas de los mocks
export function mockUserFindOrCreate(userData: any, created = true) {
  const userInstance = {
    ...userData,
    save: jest.fn().mockResolvedValue(undefined),
    updateLastPing: jest.fn().mockImplementation(() => {
      userInstance.lastPing = new Date();
      return Promise.resolve();
    })
  };
  
  mockUser.findOrCreate.mockResolvedValue([userInstance, created]);
  return userInstance;
}

export function mockUserFindOne(userData: any | null) {
  if (userData === null) {
    mockUser.findOne.mockResolvedValue(null);
    return null;
  }
  
  const userInstance = {
    ...userData,
    save: jest.fn().mockResolvedValue(undefined),
    updateLastPing: jest.fn().mockImplementation(() => {
      userInstance.lastPing = new Date();
      return Promise.resolve();
    })
  };
  
  mockUser.findOne.mockResolvedValue(userInstance);
  return userInstance;
}

export function mockPingHistoryFindOne(data: any | null) {
  mockPingHistory.findOne.mockResolvedValue(data);
  return data;
}

export function resetMocks() {
  jest.resetAllMocks();
} 