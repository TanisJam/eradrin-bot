import Duelist from '../database/models/Duelist';
import BodyPart from '../database/models/BodyPart';
import { AttackResult } from '../types/Combat.type';
import { generateCombatDescription } from '../constants/CombatDescriptions';
import User from '../database/models/User';
import { BaseService } from './BaseService';
import sequelize from '../database/config';
import { TransactionService } from './Transaction.service';
import { DND_RACES, RACE_STATS } from '../constants/RaceStats';

/**
 * Servicio para gestionar duelistas y sus acciones
 */
export class DuelistService extends BaseService {
  constructor() {
    super('DuelistService');
  }

  /**
   * Crea un nuevo duelista o devuelve uno existente
   */
  async createDuelist(userId: string, name: string, race: string) {
    return TransactionService.executeInTransaction(async (transaction) => {
      this.logDebug(`Creando duelista para usuario ${userId}: ${name} (${race})`);
      
      // Buscar duelista existente dentro de la transacción
      const existingDuelist = await Duelist.findOne({ 
        where: { userId },
        transaction
      });
      
      if (existingDuelist) {
        this.logInfo(`Duelista existente encontrado para usuario ${userId}`);
        return existingDuelist;
      }

      // Verificar si existe el usuario, y crearlo si no existe
      const [user, created] = await User.findOrCreate({
        where: { id: userId },
        defaults: {
          id: userId,
          nickName: name,
          lastPing: new Date(),
        },
        transaction
      });

      if (created) {
        this.logInfo(`Usuario ${userId} creado automáticamente`);
      }

      // Obtener estadísticas basadas en la raza o usar valores predeterminados si la raza no está definida
      const stats = RACE_STATS[race as keyof typeof RACE_STATS] || RACE_STATS['Humano'];
      this.logDebug(`Aplicando estadísticas de raza ${race}: ${JSON.stringify(stats)}`);

      // Crear duelista dentro de la transacción
      const duelist = await Duelist.create({
        userId,
        name,
        race,
        stats: {
          strength: stats.strength,
          agility: stats.agility,
          endurance: stats.endurance,
          recovery: stats.recovery,
        },
        status: {
          bleeding: 0,
          pain: 0,
          consciousness: 100,
          fatigue: 0,
        },
      }, { transaction });

      // Crear partes del cuerpo por defecto con valores de salud realistas
      const bodyParts = [
        { name: 'Cabeza', health: 60, type: 'head' },      // La cabeza es vital pero más frágil
        { name: 'Torso', health: 120, type: 'torso' },     // El torso es la parte más grande y resistente
        { name: 'Brazo Izquierdo', health: 50, type: 'arm' },  // Los brazos son más débiles que el torso
        { name: 'Brazo Derecho', health: 50, type: 'arm' },
        { name: 'Pierna Izquierda', health: 70, type: 'leg' }, // Las piernas son más fuertes que los brazos
        { name: 'Pierna Derecha', health: 70, type: 'leg' },
      ];

      // Crear todas las partes del cuerpo en paralelo pero dentro de la transacción
      await Promise.all(
        bodyParts.map((part) =>
          BodyPart.create({
            duelistId: duelist.id,
            ...part,
          }, { transaction })
        )
      );

      this.logInfo(`Duelista creado exitosamente: ${name} (ID: ${duelist.id})`);
      return duelist;
    }, `Crear duelista para usuario ${userId}`);
  }

  /**
   * Realiza un ataque de un duelista a otro
   */
  async attack(attackerId: number, defenderId: number, targetBodyPart: string) {
    try {
      this.logDebug(`Ataque: ${attackerId} -> ${defenderId} (${targetBodyPart})`);
      
      const attacker = await Duelist.findByPk(attackerId);
      const defender = await Duelist.findByPk(defenderId);

      if (!attacker || !defender) {
        throw new Error('Duelista no encontrado');
      }

      // Verificar si hay un modificador temporal de ataque
      let attackModifier = 1.0;
      const attackModCondition = attacker.conditions.find(c => c.startsWith('attack_modifier_'));
      if (attackModCondition) {
        attackModifier = parseFloat(attackModCondition.split('_')[2]);
        this.logDebug(`Aplicando modificador de ataque: ${attackModifier}`);
      }

      // Verificar si hay un modificador temporal de defensa en el defensor
      let defenseModifier = 1.0;
      let isDefending = false;
      const defenseModCondition = defender.conditions.find(c => c.startsWith('defending_'));
      if (defenseModCondition) {
        defenseModifier = parseFloat(defenseModCondition.split('_')[1]);
        isDefending = true;
        this.logDebug(`El defensor tiene modificador de defensa: ${defenseModifier}`);
        
        // Limpiar la condición de defensa después de usarla
        defender.conditions = defender.conditions.filter(c => !c.startsWith('defending_'));
        await defender.save();
      }

      const baseRoll = this.rollD20();
      
      // Aplicar la agilidad como bono a la tirada (cada punto por encima de 10 da +5% de precisión)
      const agilityBonus = (attacker.stats.agility - 10) * 0.05;
      let agilityModifier = 1.0 + Math.max(-0.5, Math.min(0.5, agilityBonus)); // Limitar entre 0.5 y 1.5
      
      this.logDebug(`Bono de agilidad: ${attacker.stats.agility} => modificador ${agilityModifier.toFixed(2)}`);
      
      // Aplicar modificadores a la tirada
      const effectiveRoll = Math.floor(baseRoll * attackModifier * agilityModifier);
      this.logDebug(`Tirada base: ${baseRoll}, con modificadores (ataque: ${attackModifier}, agilidad: ${agilityModifier.toFixed(2)}): ${effectiveRoll}`);
      
      const attackResult = this.getAttackResult(effectiveRoll);
      this.logDebug(`Resultado de tirada (${effectiveRoll}): ${attackResult}`);

      if (attackResult === AttackResult.CRITICAL_FAILURE) {
        return this.handleCriticalFailure(attacker);
      }

      if (attackResult === AttackResult.FAILURE) {
        return this.handleFailure(attacker, defender, targetBodyPart);
      }

      return this.handleSuccess(attacker, defender, targetBodyPart, attackResult, attackModifier, defenseModifier, isDefending);
    } catch (error) {
      return this.handleError(error, `Error al realizar ataque`);
    }
  }

  /**
   * Gestiona fallo crítico (daño a uno mismo)
   */
  private async handleCriticalFailure(attacker: Duelist) {
    // Aumentamos el daño de fallo crítico para ser consistentes con los otros cambios
    const selfDamage = Math.floor(attacker.stats.strength * 0.8);
    const randomBodyPart = await this.getRandomBodyPart(attacker.id);
    
    if (randomBodyPart) {
      // Aplicar modificador según el tipo de parte
      let adjustedDamage = selfDamage;
      switch (randomBodyPart.type) {
        case 'head':
          adjustedDamage = Math.floor(selfDamage * 1.5);
          break;
        case 'torso':
          adjustedDamage = Math.floor(selfDamage * 1.2);
          break;
        case 'arm':
          adjustedDamage = Math.floor(selfDamage * 0.9);
          break;
        case 'leg':
          adjustedDamage = Math.floor(selfDamage * 1.0);
          break;
      }
      
      const previousHealth = randomBodyPart.health;
      randomBodyPart.health -= adjustedDamage;
      await randomBodyPart.save();
      
      this.logDebug(`Fallo crítico: Daño a ${randomBodyPart.name} - ${previousHealth} → ${randomBodyPart.health} (-${adjustedDamage})`);

      const description = generateCombatDescription(AttackResult.CRITICAL_FAILURE, {
        attackerName: attacker.name,
        defenderName: attacker.name,
        bodyPart: randomBodyPart.name,
        damage: adjustedDamage,
        finalHealth: randomBodyPart.health,
        bleeding: attacker.status.bleeding,
        consciousness: attacker.status.consciousness
      });

      // Actualizar estado del personaje (aumentar sangrado y dolor)
      const updatedStatus = this.updateStatus(attacker.status, adjustedDamage * 0.5);
      attacker.status = updatedStatus;
      await attacker.save();

      return {
        success: false,
        isCriticalFailure: true,
        damage: adjustedDamage,
        targetBodyPart: randomBodyPart.name,
        description,
        affectedDuelist: attacker,
      };
    }
    
    return {
      success: false,
      isCriticalFailure: true,
      damage: 0,
      targetBodyPart: 'ninguna',
      description: `${attacker.name} falla críticamente, pero por suerte evita dañarse a sí mismo`,
      affectedDuelist: attacker,
    };
  }

  /**
   * Gestiona fallo normal (sin daño)
   */
  private handleFailure(attacker: Duelist, defender: Duelist, targetBodyPart: string) {
    const description = generateCombatDescription(AttackResult.FAILURE, {
      attackerName: attacker.name,
      defenderName: defender.name,
      bodyPart: targetBodyPart,
      damage: 0,
      finalHealth: 100, // No hay daño
      bleeding: 0,
      consciousness: 100
    });

    return {
      success: false,
      isCriticalFailure: false,
      damage: 0,
      targetBodyPart,
      description,
      affectedDuelist: null,
    };
  }

  /**
   * Gestiona acierto (daño al oponente)
   */
  private async handleSuccess(
    attacker: Duelist, 
    defender: Duelist, 
    targetBodyPart: string, 
    attackResult: AttackResult,
    attackModifier: number = 1.0,
    defenseModifier: number = 1.0,
    isDefending: boolean = false
  ) {
    try {
      // Buscar la parte del cuerpo objetivo
      const bodyPart = await BodyPart.findOne({
        where: {
          duelistId: defender.id,
          name: targetBodyPart
        }
      });

      if (!bodyPart) {
        throw new Error(`Parte del cuerpo ${targetBodyPart} no encontrada`);
      }

      // Calcular el daño base considerando fuerza del atacante y resistencia del defensor
      let baseDamage = this.calculateDamage(attacker.stats.strength, defender.stats.endurance);
      
      // Aplicar modificadores por tipo de resultado
      switch(attackResult) {
        case AttackResult.CRITICAL_SUCCESS:
          baseDamage *= 2.0; // Doble daño en crítico
          break;
        case AttackResult.SUCCESS:
          baseDamage *= 1.5; // 50% más de daño en éxito completo
          break;
        case AttackResult.PARTIAL_SUCCESS:
          baseDamage *= 1.0; // Daño normal en éxito parcial
          break;
      }
      
      // Aplicar modificador de ataque si existe
      baseDamage *= attackModifier;
      
      // Aplicar reducción de daño si el objetivo está defendiéndose
      if (isDefending) {
        baseDamage = Math.floor(baseDamage / defenseModifier);
        this.logDebug(`Daño reducido por defensa: ${baseDamage} (modificador: ${defenseModifier})`);
      }
      
      // Aplicar modificador según el tipo de parte del cuerpo
      let finalDamage = baseDamage;
      switch (bodyPart.type) {
        case 'head':
          finalDamage = Math.floor(baseDamage * 1.5); // +50% daño a la cabeza
          break;
        case 'torso':
          finalDamage = Math.floor(baseDamage * 1.2); // +20% daño al torso
          break;
        case 'arm':
          finalDamage = Math.floor(baseDamage * 0.8); // -20% daño a los brazos
          break;
        case 'leg':
          finalDamage = Math.floor(baseDamage * 0.9); // -10% daño a las piernas
          break;
      }
      
      // Registrar información del daño
      this.logDebug(`Daño calculado a ${targetBodyPart}: base=${baseDamage}, final=${finalDamage}`);
      
      // Guardar salud anterior para la descripción
      const previousHealth = bodyPart.health;
      
      // Aplicar el daño a la parte del cuerpo
      bodyPart.health = Math.max(0, bodyPart.health - finalDamage);
      await bodyPart.save();
      
      // Calcular incremento de sangrado y dolor basado en el daño y la parte
      const bleedingIncrease = Math.floor(finalDamage * 0.7);
      const painIncrease = Math.floor(finalDamage * 0.8);
      const fatigueIncrease = Math.floor(finalDamage * 0.3);
      const consciousnessDecrease = Math.floor(finalDamage * 0.5);
      
      // Aplicar modificadores según la parte afectada
      let bleedingMultiplier = 1.0;
      let painMultiplier = 1.0;
      let consciousnessMultiplier = 1.0;
      
      switch (bodyPart.type) {
        case 'head':
          bleedingMultiplier = 1.5;   // La cabeza sangra mucho
          painMultiplier = 1.2;       // La cabeza duele más
          consciousnessMultiplier = 2.0; // La cabeza afecta más a la consciencia
          break;
        case 'torso':
          bleedingMultiplier = 1.7;   // El torso sangra mucho
          painMultiplier = 1.5;       // El torso duele bastante
          consciousnessMultiplier = 1.3; // El torso afecta a la consciencia
          break;
        case 'arm':
          bleedingMultiplier = 0.8;   // Los brazos sangran menos
          painMultiplier = 1.0;       // Los brazos duelen normal
          consciousnessMultiplier = 0.5; // Los brazos afectan poco a la consciencia
          break;
        case 'leg':
          bleedingMultiplier = 1.0;   // Las piernas sangran normal
          painMultiplier = 1.2;       // Las piernas duelen bastante
          consciousnessMultiplier = 0.7; // Las piernas afectan poco a la consciencia
          break;
      }
      
      // Actualizar el estado del defensor
      defender.status.bleeding = Math.min(100, defender.status.bleeding + Math.floor(bleedingIncrease * bleedingMultiplier));
      defender.status.pain = Math.min(100, defender.status.pain + Math.floor(painIncrease * painMultiplier));
      defender.status.fatigue = Math.min(100, defender.status.fatigue + fatigueIncrease);
      defender.status.consciousness = Math.max(0, defender.status.consciousness - Math.floor(consciousnessDecrease * consciousnessMultiplier));
      
      // Verificar condiciones críticas
      if (bodyPart.health <= 0) {
        // Parte del cuerpo completamente dañada
        switch (bodyPart.type) {
          case 'head':
            defender.conditions.push('unconscious');
            break;
          case 'torso':
            defender.conditions.push('severely_injured');
            break;
          case 'arm':
          case 'leg':
            // Añadir condición específica de miembro inutilizado
            defender.conditions.push(`disabled_${bodyPart.name.toLowerCase().replace(' ', '_')}`);
            break;
        }
      }
      
      // Verificar estado general basado en parámetros vitales
      if (defender.status.consciousness <= 10) {
        if (!defender.conditions.includes('unconscious')) {
          defender.conditions.push('unconscious');
        }
      } else if (defender.status.pain >= 90) {
        if (!defender.conditions.includes('incapacitated')) {
          defender.conditions.push('incapacitated');
        }
      } else if (defender.status.bleeding >= 80) {
        if (!defender.conditions.includes('hemorrhage')) {
          defender.conditions.push('hemorrhage');
        }
      } else if (defender.status.fatigue >= 90) {
        if (!defender.conditions.includes('exhausted')) {
          defender.conditions.push('exhausted');
        }
      }
      
      await defender.save();
      
      // Generar descripción del ataque
      const description = generateCombatDescription(attackResult, {
        attackerName: attacker.name,
        defenderName: defender.name,
        bodyPart: targetBodyPart,
        damage: finalDamage,
        finalHealth: bodyPart.health,
        bleeding: defender.status.bleeding,
        consciousness: defender.status.consciousness
      });
      
      return {
        success: true,
        isCriticalSuccess: attackResult === AttackResult.CRITICAL_SUCCESS,
        damage: finalDamage,
        targetBodyPart,
        description,
        affectedDuelist: defender,
      };
    } catch (error) {
      return this.handleError(error, `Error al procesar ataque exitoso`);
    }
  }

  /**
   * Permite a un duelista recuperarse
   */
  async recover(duelistId: number) {
    try {
      this.logDebug(`Recuperación para duelista ${duelistId}`);
      const duelist = await Duelist.findByPk(duelistId);
      
      if (!duelist) {
        throw new Error('Duelista no encontrado');
      }
      
      // Verificar cuán efectiva puede ser la recuperación basada en stats
      const recoveryEffectiveness = (duelist.stats.recovery / 10) || 1;
      this.logDebug(`Efectividad de recuperación: ${recoveryEffectiveness}`);
      
      // Calcular mejoras basadas en recovery stat
      const painReduction = Math.round(5 * recoveryEffectiveness);
      const bleedingReduction = Math.round(4 * recoveryEffectiveness);
      const fatigueReduction = Math.round(8 * recoveryEffectiveness);
      const consciousnessImprovement = Math.round(6 * recoveryEffectiveness);
      
      // Aplicar las mejoras
      const oldStatus = { ...duelist.status };
      
      duelist.status.pain = Math.max(0, duelist.status.pain - painReduction);
      duelist.status.bleeding = Math.max(0, duelist.status.bleeding - bleedingReduction);
      duelist.status.fatigue = Math.max(0, duelist.status.fatigue - fatigueReduction);
      duelist.status.consciousness = Math.min(100, duelist.status.consciousness + consciousnessImprovement);
      
      this.logDebug(`Recuperación aplicada: 
        Dolor: ${oldStatus.pain} -> ${duelist.status.pain},
        Sangrado: ${oldStatus.bleeding} -> ${duelist.status.bleeding},
        Fatiga: ${oldStatus.fatigue} -> ${duelist.status.fatigue},
        Consciencia: ${oldStatus.consciousness} -> ${duelist.status.consciousness}`
      );
      
      // Generar texto descriptivo de la recuperación
      let descriptionParts = [];
      
      if (oldStatus.bleeding > duelist.status.bleeding) {
        if (oldStatus.bleeding - duelist.status.bleeding > 10) {
          descriptionParts.push(`detiene gran parte del sangrado`);
        } else {
          descriptionParts.push(`ralentiza el sangrado`);
        }
      }
      
      if (oldStatus.pain > duelist.status.pain) {
        if (oldStatus.pain - duelist.status.pain > 10) {
          descriptionParts.push(`reduce significativamente el dolor`);
        } else {
          descriptionParts.push(`alivia algo de dolor`);
        }
      }
      
      if (oldStatus.fatigue > duelist.status.fatigue) {
        if (oldStatus.fatigue - duelist.status.fatigue > 10) {
          descriptionParts.push(`recupera bastante energía`);
        } else {
          descriptionParts.push(`recupera algo de energía`);
        }
      }
      
      if (oldStatus.consciousness < duelist.status.consciousness) {
        if (duelist.status.consciousness - oldStatus.consciousness > 10) {
          descriptionParts.push(`se despeja notablemente la mente`);
        } else {
          descriptionParts.push(`se despeja un poco`);
        }
      }
      
      let description = '';
      if (descriptionParts.length > 0) {
        description = `${duelist.name} toma un momento para recuperarse y ${descriptionParts.join(', ')}.`;
      } else {
        description = `${duelist.name} intenta recuperarse, pero no logra mejorar su condición.`;
      }
      
      // Si el personaje tenía alguna condición recuperable, intentar eliminarla
      const removableConditions = [
        'bleeding', 
        'severe_bleeding',
        'incapacitated',
        'exhausted'
      ];
      
      let conditionsRemoved = false;
      let newConditions = duelist.conditions.filter(condition => {
        if (removableConditions.includes(condition)) {
          // Para condiciones relacionadas con el sangrado, solo eliminar si el sangrado es bajo
          if (condition.includes('bleeding') && duelist.status.bleeding < 30) {
            conditionsRemoved = true;
            return false;
          }
          // Para incapacitado, solo eliminar si el dolor es bajo
          if (condition === 'incapacitated' && duelist.status.pain < 60) {
            conditionsRemoved = true;
            return false;
          }
          // Para exhausto, solo eliminar si la fatiga es baja
          if (condition === 'exhausted' && duelist.status.fatigue < 60) {
            conditionsRemoved = true;
            return false;
          }
        }
        return true;
      });
      
      if (conditionsRemoved) {
        duelist.conditions = newConditions;
        description += ` Su condición general mejora.`;
      }
      
      // También eliminar cualquier modificador temporal
      duelist.conditions = duelist.conditions.filter(c => 
        !c.startsWith('attack_modifier_') && 
        !c.startsWith('defending_')
      );
      
      await duelist.save();
      
      return {
        success: true,
        description,
        painReduction,
        bleedingReduction,
        fatigueReduction,
        consciousnessImprovement,
        status: duelist.status
      };
    } catch (error) {
      return this.handleError(error, `Error al procesar recuperación`);
    }
  }

  /**
   * Genera un duelista aleatorio para un usuario
   */
  async generateRandomDuelist(userId: string, username: string) {
    // Iniciar transacción para asegurar consistencia
    const transaction = await sequelize.transaction();
    
    try {
      this.logDebug(`Generando duelista aleatorio para usuario ${userId}`);
      
      // Primero verificar si ya existe un duelista para este usuario
      const existingDuelist = await Duelist.findOne({ 
        where: { userId },
        transaction
      });
      
      if (existingDuelist) {
        // También verificar si el duelista tiene partes del cuerpo
        const existingBodyParts = await BodyPart.findAll({
          where: { duelistId: existingDuelist.id },
          transaction
        });
        
        // Si el duelista existe pero no tiene partes del cuerpo, crearlas
        if (existingBodyParts.length === 0) {
          this.logInfo(`Duelista ${existingDuelist.name} (ID: ${existingDuelist.id}) no tiene partes del cuerpo, creándolas...`);
          
          // Crear partes del cuerpo por defecto con valores de salud realistas
          const bodyParts = [
            { name: 'Cabeza', health: 60, type: 'head' },
            { name: 'Torso', health: 120, type: 'torso' },
            { name: 'Brazo Izquierdo', health: 50, type: 'arm' },
            { name: 'Brazo Derecho', health: 50, type: 'arm' },
            { name: 'Pierna Izquierda', health: 70, type: 'leg' },
            { name: 'Pierna Derecha', health: 70, type: 'leg' },
          ];

          for (const part of bodyParts) {
            try {
              await BodyPart.create({
                duelistId: existingDuelist.id,
                ...part,
              }, { transaction });
              this.logDebug(`Parte del cuerpo creada: ${part.name}`);
            } catch (error) {
              this.logError(`Error al crear parte del cuerpo ${part.name}: ${error}`);
              throw error;
            }
          }
          
          this.logInfo(`Creadas todas las partes del cuerpo para el duelista existente ${existingDuelist.name}`);
        } else {
          this.logInfo(`Duelista ${existingDuelist.name} (ID: ${existingDuelist.id}) ya tiene ${existingBodyParts.length} partes del cuerpo`);
        }
        
        // Confirmar transacción
        await transaction.commit();
        return existingDuelist;
      }
      
      // Verificar si existe el usuario, y crearlo si no existe
      let user = await User.findByPk(userId, { transaction });
      if (!user) {
        this.logInfo(`Usuario ${userId} no encontrado, creándolo automáticamente desde generateRandomDuelist`);
        user = await User.create({
          id: userId,
          nickName: username,
          lastPing: new Date(),
        }, { transaction });
        
        // Esperar explícitamente a que se complete la creación
        await user.save({ transaction });
      }
      
      // Elegir una raza aleatoria
      const race = this.getRandomDndRace();
      const name = username;
      
      this.logDebug(`Creando duelista para usuario ${userId}: ${name} (${race})`);
      
      // Obtener estadísticas basadas en la raza
      const stats = RACE_STATS[race as keyof typeof RACE_STATS] || RACE_STATS['Humano'];
      this.logDebug(`Aplicando estadísticas de raza ${race}: ${JSON.stringify(stats)}`);

      // Crear el duelista directamente en esta transacción
      const duelist = await Duelist.create({
        userId,
        name,
        race,
        stats: {
          strength: stats.strength,
          agility: stats.agility,
          endurance: stats.endurance,
          recovery: stats.recovery,
        },
        status: {
          bleeding: 0,
          pain: 0,
          consciousness: 100,
          fatigue: 0,
        },
      }, { transaction });
      
      this.logInfo(`Duelista creado con ID: ${duelist.id}`);

      // Crear partes del cuerpo por defecto con valores de salud realistas
      const bodyParts = [
        { name: 'Cabeza', health: 60, type: 'head' },
        { name: 'Torso', health: 120, type: 'torso' },
        { name: 'Brazo Izquierdo', health: 50, type: 'arm' },
        { name: 'Brazo Derecho', health: 50, type: 'arm' },
        { name: 'Pierna Izquierda', health: 70, type: 'leg' },
        { name: 'Pierna Derecha', health: 70, type: 'leg' },
      ];

      // Crear cada parte individualmente para diagnosticar mejor
      for (const part of bodyParts) {
        try {
          const bodyPart = await BodyPart.create({
            duelistId: duelist.id,
            ...part,
          }, { transaction });
          this.logDebug(`Parte del cuerpo creada: ${part.name} con ID: ${bodyPart.id}`);
        } catch (error) {
          this.logError(`Error al crear parte del cuerpo ${part.name}: ${error}`);
          throw error;
        }
      }
      
      // Verificar que las partes del cuerpo se hayan creado correctamente
      const createdBodyParts = await BodyPart.findAll({
        where: { duelistId: duelist.id },
        transaction
      });
      
      this.logInfo(`Partes del cuerpo creadas: ${createdBodyParts.length}`);
      
      // Confirmar transacción
      await transaction.commit();
      
      this.logInfo(`Duelista aleatorio generado: ${name} (${race})`);
      return duelist;
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      return this.handleError(error, `Error al generar duelista aleatorio`);
    }
  }

  /**
   * Obtiene una raza D&D aleatoria
   */
  private getRandomDndRace(): string {
    const randomIndex = Math.floor(Math.random() * DND_RACES.length);
    return DND_RACES[randomIndex];
  }

  /**
   * Calcula el daño basado en la fuerza del atacante y la resistencia del defensor
   */
  private calculateDamage(
    attackerStrength: number,
    defenderEndurance: number,
    defenderAgility: number = 10 // Valor predeterminado si no se proporciona
  ): number {
    // Base de daño según la fuerza (aproximadamente 1.5 puntos por punto de fuerza)
    const baseDamage = Math.floor(attackerStrength * 1.5);
    
    // Reducción por resistencia (aproximadamente 0.75 puntos por punto de resistencia)
    const enduranceReduction = Math.floor(defenderEndurance * 0.75);
    
    // Reducción por agilidad (aproximadamente 0.25 puntos por punto de agilidad)
    const agilityReduction = Math.floor(defenderAgility * 0.25);
    
    // Daño mínimo: 5% de la fuerza del atacante (evitar daños de 0)
    const minimumDamage = Math.max(1, Math.floor(attackerStrength * 0.05));
    
    // Daño final: máximo entre el mínimo y (base - reducciones)
    const finalDamage = Math.max(
      minimumDamage,
      baseDamage - enduranceReduction - agilityReduction
    );
    
    return finalDamage;
  }

  /**
   * Actualiza el estado de un duelista basado en el daño recibido
   */
  private updateStatus(currentStatus: any, damage: number) {
    // Clonar el estado actual para no modificarlo directamente
    const newStatus = { ...currentStatus };
    
    // Incrementar el sangrado y dolor basado en el daño
    newStatus.bleeding = Math.min(100, newStatus.bleeding + Math.floor(damage * 0.6));
    newStatus.pain = Math.min(100, newStatus.pain + Math.floor(damage * 0.7));
    
    return newStatus;
  }

  /**
   * Simula una tirada de D20
   */
  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Interpreta el resultado de una tirada de D20
   */
  private getAttackResult(roll: number): AttackResult {
    if (roll <= 1) return AttackResult.CRITICAL_FAILURE;
    if (roll <= 5) return AttackResult.FAILURE;
    if (roll <= 10) return AttackResult.PARTIAL_SUCCESS;
    if (roll <= 19) return AttackResult.SUCCESS;
    return AttackResult.CRITICAL_SUCCESS;
  }

  /**
   * Obtiene una parte del cuerpo aleatoria para un duelista
   */
  private async getRandomBodyPart(duelistId: number) {
    const bodyParts = await BodyPart.findAll({ where: { duelistId } });
    if (bodyParts.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * bodyParts.length);
    return bodyParts[randomIndex];
  }
} 