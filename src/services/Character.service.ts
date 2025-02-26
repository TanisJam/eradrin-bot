import Character from '../database/models/Character';
import BodyPart from '../database/models/BodyPart';

class CharacterService {
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
      bodyParts.map(part => 
        BodyPart.create({
          characterId: character.id,
          ...part
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

    const damage = this.calculateDamage(attacker.stats.strength, defender.stats.endurance);
    const bodyPart = await BodyPart.findOne({
      where: { characterId: defenderId, name: targetBodyPart }
    });

    if (!bodyPart) {
      throw new Error('Parte del cuerpo no encontrada');
    }

    // Aplicar daño
    bodyPart.health -= damage;
    await bodyPart.save();

    // Actualizar estado del defensor
    const newStatus = this.updateStatus(defender.status, damage);
    defender.status = newStatus;
    await defender.save();

    return { damage, newHealth: bodyPart.health };
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
      consciousness: Math.min(100, character.status.consciousness + recoveryAmount),
      fatigue: Math.max(0, character.status.fatigue - recoveryAmount),
    };

    await character.save();

    // Recuperar partes del cuerpo
    const bodyParts = await BodyPart.findAll({ where: { characterId } });
    await Promise.all(
      bodyParts.map(part => {
        part.health = Math.min(100, part.health + recoveryAmount);
        return part.save();
      })
    );

    return character;
  }

  private calculateDamage(attackerStrength: number, defenderEndurance: number): number {
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
}

export default new CharacterService();
