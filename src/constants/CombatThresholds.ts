/**
 * Combat thresholds for different conditions and effects
 * Used to determine critical points for combat calculations
 */

export const THRESHOLDS = {
  BLEEDING: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  PAIN: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  CONSCIOUSNESS: {
    CRITICAL: 10,
    LOW: 30,
    MEDIUM: 60,
    HIGH: 90
  },
  FATIGUE: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  BODY_PART: {
    UNUSABLE: 15,  // Parte casi inutilizable
    CRITICAL: 5    // Parte en estado crítico
  }
};

// Duelist condition types
export type DuelistCondition = 
  | 'ok'                // Estado normal
  | 'bleeding'          // Sangrado significativo
  | 'severe_bleeding'   // Sangrado severo
  | 'hemorrhage'        // Hemorragia crítica
  | 'injured'           // Heridas leves
  | 'severely_injured'  // Heridas graves
  | 'incapacitated'     // Incapacitado (no puede atacar)
  | 'unconscious'       // Inconsciente (no puede actuar en absoluto)
  | 'dying'             // Muriendo (requiere atención urgente)
  | 'dead'              // Muerto
  | 'defending'         // Estado temporal: defendiéndose
  | 'recovering';       // Estado temporal: recuperándose 