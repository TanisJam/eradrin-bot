export enum AttackResult {
  CRITICAL_FAILURE = 'CRITICAL_FAILURE',
  FAILURE = 'FAILURE',
  SUCCESS = 'SUCCESS',
  CRITICAL_SUCCESS = 'CRITICAL_SUCCESS'
}

export const BODY_PARTS = [
  'Cabeza',
  'Torso',
  'Brazo Izquierdo',
  'Brazo Derecho',
  'Pierna Izquierda',
  'Pierna Derecha'
] as const;