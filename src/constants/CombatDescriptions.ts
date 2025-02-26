import { AttackResult } from '../types/Combat.type';

type HealthState = 'HEALTHY' | 'INJURED' | 'SEVERELY_INJURED' | 'CRITICAL';
type DamageLevel = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'DEVASTATING';

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

const CRITICAL_FAILURE_DESCRIPTIONS = [
  '{attackerName} pierde el equilibrio y se golpea a sí mismo en {bodyPart}',
  '{attackerName} tropieza torpemente y se lastima {bodyPart}',
  'En un giro desafortunado, {attackerName} se autolesiona {bodyPart}',
];

const FAILURE_DESCRIPTIONS = [
  '{attackerName} falla completamente al intentar golpear a {defenderName}',
  'El ataque de {attackerName} no encuentra su objetivo',
  '{defenderName} esquiva ágilmente el torpe ataque',
];

const SUCCESS_DESCRIPTIONS: Record<string, Record<DamageLevel, string[]>> = {
  Cabeza: {
    LIGHT: [
      '{attackerName} rasguña la cabeza de {defenderName}, causando un corte superficial',
      'Un golpe rápido roza la sien de {defenderName}',
    ],
    MODERATE: [
      '{attackerName} golpea la cabeza de {defenderName}, causando desorientación',
      'Un impacto directo en el rostro hace tambalearse a {defenderName}',
    ],
    HEAVY: [
      '¡Un golpe brutal en el cráneo hace que {defenderName} vea estrellas!',
      '{attackerName} impacta violentamente la cabeza, causando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en la cabeza hace que {defenderName} casi pierda el conocimiento!',
      'Un impacto demoledor en el cráneo deja a {defenderName} al borde del colapso',
    ],
  },
  Torso: {
    LIGHT: [
      '{attackerName} rasguña el torso de {defenderName}',
      'Un golpe superficial impacta el pecho',
    ],
    MODERATE: [
      '{attackerName} golpea el torso de {defenderName}, causando un moretón',
      'Un impacto directo en el estómago hace que {defenderName} se doble de dolor',
    ],
    HEAVY: [
      '¡Un golpe brutal en el pecho hace que {defenderName} se quede sin aliento!',
      '{attackerName} impacta violentamente el torso, caus ando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en el torso hace que {defenderName} se tambalee!',
      'Un impacto demoledor en el pecho deja a {defenderName} al borde del colapso',
    ],
  },
  'Brazo Izquierdo': {
    LIGHT: [
      '{attackerName} rasguña el brazo izquierdo de {defenderName}',
      'Un golpe superficial impacta el brazo izquierdo',
    ],
    MODERATE: [
      '{attackerName} golpea el brazo izquierdo de {defenderName}, causando un moretón',
      'Un impacto directo en el codo hace que {defenderName} suelte un quejido',
    ],
    HEAVY: [
      '¡Un golpe brutal en el brazo izquierdo hace que {defenderName} suelte su arma!',
      '{attackerName} impacta violentamente el brazo izquierdo, causando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en el brazo izquierdo hace que {defenderName} grite de dolor!',
      'Un impacto demoledor en el brazo izquierdo deja a {defenderName} al borde del colapso',
    ],
  },
  'Brazo Derecho': {
    LIGHT: [
      '{attackerName} rasguña el brazo derecho de {defenderName}',
      'Un golpe superficial impacta el brazo derecho',
    ],
    MODERATE: [
      '{attackerName} golpea el brazo derecho de {defenderName}, causando un moretón',
      'Un impacto directo en el codo hace que {defenderName} suelte un quejido',
    ],
    HEAVY: [
      '¡Un golpe brutal en el brazo derecho hace que {defenderName} suelte su arma!',
      '{attackerName} impacta violentamente el brazo derecho, causando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en el brazo derecho hace que {defenderName} grite de dolor!',
      'Un impacto demoledor en el brazo derecho deja a {defenderName} al borde del colapso',
    ],
  },
  'Pierna Izquierda': {
    LIGHT: [
      '{attackerName} rasguña la pierna izquierda de {defenderName}',
      'Un golpe superficial impacta la pierna izquierda',
    ],
    MODERATE: [
      '{attackerName} golpea la pierna izquierda de {defenderName}, causando un moretón',
      'Un impacto directo en la rodilla hace que {defenderName} cojee',
    ],
    HEAVY: [
      '¡Un golpe brutal en la pierna izquierda hace que {defenderName} pierda el equilibrio!',
      '{attackerName} impacta violentamente la pierna izquierda, causando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en la pierna izquierda hace que {defenderName} se desplome!',
      'Un impacto demoledor en la pierna izquierda deja a {defenderName} al borde del colapso',
    ],
  },
  'Pierna Derecha': {
    LIGHT: [
      '{attackerName} rasguña la pierna derecha de {defenderName}',
      'Un golpe superficial impacta la pierna derecha',
    ],
    MODERATE: [
      '{attackerName} golpea la pierna derecha de {defenderName}, causando un moretón',
      'Un impacto directo en la rodilla hace que {defenderName} cojee',
    ],
    HEAVY: [
      '¡Un golpe brutal en la pierna derecha hace que {defenderName} pierda el equilibrio!',
      '{attackerName} impacta violentamente la pierna derecha, causando una herida profunda',
    ],
    DEVASTATING: [
      '¡El devastador golpe en la pierna derecha hace que {defenderName} se desplome!',
      'Un impacto demoledor en la pierna derecha deja a {defenderName} al borde del colapso',
    ],
  },
};

const CRITICAL_SUCCESS_DESCRIPTIONS: Record<
  string,
  Record<DamageLevel, string[]>
> = {
  Cabeza: {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital de la cabeza!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en la mandíbula de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en la cabeza hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en la cabeza hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
  Torso: {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital del torso!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en el estómago de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en el torso hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en el torso hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
  'Brazo Izquierdo': {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital del brazo izquierdo!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en el codo de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en el brazo izquierdo hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en el brazo izquierdo hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
  'Brazo Derecho': {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital del brazo derecho!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en el codo de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en el brazo derecho hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en el brazo derecho hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
  'Pierna Izquierda': {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital de la pierna izquierda!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en la rodilla de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en la pierna izquierda hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en la pierna izquierda hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
  'Pierna Derecha': {
    LIGHT: [
      '¡Un golpe preciso impacta en un punto vital de la pierna derecha!',
      '¡El rápido ataque deja a {defenderName} aturdido!',
    ],
    MODERATE: [
      '¡Un golpe certero impacta en la rodilla de {defenderName}!',
      '¡El impacto directo hace que {defenderName} vea estrellas!',
    ],
    HEAVY: [
      '¡Un golpe devastador en la pierna derecha hace que {defenderName} pierda el equilibrio!',
      '¡El brutal ataque deja a {defenderName} al borde del colapso!',
    ],
    DEVASTATING: [
      '¡El golpe letal en la pierna derecha hace que {defenderName} caiga inconsciente!',
      '¡El demoledor ataque deja a {defenderName} al borde de la muerte!',
    ],
  },
};

const STATUS_EFFECT_DESCRIPTIONS = {
  bleeding: [
    'La herida comienza a sangrar profusamente',
    'Un río de sangre brota de la herida',
    'La hemorragia se intensifica',
  ],
  consciousness: [
    'La vista de {defenderName} se nubla',
    '{defenderName} lucha por mantener la consciencia',
    'El mundo comienza a desvanecerse para {defenderName}',
  ],
};

export function generateCombatDescription(
  result: AttackResult,
  context: AttackContext
): string {
  let description = '';

  // Selección de la descripción base según el resultado
  switch (result) {
    case AttackResult.CRITICAL_FAILURE:
      description = selectRandom(CRITICAL_FAILURE_DESCRIPTIONS);
      break;
    case AttackResult.FAILURE:
      description = selectRandom(FAILURE_DESCRIPTIONS);
      break;
    case AttackResult.SUCCESS:
      description = selectRandom(
        SUCCESS_DESCRIPTIONS[context.bodyPart][getDamageLevel(context.damage)]
      );
      break;
    case AttackResult.CRITICAL_SUCCESS:
      description = selectRandom(
        CRITICAL_SUCCESS_DESCRIPTIONS[context.bodyPart][
          getDamageLevel(context.damage)
        ]
      );
      break;
  }

  // Agregar efectos de estado si aplican
  if (context.bleeding > 50) {
    description += `. ${selectRandom(STATUS_EFFECT_DESCRIPTIONS.bleeding)}`;
  }
  if (context.consciousness < 30) {
    description += `. ${selectRandom(
      STATUS_EFFECT_DESCRIPTIONS.consciousness
    )}`;
  }

  // Reemplazar variables en la descripción
  return description.replace(/{(\w+)}/g, (_, key) =>
    String(context[key as keyof AttackContext])
  );
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
