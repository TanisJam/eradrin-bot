import { AttackResult } from '../types/Combat.type';
import {
  ATTACK_VERBS,
  ADVERBS,
  EFFECTS,
  REACTIONS,
  BODY_PART_DETAILS,
  BLEEDING_DESCRIPTIONS,
  CONSCIOUSNESS_DESCRIPTIONS,
} from './CombatPhrases';

type HealthState = 'HEALTHY' | 'INJURED' | 'SEVERELY_INJURED' | 'CRITICAL';
type DamageLevel = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'DEVASTATING';
type BodyPart =
  | 'Cabeza'
  | 'Torso'
  | 'Brazo Izquierdo'
  | 'Brazo Derecho'
  | 'Pierna Izquierda'
  | 'Pierna Derecha';

interface AttackContext {
  attackerName: string;
  defenderName: string;
  bodyPart: string;
  damage: number;
  finalHealth: number;
  bleeding: number;
  consciousness: number;
}

const getHealthState = (health: number): HealthState => {
  if (health > 75) return 'HEALTHY';
  if (health > 50) return 'INJURED';
  if (health > 25) return 'SEVERELY_INJURED';
  return 'CRITICAL';
};

const getDamageLevel = (damage: number): DamageLevel => {
  if (damage < 10) return 'LIGHT';
  if (damage < 20) return 'MODERATE';
  if (damage < 30) return 'HEAVY';
  return 'DEVASTATING';
};

export function generateCombatDescription(
  result: AttackResult,
  context: AttackContext
): string {
  if (result === AttackResult.CRITICAL_FAILURE) {
    return `${context.attackerName} ${selectRandom([
      'pierde el equilibrio y',
      'tropieza torpemente y',
      'en un giro desafortunado',
      'en un momento de torpeza',
    ])} ${selectRandom(ATTACK_VERBS.MODERATE)} su propio ${selectRandom(
      BODY_PART_DETAILS[context.bodyPart as keyof typeof BODY_PART_DETAILS]
    )}`;
  }

  if (result === AttackResult.FAILURE) {
    return `${context.attackerName} ${selectRandom([
      'falla su ataque cuando',
      'no logra acertar mientras',
      'pierde la oportunidad al',
    ])} ${selectRandom([
      `${context.defenderName} esquiva ágilmente`,
      `${context.defenderName} se aparta a tiempo`,
      'el golpe pasa de largo',
      'el ataque no encuentra su objetivo',
    ])}`;
  }

  const damageLevel = getDamageLevel(context.damage);
  const bodyPartDetail = selectRandom(
    BODY_PART_DETAILS[context.bodyPart as keyof typeof BODY_PART_DETAILS]
  );

  let description = `${context.attackerName} ${selectRandom(
    ATTACK_VERBS[damageLevel]
  )} ${selectRandom(ADVERBS[damageLevel])} el ${bodyPartDetail} de ${
    context.defenderName
  }`;

  if (result === AttackResult.CRITICAL_SUCCESS) {
    description += `, ${selectRandom([
      'encontrando un punto vital',
      'con perfecta precisión',
      'en un golpe magistral',
      'con devastadora exactitud',
    ])}`;
  }

  description += `. ${context.defenderName} ${selectRandom(
    REACTIONS[damageLevel]
  )}`;

  if (context.bleeding > 50) {
    const bleedIndex = Math.min(Math.floor(context.bleeding / 34), 2);
    description += ` mientras ${selectRandom(
      BLEEDING_DESCRIPTIONS[bleedIndex]
    )} de la herida`;
  }

  if (context.consciousness < 30) {
    const consIndex = Math.min(
      Math.floor((30 - context.consciousness) / 10),
      2
    );
    description += ` y ${selectRandom(CONSCIOUSNESS_DESCRIPTIONS[consIndex])}`;
  }

  return description;
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
