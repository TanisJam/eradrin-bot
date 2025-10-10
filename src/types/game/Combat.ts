/**
 * Enumeration of possible attack results
 */
export enum AttackResult {
  CRITICAL_FAILURE = 'CRITICAL_FAILURE',
  FAILURE = 'FAILURE',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  SUCCESS = 'SUCCESS',
  CRITICAL_SUCCESS = 'CRITICAL_SUCCESS'
}

/**
 * List of body parts available for attacks
 */
export const BODY_PARTS = [
  'Cabeza',
  'Torso',
  'Brazo Izquierdo',
  'Brazo Derecho',
  'Pierna Izquierda',
  'Pierna Derecha'
] as const;

/**
 * Type for body parts
 */
export type BodyPartType = typeof BODY_PARTS[number];