export interface Ability {
  total: number;
  mod: number;
}

export interface SavingThrow {
  total: number;
  proficient: boolean;
}

export interface Skill {
  total: number;
  proficient: boolean;
}

export type AbilityScores = Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', Ability>;
export type SavingThrows = Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', SavingThrow>;

export interface SkillDefinition {
  name: string;
  key: keyof Skills;
  ability: string;
}

export interface Skills {
  acrobatics: Skill;
  arcana: Skill;
  athletics: Skill;
  deception: Skill;
  history: Skill;
  performance: Skill;
  insight: Skill;
  intimidation: Skill;
  investigation: Skill;
  sleight_of_hand: Skill;
  medicine: Skill;
  nature: Skill;
  perception: Skill;
  persuasion: Skill;
  religion: Skill;
  stealth: Skill;
  survival: Skill;
  animal_handling: Skill;
}
