import { TransactionService } from '../../../src/services/Transaction.service';
import sequelize from '../../../src/database/config';

// Mock para sequelize
jest.mock('../../../src/database/config', () => {
  return {
    transaction: jest.fn().mockReturnValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    }),
  };
});

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('executeInTransaction debe ejecutar la función callback y hacer commit', async () => {
    const mockCallback = jest.fn().mockResolvedValue('resultado');
    const result = await TransactionService.executeInTransaction(mockCallback, 'Test transaction');
    
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalled();
    expect(result).toBe('resultado');
    
    const transaction = await sequelize.transaction();
    expect(transaction.commit).toHaveBeenCalled();
    expect(transaction.rollback).not.toHaveBeenCalled();
  });
  
  test('executeInTransaction debe hacer rollback en caso de error', async () => {
    const mockCallback = jest.fn().mockRejectedValue(new Error('Test error'));
    
    await expect(
      TransactionService.executeInTransaction(mockCallback, 'Test transaction')
    ).rejects.toThrow('Test error');
    
    const transaction = await sequelize.transaction();
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
  });

  test('executeMultiModelTransaction debe ejecutar operaciones en secuencia', async () => {
    const mockOperations = {
      op1: jest.fn().mockResolvedValue('resultado1'),
      op2: jest.fn().mockImplementation(async (transaction, results) => {
        expect(results.op1).toBe('resultado1');
        return 'resultado2';
      }),
    };

    const result = await TransactionService.executeMultiModelTransaction(
      mockOperations,
      'Test multi-model transaction'
    );

    expect(result).toEqual({
      op1: 'resultado1',
      op2: 'resultado2',
    });

    expect(mockOperations.op1).toHaveBeenCalled();
    expect(mockOperations.op2).toHaveBeenCalled();
    expect(sequelize.transaction).toHaveBeenCalled();

    const transaction = await sequelize.transaction();
    expect(transaction.commit).toHaveBeenCalled();
  });
}); 