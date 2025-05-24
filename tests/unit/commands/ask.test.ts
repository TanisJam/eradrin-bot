import { execute } from '../../../src/commands/ask';
import { getAiModel } from '../../../src/ai-model';
import ragService from '../../../src/services/RAG.service';

// Mocks
jest.mock('../../../src/ai-model');
jest.mock('../../../src/services/RAG.service');

describe('Comando ask', () => {
  let mockInteraction: any;
  let mockModel: any;
  let mockChatSession: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para el modelo de AI
    mockChatSession = {
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Esta es una respuesta de prueba'
        }
      })
    };
    
    mockModel = {
      startChat: jest.fn().mockReturnValue(mockChatSession)
    };
    
    (getAiModel as jest.Mock).mockReturnValue(mockModel);
    
    // Mock para el servicio RAG
    (ragService.searchRelevantChunks as jest.Mock).mockResolvedValue([
      { text: 'Chunk de conocimiento relevante 1', source: 'player-characters' },
      { text: 'Chunk de conocimiento relevante 2', source: 'stories' }
    ]);
    
    (ragService.formatChunksForContext as jest.Mock).mockReturnValue(
      '[Source: player-characters] Chunk de conocimiento relevante 1\n[Source: stories] Chunk de conocimiento relevante 2'
    );
    
    // Mock para la interacción
    mockInteraction = {
      user: {
        id: 'user123',
        displayName: 'DisplayName',
        globalName: 'GlobalName'
      },
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            nickname: 'NickName',
            user: {
              username: 'Username'
            }
          })
        }
      },
      options: {
        get: jest.fn().mockReturnValue({ value: '¿Qué sabes sobre Silverymoon?' })
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined)
    };
  });
  
  test('debe buscar chunks relevantes y enviar una pregunta al modelo', async () => {
    await execute(mockInteraction);
    
    // Verificar que se buscaron chunks relevantes
    expect(ragService.searchRelevantChunks).toHaveBeenCalledWith('¿Qué sabes sobre Silverymoon?');
    
    // Verificar que se formatearon los chunks
    expect(ragService.formatChunksForContext).toHaveBeenCalled();
    
    // Verificar que se obtuvo el modelo AI con instrucciones actualizadas
    expect(getAiModel).toHaveBeenCalled();
    
    // Verificar que se inició una sesión de chat
    expect(mockModel.startChat).toHaveBeenCalled();
    
    // Verificar que se envió el mensaje al modelo
    expect(mockChatSession.sendMessage).toHaveBeenCalledWith('¿Qué sabes sobre Silverymoon?');
    
    // Verificar que se respondió al usuario
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('Esta es una respuesta de prueba')
    );
  });
  
  test('debe usar el nickname si está disponible', async () => {
    await execute(mockInteraction);
    
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('**NickName**')
    );
  });
  
  test('debe usar el nombre de usuario si no hay nickname', async () => {
    // Modificar el mock para simular la ausencia de nickname
    mockInteraction.guild.members.fetch.mockResolvedValue({
      nickname: null,
      user: {
        username: 'Username'
      }
    });
    
    await execute(mockInteraction);
    
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.stringContaining('**Username**')
    );
  });
  
  test('debe responder con un mensaje de error si falla la API', async () => {
    // Simular error en el modelo
    mockChatSession.sendMessage.mockRejectedValue(new Error('API Error'));
    
    await execute(mockInteraction);
    
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      'Ehh... Preguntame mas tarde, ahora estoy ocupado.'
    );
  });
  
  test('debe responder con mensaje de error si no hay pregunta', async () => {
    // Simular ausencia de pregunta
    mockInteraction.options.get.mockReturnValue(null);
    
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      'Que pasa? No me preguntaste nada.'
    );
  });
  
  test('debe incluir contexto del RAG en la instrucción de sistema si hay chunks relevantes', async () => {
    await execute(mockInteraction);
    
    // Verificar que el modelo fue inicializado con el contexto adicional
    expect(getAiModel).toHaveBeenCalledWith(
      expect.stringContaining('[Source: player-characters]')
    );
    expect(getAiModel).toHaveBeenCalledWith(
      expect.stringContaining('[Source: stories]')
    );
  });
  
  test('debe funcionar sin contexto RAG si no hay chunks relevantes', async () => {
    // Simular ausencia de chunks relevantes
    (ragService.formatChunksForContext as jest.Mock).mockReturnValue('');
    
    await execute(mockInteraction);
    
    // Verificar que el modelo fue inicializado sin el contexto adicional
    expect(getAiModel).toHaveBeenCalledWith(
      expect.not.stringContaining('[Source: player-characters]')
    );
  });
}); 