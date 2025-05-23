import { SkillDefinition } from './types';

export const ABILITY_NAMES = {
  str: 'Fue',
  dex: 'Des',
  con: 'Con',
  int: 'Int',
  wis: 'Sab',
  cha: 'Car',
} as const;

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { name: 'Acrobacias', key: 'acrobatics', ability: 'Des' },
  { name: 'Arcanos', key: 'arcana', ability: 'Int' },
  { name: 'Atletismo', key: 'athletics', ability: 'Fue' },
  { name: 'Engañar', key: 'deception', ability: 'Car' },
  { name: 'Historia', key: 'history', ability: 'Int' },
  { name: 'Interpretación', key: 'performance', ability: 'Car' },
  { name: 'Perspicacia', key: 'insight', ability: 'Sab' },
  { name: 'Intimidación', key: 'intimidation', ability: 'Car' },
  { name: 'Investigación', key: 'investigation', ability: 'Int' },
  { name: 'Juego de manos', key: 'sleight_of_hand', ability: 'Des' },
  { name: 'Medicina', key: 'medicine', ability: 'Sab' },
  { name: 'Naturaleza', key: 'nature', ability: 'Int' },
  { name: 'Percepción', key: 'perception', ability: 'Sab' },
  { name: 'Persuasión', key: 'persuasion', ability: 'Car' },
  { name: 'Religión', key: 'religion', ability: 'Int' },
  { name: 'Sigilo', key: 'stealth', ability: 'Des' },
  { name: 'Supervivencia', key: 'survival', ability: 'Sab' },
  { name: 'Trato con animales', key: 'animal_handling', ability: 'Sab' },
];
