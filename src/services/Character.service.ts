import Character from '../database/models/Character';
import BodyPart from '../database/models/BodyPart';
import { AttackResult } from '../types/Combat.type';
import { generateCombatDescription } from '../constants/CombatDescriptions';
import User from '../database/models/User';
import { BaseService } from './BaseService';

/**
 * Servicio para gestionar personajes y sus acciones
 */
export class CharacterService extends BaseService {
  private readonly dndRaces = [
    'Humano',
    'Elfo',
    'Enano',
    'Mediano',
    'Dracónido',
    'Gnomo',
    'Semielfo',
    'Semiorco',
    'Tiefling',
  ];

  // Modificadores de estadísticas para cada raza
  private readonly raceStats = {
    'Humano': {
      strength: 10,
      agility: 10,
      endurance: 10,
      recovery: 10
    },
    'Elfo': {
      strength: 8,
      agility: 14, 
      endurance: 8,
      recovery: 10
    },
    'Enano': {
      strength: 12,
      agility: 7,
      endurance: 14,
      recovery: 12
    },
    'Mediano': {
      strength: 7,
      agility: 12,
      endurance: 9,
      recovery: 11
    },
    'Dracónido': {
      strength: 13,
      agility: 8,
      endurance: 12,
      recovery: 7
    },
    'Gnomo': {
      strength: 6,
      agility: 13,
      endurance: 8,
      recovery: 8
    },
    'Semielfo': {
      strength: 9,
      agility: 12,
      endurance: 9,
      recovery: 10
    },
    'Semiorco': {
      strength: 14,
      agility: 8,
      endurance: 11,
      recovery: 8
    },
    'Tiefling': {
      strength: 10,
      agility: 11,
      endurance: 9,
      recovery: 13
    }
  };

  constructor() {
    super('CharacterService');
  }

  /**
   * Crea un nuevo personaje o devuelve uno existente
   */
  async createCharacter(userId: string, name: string, race: string) {
    try {
      this.logDebug(`Creando personaje para usuario ${userId}: ${name} (${race})`);
      
      const existingCharacter = await Character.findOne({ where: { userId } });
      if (existingCharacter) {
        this.logInfo(`Personaje existente encontrado para usuario ${userId}`);
        return existingCharacter;
      }

      // Obtener estadísticas basadas en la raza o usar valores predeterminados si la raza no está definida
      const stats = this.raceStats[race as keyof typeof this.raceStats] || this.raceStats['Humano'];
      this.logDebug(`Aplicando estadísticas de raza ${race}: ${JSON.stringify(stats)}`);

      const character = await Character.create({
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
      });

      // Crear partes del cuerpo por defecto con valores de salud realistas
      const bodyParts = [
        { name: 'Cabeza', health: 60, type: 'head' },      // La cabeza es vital pero más frágil
        { name: 'Torso', health: 120, type: 'torso' },     // El torso es la parte más grande y resistente
        { name: 'Brazo Izquierdo', health: 50, type: 'arm' },  // Los brazos son más débiles que el torso
        { name: 'Brazo Derecho', health: 50, type: 'arm' },
        { name: 'Pierna Izquierda', health: 70, type: 'leg' }, // Las piernas son más fuertes que los brazos
        { name: 'Pierna Derecha', health: 70, type: 'leg' },
      ];

      await Promise.all(
        bodyParts.map((part) =>
          BodyPart.create({
            characterId: character.id,
            ...part,
          })
        )
      );

      this.logInfo(`Personaje creado exitosamente: ${name} (ID: ${character.id})`);
      return character;
    } catch (error) {
      return this.handleError(error, `Error al crear personaje ${name}`);
    }
  }

  /**
   * Realiza un ataque de un personaje a otro
   */
  async attack(attackerId: number, defenderId: number, targetBodyPart: string) {
    try {
      this.logDebug(`Ataque: ${attackerId} -> ${defenderId} (${targetBodyPart})`);
      
      const attacker = await Character.findByPk(attackerId);
      const defender = await Character.findByPk(defenderId);

      if (!attacker || !defender) {
        throw new Error('Personaje no encontrado');
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
  private async handleCriticalFailure(attacker: Character) {
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
        consciousness: attacker.status.consciousness,
      });

      // Actualizar el status del personaje en consecuencia
      const previousStatus = JSON.stringify(attacker.status);
      attacker.status = this.updateStatus(attacker.status, adjustedDamage);
      await attacker.save();
      
      this.logDebug(`Estado actualizado tras fallo crítico:`);
      this.logDebug(`Antes: ${previousStatus}`);
      this.logDebug(`Después: ${JSON.stringify(attacker.status)}`);

      return { 
        result: AttackResult.CRITICAL_FAILURE, 
        damage: adjustedDamage, 
        description 
      };
    } else {
      // En caso de que no se pueda encontrar una parte del cuerpo (caso extremadamente raro)
      const description = generateCombatDescription(AttackResult.CRITICAL_FAILURE, {
        attackerName: attacker.name,
        defenderName: attacker.name,
        bodyPart: 'cuerpo',
        damage: selfDamage,
        finalHealth: 0,
        bleeding: attacker.status.bleeding,
        consciousness: attacker.status.consciousness,
      });

      return { 
        result: AttackResult.CRITICAL_FAILURE, 
        damage: selfDamage, 
        description 
      };
    }
  }

  /**
   * Gestiona un fallo de ataque
   */
  private handleFailure(attacker: Character, defender: Character, targetBodyPart: string) {
    const description = generateCombatDescription(AttackResult.FAILURE, {
      attackerName: attacker.name,
      defenderName: defender.name,
      bodyPart: targetBodyPart,
      damage: 0,
      finalHealth: 100,
      bleeding: defender.status.bleeding,
      consciousness: defender.status.consciousness,
    });

    return { result: AttackResult.FAILURE, damage: 0, description };
  }

  /**
   * Gestiona un ataque exitoso
   */
  private async handleSuccess(
    attacker: Character, 
    defender: Character, 
    targetBodyPart: string, 
    attackResult: AttackResult,
    attackModifier: number = 1.0,
    defenseModifier: number = 1.0,
    isDefending: boolean = false
  ) {
    this.logDebug(`Procesando ataque exitoso: ${attacker.name} -> ${defender.name} (${targetBodyPart})`);
    this.logDebug(`Tipo de ataque: ${attackResult}`);
    
    // Log del estado inicial
    this.logDebug('ESTADO INICIAL:');
    this.logDebug(`Atacante (${attacker.name}) - Fuerza: ${attacker.stats.strength}`);
    this.logDebug(`Defensor (${defender.name}) - Resistencia: ${defender.stats.endurance}, Agilidad: ${defender.stats.agility}, Status: ${JSON.stringify(defender.status)}`);
    
    // Calcular daño con modificadores
    const baseDamage = this.calculateDamage(
      attacker.stats.strength * attackModifier, // Fuerza modificada por el estado
      defender.stats.endurance * defenseModifier, // Resistencia modificada por defensa
      defender.stats.agility // Agilidad del defensor
    );
    
    const damage = attackResult === AttackResult.CRITICAL_SUCCESS
      ? baseDamage * 2
      : baseDamage;
      
    this.logDebug(`Daño calculado: ${damage} (Base: ${baseDamage}${attackResult === AttackResult.CRITICAL_SUCCESS ? ', CRÍTICO x2' : ''})`);
    this.logDebug(`Modificadores: Ataque ${attackModifier}, Defensa ${defenseModifier}`);

    const bodyPart = await BodyPart.findOne({
      where: { characterId: defender.id, name: targetBodyPart },
    });

    if (!bodyPart) {
      this.logError(`Parte del cuerpo no encontrada: ${targetBodyPart} para personaje ${defender.id}`);
      throw new Error('Parte del cuerpo no encontrada');
    }
    
    this.logDebug(`Parte del cuerpo objetivo: ${bodyPart.name} (Salud inicial: ${bodyPart.health})`);

    // Aplicar daño a la parte del cuerpo con modificadores según el tipo
    const previousHealth = bodyPart.health;
    let adjustedDamage = damage;
    
    // Multiplicador de daño según el tipo de parte del cuerpo
    switch (bodyPart.type) {
      case 'head':
        adjustedDamage = Math.floor(damage * 1.5); // La cabeza recibe 50% más daño
        break;
      case 'torso':
        adjustedDamage = Math.floor(damage * 1.2); // El torso recibe 20% más daño
        break;
      case 'arm':
        adjustedDamage = Math.floor(damage * 0.9); // Los brazos reciben 10% menos daño
        break;
      case 'leg':
        adjustedDamage = Math.floor(damage * 1.0); // Las piernas reciben daño normal
        break;
    }
    
    this.logDebug(`Daño ajustado para ${bodyPart.type}: ${damage} → ${adjustedDamage}`);
    bodyPart.health -= adjustedDamage;
    await bodyPart.save();
    this.logDebug(`Salud de ${bodyPart.name} cambiada: ${previousHealth} → ${bodyPart.health} (-${adjustedDamage})`);

    // Actualizar estado del defensor
    const previousStatus = JSON.stringify(defender.status);
    const newStatus = this.updateStatus(defender.status, adjustedDamage);
    defender.status = newStatus;
    await defender.save();
    
    this.logDebug(`Estado actualizado:`);
    this.logDebug(`Antes: ${previousStatus}`);
    this.logDebug(`Después: ${JSON.stringify(newStatus)}`);

    // Generar la descripción del ataque
    let description = generateCombatDescription(attackResult, {
      attackerName: attacker.name,
      defenderName: defender.name,
      bodyPart: targetBodyPart,
      damage: adjustedDamage,
      finalHealth: bodyPart.health,
      bleeding: newStatus.bleeding,
      consciousness: newStatus.consciousness,
    });

    // Si el defensor estaba defendiendo, añadir una frase adicional sobre la reducción del daño
    if (isDefending) {
      const damageReduction = Math.round((1 - defenseModifier) * 100);
      description += ` ${defender.name} logra reducir el impacto en un ${damageReduction}% gracias a su postura defensiva.`;
    }

    return {
      result: attackResult,
      damage: adjustedDamage,
      newHealth: bodyPart.health,
      description,
    };
  }

  /**
   * Permite a un personaje recuperarse de sus heridas
   */
  async recover(characterId: number) {
    try {
      this.logDebug(`Recuperación para personaje ID: ${characterId}`);
      
      const character = await Character.findByPk(characterId);
      if (!character) {
        throw new Error('Personaje no encontrado');
      }

      this.logDebug(`Estado antes de recuperación:`);
      this.logDebug(`Personaje: ${character.name}`);
      this.logDebug(`Status: ${JSON.stringify(character.status)}`);
      
      // Obtener partes del cuerpo para logueo
      const bodyPartsBefore = await BodyPart.findAll({ where: { characterId } });
      this.logDebug('Partes del cuerpo antes de recuperación:');
      bodyPartsBefore.forEach(part => {
        this.logDebug(`  ${part.name}: ${part.health}/100`);
      });

      // Verificar si hay un modificador temporal de recuperación
      let recoveryModifier = 1.0;
      const recoveryModCondition = character.conditions.find(c => c.startsWith('recovery_mod_'));
      if (recoveryModCondition) {
        recoveryModifier = parseFloat(recoveryModCondition.split('_')[2]);
        this.logDebug(`Aplicando modificador de recuperación: ${recoveryModifier}`);
      }

      // Ajustamos la cantidad de recuperación según la estadística y los modificadores
      const recoveryAmount = Math.floor(character.stats.recovery * 3 * recoveryModifier);
      this.logDebug(`Cantidad de recuperación base: ${character.stats.recovery * 3}, con modificador: ${recoveryAmount}`);

      // Guardar estado anterior para comparar
      const oldStatus = { ...character.status };

      // Recuperar estado
      character.status = {
        bleeding: Math.round((Math.max(0, character.status.bleeding - recoveryAmount)) * 10) / 10,
        pain: Math.round((Math.max(0, character.status.pain - recoveryAmount)) * 10) / 10,
        consciousness: Math.round((Math.min(100, character.status.consciousness + recoveryAmount)) * 10) / 10,
        fatigue: Math.round((Math.max(0, character.status.fatigue - recoveryAmount)) * 10) / 10,
      };

      await character.save();

      // Recuperar partes del cuerpo con recuperación ajustada por tipo
      const bodyParts = await BodyPart.findAll({ where: { characterId } });
      const partsUpdates: string[] = [];
      
      await Promise.all(
        bodyParts.map(async (part) => {
          const oldHealth = part.health;
          // Ajustar recuperación por tipo de parte del cuerpo
          let adjustedRecovery = recoveryAmount;
          
          // Las partes del cuerpo más grandes y resistentes se recuperan más rápido
          switch (part.type) {
            case 'torso':
              adjustedRecovery = Math.floor(recoveryAmount * 1.2);
              break;
            case 'head':
              adjustedRecovery = Math.floor(recoveryAmount * 0.8);
              break;
            case 'leg':
              adjustedRecovery = Math.floor(recoveryAmount * 1.0);
              break;
            case 'arm':
              adjustedRecovery = Math.floor(recoveryAmount * 0.9);
              break;
          }
          
          // Determinar el máximo de salud para cada parte según su tipo
          let maxHealth;
          switch (part.type) {
            case 'head':
              maxHealth = 60;
              break;
            case 'torso':
              maxHealth = 120;
              break;
            case 'arm':
              maxHealth = 50;
              break;
            case 'leg':
              maxHealth = 70;
              break;
            default:
              maxHealth = 100;
          }
          
          // Aplicar recuperación, limitando al máximo para ese tipo
          part.health = Math.min(maxHealth, part.health + adjustedRecovery);
          await part.save();
          partsUpdates.push(`${part.name}: ${oldHealth} → ${part.health} (+${part.health - oldHealth})`);
        })
      );

      // Log de cambios realizados
      this.logInfo(`Personaje ${character.name} recuperado: +${recoveryAmount} puntos de recuperación (modificador: ${recoveryModifier})`);
      this.logDebug('Cambios en status:');
      this.logDebug(`  Sangrado: ${oldStatus.bleeding} -> ${character.status.bleeding}`);
      this.logDebug(`  Dolor: ${oldStatus.pain} -> ${character.status.pain}`);
      this.logDebug(`  Consciencia: ${oldStatus.consciousness} -> ${character.status.consciousness}`);
      this.logDebug(`  Fatiga: ${oldStatus.fatigue} -> ${character.status.fatigue}`);
      
      this.logDebug('Cambios en partes del cuerpo:');
      partsUpdates.forEach(update => this.logDebug(`  ${update}`));

      return character;
    } catch (error) {
      return this.handleError(error, `Error al recuperar personaje ID: ${characterId}`);
    }
  }

  /**
   * Genera un personaje aleatorio para un usuario
   */
  async generateRandomCharacter(userId: string, username: string) {
    try {
      this.logDebug(`Generando personaje aleatorio para usuario: ${userId}`);
      
      const existingCharacter = await Character.findOne({ where: { userId } });
      if (existingCharacter) {
        return existingCharacter;
      }

      const [user] = await User.upsert(
        {
          id: userId,
          nickName: username,
          lastPing: new Date(),
        },
        {
          fields: ['nickName', 'lastPing'],
        }
      );

      const randomRace = this.getRandomDndRace();
      const randomName = `${username} el ${randomRace}`;

      return this.createCharacter(userId, randomName, randomRace);
    } catch (error) {
      return this.handleError(error, `Error al generar personaje aleatorio para ${username}`);
    }
  }

  // Métodos auxiliares privados

  private getRandomDndRace(): string {
    const randomIndex = Math.floor(Math.random() * this.dndRaces.length);
    return this.dndRaces[randomIndex];
  }

  private calculateDamage(
    attackerStrength: number,
    defenderEndurance: number,
    defenderAgility: number = 10 // Valor predeterminado si no se proporciona
  ): number {
    // Aumentamos el daño base y reducimos la mitigación para hacer combates más rápidos
    const baseDamage = attackerStrength * 1.5; // Multiplicador aumentado
    
    // La resistencia proporciona mitigación base
    const enduranceResistance = defenderEndurance * 0.3;
    
    // La agilidad proporciona evitación parcial de daño
    // Cada punto de agilidad por encima de 10 reduce el daño en un 1% adicional
    const agilityBonus = Math.max(0, (defenderAgility - 10) * 0.01);
    const agilityResistance = baseDamage * agilityBonus;
    
    // El total de la resistencia es la suma de ambos factores
    const totalResistance = enduranceResistance + agilityResistance;
    
    return Math.max(2, Math.floor(baseDamage - totalResistance)); // Mínimo 2 de daño
  }

  private updateStatus(currentStatus: any, damage: number) {
    return {
      bleeding: Math.round((Math.min(100, currentStatus.bleeding + damage * 0.2)) * 10) / 10,
      pain: Math.round((Math.min(100, currentStatus.pain + damage * 0.3)) * 10) / 10,
      consciousness: Math.round((Math.max(0, currentStatus.consciousness - damage * 0.1)) * 10) / 10,
      fatigue: Math.round((Math.min(100, currentStatus.fatigue + damage * 0.15)) * 10) / 10,
    };
  }

  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  private getAttackResult(roll: number): AttackResult {
    if (roll >= 20) return AttackResult.CRITICAL_SUCCESS;
    if (roll >= 15) return AttackResult.SUCCESS;
    if (roll >= 6) return AttackResult.PARTIAL_SUCCESS;
    if (roll >= 2) return AttackResult.FAILURE;
    return AttackResult.CRITICAL_FAILURE;
  }

  private async getRandomBodyPart(characterId: number) {
    const bodyParts = await BodyPart.findAll({ where: { characterId } });
    const randomIndex = Math.floor(Math.random() * bodyParts.length);
    return bodyParts[randomIndex];
  }
}
