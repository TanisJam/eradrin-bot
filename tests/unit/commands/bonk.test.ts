import { execute } from '../../../src/commands/bonk';
import { DuelistService } from '../../../src/services/Duelist.service';
import { CombatService } from '../../../src/services/Combat.service';

// Mocks
jest.mock('../../../src/services/Duelist.service');
jest.mock('../../../src/services/Combat.service');

// Mockear los modelos de la base de datos
jest.mock('../../../src/database/models/Duelist', () => ({
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn(),
  hasMany: jest.fn()
}));

jest.mock('../../../src/database/models/BodyPart', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  belongsTo: jest.fn()
}));

jest.mock('../../../src/database/models/Combat', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn()
}));

// Importar los mocks después de definirlos
import Duelist from '../../../src/database/models/Duelist';
import BodyPart from '../../../src/database/models/BodyPart';
import Combat from '../../../src/database/models/Combat';

describe('Comando bonk', () => {
  let mockInteraction: any;
  let mockAttackerDuelist: any;
  let mockDefenderDuelist: any;
  let mockBodyParts: any[];
  let mockCombatInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar el mock para la interacción
    mockInteraction = {
      user: {
        id: 'user123',
        username: 'Atacante',
        toString: () => '@Atacante'
      },
      options: {
        getSubcommand: jest.fn().mockReturnValue('golpear'),
        getUser: jest.fn().mockReturnValue({
          id: 'target456',
          username: 'Defensor',
          toString: () => '@Defensor'
        }),
        get: jest.fn(name => {
          if (name === 'usuario') {
            return {
              value: {
                id: 'target456',
                username: 'Defensor',
                toString: () => '@Defensor'
              }
            };
          }
          return null;
        })
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configurar mocks para los duelistas
    mockAttackerDuelist = {
      id: 'attacker1',
      userId: 'user123',
      username: 'Atacante',
      conditions: [],
      save: jest.fn().mockResolvedValue(undefined)
    };
    
    mockDefenderDuelist = {
      id: 'defender1',
      userId: 'target456',
      username: 'Defensor',
      conditions: [],
      save: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configurar el mock para las partes del cuerpo
    mockBodyParts = [
      { 
        id: 'part1', 
        duelistId: 'attacker1', 
        type: 'head', 
        name: 'cabeza', 
        health: 60, 
        maxHealth: 60 
      },
      { 
        id: 'part2', 
        duelistId: 'attacker1', 
        type: 'torso', 
        name: 'torso', 
        health: 120, 
        maxHealth: 120 
      }
    ];
    
    // Configurar el mock para el combate
    mockCombatInstance = {
      id: 'combat1',
      attackerId: 'attacker1',
      defenderId: 'defender1',
      currentDuelistId: 'attacker1',
      save: jest.fn().mockResolvedValue(undefined)
    };
    
    // Configurar los mocks de Duelist
    (Duelist.findOne as jest.Mock)
      .mockResolvedValueOnce(mockAttackerDuelist)
      .mockResolvedValueOnce(mockDefenderDuelist);
    
    // Configurar los mocks de BodyPart
    (BodyPart.findAll as jest.Mock).mockResolvedValue(mockBodyParts);
    
    // Configurar el mock para Combat
    (Combat.create as jest.Mock).mockResolvedValue(mockCombatInstance);
    (Combat.findOne as jest.Mock).mockResolvedValue(mockCombatInstance); // Asegura que siempre haya un combate
    (Combat.update as jest.Mock).mockResolvedValue([1]); // Simula update exitoso
    
    // Configurar el mock para DuelistService
    (DuelistService as jest.Mock).mockImplementation(() => ({
      generateRandomDuelist: jest.fn().mockImplementation((userId, username) => {
        const newDuelist = {
          id: userId === 'user123' ? 'attacker1' : 'defender1',
          userId,
          username,
          conditions: []
        };
        return Promise.resolve(newDuelist);
      })
    }));
    
    // Configurar el mock para CombatService
    (CombatService as jest.Mock).mockImplementation(() => ({
      startCombate: jest.fn().mockResolvedValue(mockCombatInstance),
      processTurn: jest.fn().mockResolvedValue({
        actionResult: {
          success: true,
          damage: 10,
          critical: false,
          dodged: false,
          blocked: false
        }
      })
    }));
    
    // Mockear Date.now para controlar el cooldown
    jest.spyOn(global.Date, 'now')
      .mockImplementationOnce(() => 1000) // Primera llamada
      .mockImplementationOnce(() => 1000); // Segunda llamada (misma timestamp para saltarnos el cooldown)
  });
  
  test('debe ejecutar el comando bonk correctamente', async () => {
    // Ejecutar el comando
    await execute(mockInteraction);
    
    // Verificar que se llama a deferReply
    expect(mockInteraction.deferReply).toHaveBeenCalled();
    
    // Verificar que se llama a editReply
    expect(mockInteraction.editReply).toHaveBeenCalled();
  });
}); 