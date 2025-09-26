import { execute } from '../../../src/commands/help';

describe('Comando help', () => {
  let mockInteraction: any;
  
  beforeEach(() => {
    // Mock para la interacción
    mockInteraction = {
      reply: jest.fn().mockResolvedValue(undefined)
    };
  });
  
  test('debe responder con un mensaje de ayuda', async () => {
    await execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining('Comandos Disponibles')
    );
  });
  
  test('debe incluir información sobre todos los comandos principales', async () => {
    await execute(mockInteraction);
    
    const response = mockInteraction.reply.mock.calls[0][0];
    
    // Verificar que el mensaje incluye comandos importantes
    expect(response).toMatch(/\/ask/);
    expect(response).toMatch(/\/character/);
    expect(response).toMatch(/\/ping/);
    expect(response).toMatch(/\/roll/);
    expect(response).toMatch(/\/rollstats/);
  });
  
  test('debe incluir información sobre las opciones del comando roll', async () => {
    await execute(mockInteraction);
    
    const response = mockInteraction.reply.mock.calls[0][0];
    
    // Verificar que incluye información detallada sobre roll
    expect(response).toMatch(/dice.*requerido/i);
    expect(response).toMatch(/d20/);
    expect(response).toMatch(/number/i);
    expect(response).toMatch(/mod/i);
    expect(response).toMatch(/dc/i);
    expect(response).toMatch(/iterations/i);
    expect(response).toMatch(/advantage/i);
  });
}); 