import { conditionallyUnderline } from '../utils/format-text';
import { Nivel20character } from './nivel20response';
import { AbilityScores, SavingThrows, Skills } from './types';
import { ABILITY_NAMES, SKILL_DEFINITIONS } from './constants';

export class CharacterSheet {
  private url: string;
  private name: string;
  private level_desc: string;
  private hit_points: number;
  private proficiency_bonus: number;
  private image_url: string;
  private initiative: number;
  private speed: number;
  private armor: number;
  private characteristics: AbilityScores;
  private saving_throws: SavingThrows;
  private skills: Skills;


  constructor(characterData: Nivel20character, url: string) {
    const { skill, ability, speed, initiative, armor, info } = characterData.printable_hash;
    
    this.url = url;
    this.name = info.name;
    this.level_desc = info.level_desc;
    this.hit_points = info.hit_points;
    this.proficiency_bonus = info.proficiency_bonus;
    this.image_url = info.image_url;
    this.initiative = initiative.total;
    this.speed = speed.total;
    this.armor = armor.normal;

    this.characteristics = {
      str: { total: ability.fue.total, mod: ability.fue.mod },
      dex: { total: ability.des.total, mod: ability.des.mod },
      con: { total: ability.con.total, mod: ability.con.mod },
      int: { total: ability.int.total, mod: ability.int.mod },
      wis: { total: ability.sab.total, mod: ability.sab.mod },
      cha: { total: ability.car.total, mod: ability.car.mod },
    };

    this.saving_throws = {
      str: this.mapSavingThrow(ability.fue.saving_throw),
      dex: this.mapSavingThrow(ability.des.saving_throw),
      con: this.mapSavingThrow(ability.con.saving_throw),
      int: this.mapSavingThrow(ability.int.saving_throw),
      wis: this.mapSavingThrow(ability.sab.saving_throw),
      cha: this.mapSavingThrow(ability.car.saving_throw),
    };

    this.skills = {
      acrobatics: this.mapSkill(skill.acrobacias),
      arcana: this.mapSkill(skill.arcanos),
      athletics: this.mapSkill(skill.atletismo),
      deception: this.mapSkill(skill.enganar),
      history: this.mapSkill(skill.historia),
      performance: this.mapSkill(skill.interpretacion),
      insight: this.mapSkill(skill.perspicacia),
      intimidation: this.mapSkill(skill.intimidar),
      investigation: this.mapSkill(skill.investigacion),
      sleight_of_hand: this.mapSkill(skill.juego_de_manos),
      medicine: this.mapSkill(skill.medicina),
      nature: this.mapSkill(skill.naturaleza),
      perception: this.mapSkill(skill.percepcion),
      persuasion: this.mapSkill(skill.persuasion),
      religion: this.mapSkill(skill.religion),
      stealth: this.mapSkill(skill.sigilo),
      survival: this.mapSkill(skill.supervivencia),
      animal_handling: this.mapSkill(skill.trato_con_animales),
    };
  }

  private mapSavingThrow(save: any) {
    return {
      total: save.total,
      proficient: save.proficiency === 'proficient'
    };
  }

  private mapSkill(skill: any) {
    return {
      total: skill.total,
      proficient: skill.proficiency === 'proficient'
    };
  }

  private formatModifier = (value: number) => `${value >= 0 ? '+' : ''}${value}`;

  private formatAbility(ability: any, savingThrow: any, proficiency = false): string {
    return `\`${this.formatModifier(ability.mod)} (${ability.total})\` | ${
      conditionallyUnderline('**TS:**', proficiency)
    } \`${this.formatModifier(savingThrow.total)}\``;
  }

  toEmbed() {
    return {
      color: 0x1d82b6,
      title: `📜 ${this.name}`,
      url: this.url,
      description: `**${this.level_desc}**`,
      thumbnail: { url: this.image_url },
      fields: [
        {
          name: '',
          value: [
            `**❤️ PG:** \`${this.hit_points}\``,
            `**🛡️ CA:** \`${this.armor}\``,
            `**🏃 Velocidad:** \`${this.speed}ft\``,
            `**⚡ Iniciativa:** \`${this.formatModifier(this.initiative)}\``,
            `**🎖️ Bono de Comp:** +\`${this.proficiency_bonus}\``,
          ].join('\n')
        },
        {
          name: '',
          value: Object.entries(ABILITY_NAMES)
            .map(([key, name]) => this.formatAbilityLine(key as keyof AbilityScores, name))
            .join('\n')
        },
        {
          name: '> 📚 ***Habilidades***',
          value: SKILL_DEFINITIONS
            .map(({ name, key, ability }) => this.formatSkillLine(name, key, ability))
            .join('\n')
        }
      ],
      footer: {
        text: '📜 Ficha de Personaje - D&D 5e',
        icon_url: this.image_url,
      }
    };
  }

  private formatAbilityLine(key: keyof AbilityScores, name: string) {
    return `> **${name}:** ${this.formatAbility(
      this.characteristics[key],
      this.saving_throws[key],
      this.saving_throws[key].proficient
    )}`;
  }

  private formatSkillLine(name: string, key: keyof Skills, ability: string) {
    const skill = this.skills[key];
    return `> - **${name} (${conditionallyUnderline(ability, skill.proficient)}):** \`${
      this.formatModifier(skill.total)
    }\``;
  }
}
