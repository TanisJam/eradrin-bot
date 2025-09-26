import { execute } from '../../../src/commands/summary';
import { getAiModel } from '../../../src/ai-model';
import { Collection } from 'discord.js';

// Mocks
jest.mock('../../../src/ai-model');

describe('Comando summary', () => {
  let mockInteraction: any;
  let mockClient: any;
  let mockChannel: any;
  let mockMessages: any[];
  let mockCollection: any;
  let mockAiModel: any;
  let mockChatInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mockear el tiempo para controlar el cooldown
    jest.spyOn(global.Date, 'now')
      .mockImplementation(() => new Date('2023-01-01T12:00:00').getTime());
    
    // Mock para la colección de mensajes
    mockMessages = [
      {
        id: 'msg1',
        content: 'Hola a todos',
        author: { username: 'Usuario1' },
        createdTimestamp: new Date('2023-01-01T11:00:00').getTime(),
      },
      {
        id: 'msg2',
        content: 'Cómo están?',
        author: { username: 'Usuario2' },
        createdTimestamp: new Date('2023-01-01T11:05:00').getTime(),
      }
    ];
    
    // Crear una colección real (no mockear sus métodos internos)
    mockCollection = new Collection();
    mockMessages.forEach(msg => mockCollection.set(msg.id, msg));
    
    // Mock para el canal
    mockChannel = {
      messages: {
        fetch: jest.fn().mockResolvedValue(mockCollection)
      },
      send: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock para la interacción
    mockInteraction = {
      channel: mockChannel,
      user: { id: 'user123' },
      options: {
        get: jest.fn().mockReturnValue({ value: 10 })
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock para el cliente
    mockClient = {};
    
    // Mock para el chat
    mockChatInstance = {
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Este es un resumen generado por el modelo.'
        }
      })
    };
    
    // Mock para el modelo de IA
    mockAiModel = {
      startChat: jest.fn().mockReturnValue(mockChatInstance)
    };
    
    // Configurar el mock para getAiModel
    (getAiModel as jest.Mock).mockImplementation(() => mockAiModel);
  });
  
  test('debe ejecutar el comando summary sin errores', async () => {
    // Ejecutar el comando
    await execute(mockInteraction, mockClient);
    
    // Verificar que se llama a deferReply
    expect(mockInteraction.deferReply).toHaveBeenCalled();
    
    // Verificar que se obtienen los mensajes
    expect(mockChannel.messages.fetch).toHaveBeenCalled();
    
    // Verificar que se llama a editReply
    expect(mockInteraction.editReply).toHaveBeenCalled();
  });
}); 