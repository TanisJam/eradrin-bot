import { Nivel20character } from './nivel20response';

export class CharacterSheet {
  url: string;
  name: string;
  level_desc: string;
  hit_points: number;
  proficiency_bonus: number;
  image_url: string;
  initiative: number;
  speed: number;
  armor: number;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saving_throws: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills: {
    acrobatics: number;
    arcana: number;
    athletics: number;
    deception: number;
    history: number;
    performance: number;
    insight: number;
    intimidation: number;
    investigation: number;
    sleight_of_hand: number;
    medicine: number;
    nature: number;
    perception: number;
    persuasion: number;
    religion: number;
    stealth: number;
    survival: number;
    animal_handling: number;
  };

  constructor(characterData: Nivel20character, url: string) {
    const {
      skill,
      ability,
      abilities,
      saving_throws,
      speed,
      initiative,
      armor,
      info,
      equipment,
    } = characterData.printable_hash;
    
    this.url = url;
    this.name = info.name;
    this.level_desc = info.level_desc;
    this.hit_points = info.hit_points;
    this.proficiency_bonus = info.proficiency_bonus;
    this.image_url = info.image_url;
    this.initiative = initiative.total;
    this.speed = speed.total;
    this.armor = armor.normal;
    this.abilities = {
      str: ability.fue.total,
      dex: ability.des.total,
      con: ability.con.total,
      int: ability.int.total,
      wis: ability.sab.total,
      cha: ability.car.total,
    };
    this.saving_throws = {
      str: ability.fue.saving_throw.total,
      dex: ability.des.saving_throw.total,
      con: ability.con.saving_throw.total,
      int: ability.int.saving_throw.total,
      wis: ability.sab.saving_throw.total,
      cha: ability.car.saving_throw.total,
    };
    this.skills = {
      acrobatics: skill.acrobacias.total,
      arcana: skill.arcanos.total,
      athletics: skill.atletismo.total,
      deception: skill.enganar.total,
      history: skill.historia.total,
      performance: skill.interpretacion.total,
      insight: skill.interpretacion.total,
      intimidation: skill.intimidar.total,
      investigation: skill.investigacion.total,
      sleight_of_hand: skill.juego_de_manos.total,
      medicine: skill.medicina.total,
      nature: skill.naturaleza.total,
      perception: skill.percepcion.total,
      persuasion: skill.persuasion.total,
      religion: skill.religion.total,
      stealth: skill.sigilo.total,
      survival: skill.supervivencia.total,
      animal_handling: skill.trato_con_animales.total,
    };
  }

  toEmbed() {
    return {
      color: 0x1d82b6,
      title: `📜 ${this.name}`,
      url: this.url,
      description: `**${this.level_desc}**`,
      thumbnail: {
        url: this.image_url,
      },
      fields: [
        {
          name: '',
          value: `**❤️ PG:** \`${this.hit_points}\``,
          inline: true,
        },
        {
          name: '',
          value: `**🛡️ CA:** \`${this.armor}\``,
          inline: true,
        },
        {
          name: '',
          value: `**🏃 Velocidad:** \`${this.speed}\`ft`,
          inline: true,
        },
        {
          name: '',
          value: `**⚡ Iniciativa:** +\`${this.initiative}\``,
          inline: true,
        },
        {
          name: '',
          value: `**🎖️ Bono de Comp:** +\`${this.proficiency_bonus}\``,
          inline: true,
        },
        {
          name: '',
          value: `
          > **Fuerza:** \`${this.abilities.str}\` | **TS:** \`${this.saving_throws.str}\`  
          > **Destreza:** \`${this.abilities.dex}\` | **TS:** \`${this.saving_throws.dex}\`  
          > **Constitución:** \`${this.abilities.con}\` | **TS:** \`${this.saving_throws.con}\`  
          > **Inteligencia:** \`${this.abilities.int}\` | **TS:** \`${this.saving_throws.int}\`  
          > **Sabiduría:** \`${this.abilities.wis}\` | **TS:** \`${this.saving_throws.wis}\`  
          > **Carisma:** \`${this.abilities.cha}\` | **TS:** \`${this.saving_throws.cha}\``,
          inline: false,
        },
        {
          name: '> 📚 ***Habilidades***',
          value: `
          > - **Acrobacias (Des):** +\`${this.skills.acrobatics}\`  
          > - **Arcanos (Int):** +\`${this.skills.arcana}\`  
          > - **Atletismo (Fue):** +\`${this.skills.athletics}\`  
          > - **Engañar (Car):** +\`${this.skills.deception}\`  
          > - **Historia (Int):** +\`${this.skills.history}\`  
          > - **Interpretación (Car):** +\`${this.skills.performance}\`  
          > - **Intimidar (Car):** +\`${this.skills.intimidation}\`  
          > - **Investigación (Int):** +\`${this.skills.investigation}\`  
          > - **Juego de Manos (Des):** +\`${this.skills.sleight_of_hand}\`  
          > - **Medicina (Sab):** +\`${this.skills.medicine}\`  
          > - **Naturaleza (Int):** +\`${this.skills.nature}\`  
          > - **Percepción (Sab):** +\`${this.skills.perception}\`  
          > - **Perspicacia (Sab):** +\`${this.skills.insight}\`  
          > - **Persuasión (Car):** +\`${this.skills.persuasion}\`  
          > - **Religión (Int):** +\`${this.skills.religion}\`  
          > - **Sigilo (Des):** +\`${this.skills.stealth}\`  
          > - **Supervivencia (Sab):** +\`${this.skills.survival}\`  
          > - **Trato con Animales (Sab):** +\`${this.skills.animal_handling}\``,
          inline: false,
        },
      ],
      footer: {
        text: '📜 Ficha de Personaje - D&D 5e',
        icon_url: this.image_url,
      },
    };
  }
}
