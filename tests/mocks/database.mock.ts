import { Model } from 'sequelize';

// Tipo base para nuestros modelos mockados
interface MockModel {
  [key: string]: jest.Mock | any;
}

// Mock para modelos de base de datos

// Para User
export const mockUser: MockModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn()
};

// Para PingHistory
export const mockPingHistory: MockModel = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn()
};

// Para Duelist
export const mockDuelist: MockModel = {
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn()
};

// Para BodyPart
export const mockBodyPart: MockModel = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn()
};

// Para Combat
export const mockCombat: MockModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
};

// Mock para sequelize
export const mockSequelize: MockModel = {
  sync: jest.fn().mockResolvedValue(true),
  transaction: jest.fn().mockReturnValue({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  }),
  close: jest.fn().mockResolvedValue(undefined),
  authenticate: jest.fn().mockResolvedValue(undefined),
  define: jest.fn().mockReturnValue(Model)
};

// Función para resetear todos los mocks
export const resetMocks = (): void => {
  jest.clearAllMocks();
  
  // Resetear mocks individuales
  const mockObjects = [
    mockUser, 
    mockPingHistory, 
    mockDuelist, 
    mockBodyPart, 
    mockCombat, 
    mockSequelize
  ];
  
  mockObjects.forEach(mockObj => {
    for (const key in mockObj) {
      if (typeof mockObj[key] === 'function' && mockObj[key].mockReset) {
        mockObj[key].mockReset();
      }
    }
  });
};

// Funciones helper para configurar los mocks
export const mockUserFindOrCreate = (userData: any, created = true): any => {
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
};

export const mockUserFindOne = (userData: any | null): any => {
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
};

export const mockPingHistoryFindOne = (data: any | null): any => {
  mockPingHistory.findOne.mockResolvedValue(data);
  return data;
};

// Helpers para Duelist
export const mockDuelistFindOne = (duelistData: any | null): any => {
  if (duelistData === null) {
    mockDuelist.findOne.mockResolvedValue(null);
    return null;
  }
  
  const duelistInstance = {
    ...duelistData,
    save: jest.fn().mockResolvedValue(undefined)
  };
  
  mockDuelist.findOne.mockResolvedValue(duelistInstance);
  return duelistInstance;
};

// Helpers para BodyPart
export const mockBodyPartFindAll = (bodyParts: any[]): any[] => {
  mockBodyPart.findAll.mockResolvedValue(bodyParts);
  return bodyParts;
};

// Helpers para Combat
export const mockCombatCreate = (combatData: any): any => {
  const combatInstance = {
    ...combatData,
    save: jest.fn().mockResolvedValue(undefined)
  };
  
  mockCombat.create.mockResolvedValue(combatInstance);
  return combatInstance;
}; 