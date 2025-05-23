import { Transaction } from 'sequelize';
import sequelize from '../database/config';
import { logger } from '../utils/logger';

/**
 * Servicio para gestionar transacciones de base de datos
 * Proporciona una interfaz unificada para manejar transacciones en toda la aplicación
 */
export class TransactionService {
  /**
   * Ejecuta una función dentro de una transacción
   * @param callback Función a ejecutar dentro de la transacción
   * @param description Descripción de la operación para registrar en logs
   * @returns El resultado de la operación
   */
  static async executeInTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
    description: string
  ): Promise<T> {
    const transaction = await sequelize.transaction();
    try {
      logger.debug(`Iniciando transacción: ${description}`);
      const result = await callback(transaction);
      await transaction.commit();
      logger.debug(`Transacción completada: ${description}`);
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error en transacción (${description}):`, error);
      throw error;
    }
  }

  /**
   * Ejecuta operaciones relacionadas sobre múltiples modelos dentro de una transacción
   * Especialmente útil para operaciones complejas que afectan a varios modelos
   * @param operations Objeto con las operaciones a realizar para cada modelo
   * @param description Descripción de la operación para registrar en logs
   * @returns Objeto con los resultados de las operaciones por modelo
   */
  static async executeMultiModelTransaction<T extends Record<string, any>>(
    operations: {
      [key in keyof T]: (transaction: Transaction, results: Partial<T>) => Promise<T[key]>
    },
    description: string
  ): Promise<T> {
    return this.executeInTransaction(async (transaction) => {
      const results = {} as T;
      const operationKeys = Object.keys(operations) as Array<keyof T>;
      
      // Ejecutar operaciones en el orden definido, pasando resultados previos
      for (const key of operationKeys) {
        results[key] = await operations[key](transaction, results);
      }
      
      return results;
    }, `Operación compleja: ${description}`);
  }
} 