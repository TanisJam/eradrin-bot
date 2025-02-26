import Character from '../database/models/Character';
import BodyPart from '../database/models/BodyPart';
import { AttackResult } from '../types/Combat.type';
import { generateCombatDescription } from '../constants/CombatDescriptions';

class CharacterService {
  private readonly dndRaces = [
    'Humano',
    'Elfo',
    'Enano',
    'Mediano',
    'Dracónido',
    'Gnomo',
    'Semielfo',
    'Semiorco',
    'Tiefling'
  ];

  async createCharacter(userId: string, name: string, race: string) {
    const character = await Character.create({
      userId,
      name,
      race,
    });

    // Crear partes del cuerpo por defecto
    const bodyParts = [
      { name: 'Cabeza', health: 100 },
      { name: 'Torso', health: 100 },
      { name: 'Brazo Izquierdo', health: 100 },
      { name: 'Brazo Derecho', health: 100 },
      { name: 'Pierna Izquierda', health: 100 },
      { name: 'Pierna Derecha', health: 100 },
    ];

    await Promise.all(
      bodyParts.map((part) =>
        BodyPart.create({
          characterId: character.id,
          ...part,
        })
      )
    );

    return character;
  }

  async attack(attackerId: number, defenderId: number, targetBodyPart: string) {
    const attacker = await Character.findByPk(attackerId);
    const defender = await Character.findByPk(defenderId);

    if (!attacker || !defender) {
      throw new Error('Personaje no encontrado');
    }

    const roll = this.rollD20();
    const attackResult = this.getAttackResult(roll);

    if (attackResult === AttackResult.CRITICAL_FAILURE) {
      const selfDamage = Math.floor(attacker.stats.strength * 0.5);
      const randomBodyPart = await this.getRandomBodyPart(attackerId);
      if (randomBodyPart) {
        randomBodyPart.health -= selfDamage;
        await randomBodyPart.save();
      }

      const description = generateCombatDescription(attackResult, {
        attackerName: attacker.name,
        defenderName: attacker.name,
        bodyPart: randomBodyPart?.name || 'cuerpo',
        damage: selfDamage,
        finalHealth: randomBodyPart?.health || 0,
        bleeding: attacker.status.bleeding,
        consciousness: attacker.status.consciousness,
      });

      return { result: attackResult, damage: selfDamage, description };
    }

    if (attackResult === AttackResult.FAILURE) {
      const description = generateCombatDescription(attackResult, {
        attackerName: attacker.name,
        defenderName: defender.name,
        bodyPart: targetBodyPart,
        damage: 0,
        finalHealth: 100,
        bleeding: defender.status.bleeding,
        consciousness: defender.status.consciousness,
      });

      return { result: attackResult, damage: 0, description };
    }

    const baseDamage = this.calculateDamage(
      attacker.stats.strength,
      defender.stats.endurance
    );
    const damage =
      attackResult === AttackResult.CRITICAL_SUCCESS
        ? baseDamage * 2
        : baseDamage;

    const bodyPart = await BodyPart.findOne({
      where: { characterId: defenderId, name: targetBodyPart },
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

  async recover(characterId: number) {
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

    return character;
  }

  async generateRandomCharacter(userId: string, username: string) {
    const randomRace = this.getRandomDndRace();
    return this.createCharacter(userId, username, randomRace);
  }

  private getRandomDndRace(): string {
    const randomIndex = Math.floor(Math.random() * this.dndRaces.length);
    return this.dndRaces[randomIndex];
  }

  private calculateDamage(
    attackerStrength: number,
    defenderEndurance: number
  ): number {
    const baseDamage = attackerStrength * 2;
    const defense = defenderEndurance;
    return Math.max(1, baseDamage - defense);
  }

  private updateStatus(currentStatus: any, damage: number) {
    return {
      bleeding: Math.min(100, currentStatus.bleeding + damage * 0.5),
      pain: Math.min(100, currentStatus.pain + damage * 0.3),
      consciousness: Math.max(0, currentStatus.consciousness - damage * 0.2),
      fatigue: Math.min(100, currentStatus.fatigue + damage * 0.1),
    };
  }

  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  private getAttackResult(roll: number): AttackResult {
    if (roll === 1) return AttackResult.CRITICAL_FAILURE;
    if (roll <= 5) return AttackResult.FAILURE;
    if (roll === 20) return AttackResult.CRITICAL_SUCCESS;
    return AttackResult.SUCCESS;
  }

  private async getRandomBodyPart(characterId: number) {
    const bodyParts = await BodyPart.findAll({ where: { characterId } });
    return bodyParts[Math.floor(Math.random() * bodyParts.length)];
  }
}

export default new CharacterService();
