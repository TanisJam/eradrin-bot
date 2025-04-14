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

      const character = await Character.create({
        userId,
        name,
        race,
        stats: {
          strength: 10,
          endurance: 10,
          recovery: 5,
        },
        status: {
          bleeding: 0,
          pain: 0,
          consciousness: 100,
          fatigue: 0,
        },
      });

      // Crear partes del cuerpo por defecto
      const bodyParts = [
        { name: 'Cabeza', health: 100, type: 'head' },
        { name: 'Torso', health: 100, type: 'torso' },
        { name: 'Brazo Izquierdo', health: 100, type: 'arm' },
        { name: 'Brazo Derecho', health: 100, type: 'arm' },
        { name: 'Pierna Izquierda', health: 100, type: 'leg' },
        { name: 'Pierna Derecha', health: 100, type: 'leg' },
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

      const roll = this.rollD20();
      const attackResult = this.getAttackResult(roll);
      this.logDebug(`Resultado de tirada (${roll}): ${attackResult}`);

      if (attackResult === AttackResult.CRITICAL_FAILURE) {
        return this.handleCriticalFailure(attacker);
      }

      if (attackResult === AttackResult.FAILURE) {
        return this.handleFailure(attacker, defender, targetBodyPart);
      }

      return this.handleSuccess(attacker, defender, targetBodyPart, attackResult);
    } catch (error) {
      return this.handleError(error, `Error al realizar ataque`);
    }
  }

  /**
   * Gestiona fallo crítico (daño a uno mismo)
   */
  private async handleCriticalFailure(attacker: Character) {
    const selfDamage = Math.floor(attacker.stats.strength * 0.5);
    const randomBodyPart = await this.getRandomBodyPart(attacker.id);
    
    if (randomBodyPart) {
      randomBodyPart.health -= selfDamage;
      await randomBodyPart.save();
    }

    const description = generateCombatDescription(AttackResult.CRITICAL_FAILURE, {
      attackerName: attacker.name,
      defenderName: attacker.name,
      bodyPart: randomBodyPart?.name || 'cuerpo',
      damage: selfDamage,
      finalHealth: randomBodyPart?.health || 0,
      bleeding: attacker.status.bleeding,
      consciousness: attacker.status.consciousness,
    });

    return { result: AttackResult.CRITICAL_FAILURE, damage: selfDamage, description };
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
    attackResult: AttackResult
  ) {
    const baseDamage = this.calculateDamage(
      attacker.stats.strength,
      defender.stats.endurance
    );
    
    const damage = attackResult === AttackResult.CRITICAL_SUCCESS
      ? baseDamage * 2
      : baseDamage;

    const bodyPart = await BodyPart.findOne({
      where: { characterId: defender.id, name: targetBodyPart },
    });

    if (!bodyPart) {
      throw new Error('Parte del cuerpo no encontrada');
    }

    bodyPart.health -= damage;
    await bodyPart.save();

    const newStatus = this.updateStatus(defender.status, damage);
    defender.status = newStatus;
    await defender.save();

    const description = generateCombatDescription(attackResult, {
      attackerName: attacker.name,
      defenderName: defender.name,
      bodyPart: targetBodyPart,
      damage,
      finalHealth: bodyPart.health,
      bleeding: newStatus.bleeding,
      consciousness: newStatus.consciousness,
    });

    return {
      result: attackResult,
      damage,
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

      const recoveryAmount = character.stats.recovery * 2;

      // Recuperar estado
      character.status = {
        bleeding: Math.max(0, character.status.bleeding - recoveryAmount),
        pain: Math.max(0, character.status.pain - recoveryAmount),
        consciousness: Math.min(
          100,
          character.status.consciousness + recoveryAmount
        ),
        fatigue: Math.max(0, character.status.fatigue - recoveryAmount),
      };

      await character.save();

      // Recuperar partes del cuerpo
      const bodyParts = await BodyPart.findAll({ where: { characterId } });
      await Promise.all(
        bodyParts.map((part) => {
          part.health = Math.min(100, part.health + recoveryAmount);
          return part.save();
        })
      );

      this.logInfo(`Personaje ${character.name} recuperado: +${recoveryAmount} puntos`);
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
    defenderEndurance: number
  ): number {
    const baseDamage = attackerStrength;
    const resistance = defenderEndurance * 0.5;
    return Math.max(1, Math.floor(baseDamage - resistance));
  }

  private updateStatus(currentStatus: any, damage: number) {
    return {
      bleeding: Math.min(100, currentStatus.bleeding + damage * 0.2),
      pain: Math.min(100, currentStatus.pain + damage * 0.3),
      consciousness: Math.max(0, currentStatus.consciousness - damage * 0.1),
      fatigue: Math.min(100, currentStatus.fatigue + damage * 0.15),
    };
  }

  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  private getAttackResult(roll: number): AttackResult {
    if (roll === 20) return AttackResult.CRITICAL_SUCCESS;
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
