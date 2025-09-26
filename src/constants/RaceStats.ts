/**
 * Race statistics and definitions
 * Contains modifiers and default values for different races
 */

// Lista de razas disponibles de D&D
export const DND_RACES = [
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
export const RACE_STATS = {
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