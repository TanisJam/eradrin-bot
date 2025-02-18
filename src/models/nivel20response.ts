export interface Nivel20character {
  printable_hash: PrintableHash
}

export interface PrintableHash {
  originals: Originals
  info: Info
  proficiency: Proficiency
  tags: any[]
  tag_ids: any[]
  race: Race
  subrace: any
  armor: Armor
  initiative: Initiative
  speed: Speed
  saving_throw: SavingThrow
  saving_throws: SavingThrow2[]
  ability: Ability
  abilities: Ability2[]
  skill: Skill
  skills: Skill2[]
  unlocked_feats: any[]
  feats: any[]
  items: Items
  attacks: Attack3[]
  protections: Protection[]
  equipment: string
  fields: Fields5
  multiclass: Multiclass
  spell_modifiers: SpellModifiers
  spell_books: SpellBook[]
  professions: Profession[]
  race_feats: RaceFeat[]
  other_feats: any[]
  custom_feats: CustomFeat[]
  background: Background
  resources: Resources
  proficiencies: Proficiencies
  actions: Action[]
}

export interface Originals {
  abilities: Abilities
  skills: Skills
  static: Static
}

export interface Abilities {
  fue: Fue
  des: Des
  con: Con
  int: Int
  sab: Sab
  car: Car
}

export interface Fue {
  total: number
}

export interface Des {
  total: number
}

export interface Con {
  total: number
}

export interface Int {
  total: number
}

export interface Sab {
  total: number
}

export interface Car {
  total: number
}

export interface Skills {
  arcanos: Arcanos
  enganar: Enganar
  intimidar: Intimidar
  persuasion: Persuasion
  sigilo: Sigilo
  supervivencia: Supervivencia
}

export interface Arcanos {
  proficiency: any
  total: number
}

export interface Enganar {
  proficiency: any
  total: number
}

export interface Intimidar {
  proficiency: any
  total: number
}

export interface Persuasion {
  proficiency: any
  total: number
}

export interface Sigilo {
  proficiency: any
  total: number
}

export interface Supervivencia {
  proficiency: any
  total: number
}

export interface Static {
  spell_attack: SpellAttack
  spell_save: SpellSave
}

export interface SpellAttack {
  total: number
}

export interface SpellSave {
  total: number
}

export interface Info {
  level: number
  level_desc: string
  proficiency_bonus: number
  hit_points: number
  id: number
  name: string
  status: string
  race_id: number
  race_name: string
  subrace_id: any
  subrace_name: any
  race: string
  player: string
  speed: number
  campaign_id: number
  campaign: string
  campaign_logo: any
  image_url: string
  spell_caster: boolean
}

export interface Proficiency {
  none: number
  proficient: number
  expertise: number
}

export interface Race {
  id: number
  name: string
  portrait_url: string
  description: string
}

export interface Armor {
  base_armor: number
  equipment_bonus: number
  modifiers_bonus: number
  ability_limit: number
  ability_bonus: number
  normal: number
  flat_footed: number
  touch: number
  modifiers: any[]
  fixed_base: any
  fixed_base_source: any
}

export interface Initiative {
  base: number
  base_source: string
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface Speed {
  base: number
  base_source: string
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface SavingThrow {
  fue: Fue2
  des: Des2
  con: Con2
  int: Int2
  sab: Sab2
  car: Car2
}

export interface Fue2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers {
  bonus: any[]
}

export interface Des2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers2
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers2 {
  bonus: any[]
}

export interface Con2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers3
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers3 {
  bonus: any[]
}

export interface Int2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers4
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers4 {
  bonus: any[]
}

export interface Sab2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers5
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers5 {
  bonus: any[]
}

export interface Car2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers6
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers6 {
  bonus: any[]
}

export interface SavingThrow2 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers7
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers7 {
  bonus: any[]
}

export interface Ability {
  fue: Fue3
  des: Des3
  con: Con3
  int: Int3
  sab: Sab3
  car: Car3
}

export interface Fue3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers8
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow3
}

export interface Modifiers8 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface SavingThrow3 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers9
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers9 {
  bonus: any[]
}

export interface Des3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers10
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow4
}

export interface Modifiers10 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface SavingThrow4 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers11
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers11 {
  bonus: any[]
}

export interface Con3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers12
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow5
}

export interface Modifiers12 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface SavingThrow5 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers13
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers13 {
  bonus: any[]
}

export interface Int3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers14
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow6
}

export interface Modifiers14 {
  bonus: Bonu[]
  conditional_bonus: any[]
}

export interface Bonu {
  name: string
  value: number
  modifier: string
  source: string
}

export interface SavingThrow6 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers15
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers15 {
  bonus: any[]
}

export interface Sab3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers16
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow7
}

export interface Modifiers16 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface SavingThrow7 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers17
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers17 {
  bonus: any[]
}

export interface Car3 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers18
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow8
}

export interface Modifiers18 {
  bonus: Bonu2[]
  conditional_bonus: any[]
}

export interface Bonu2 {
  name: string
  value: number
  modifier: string
  source: string
}

export interface SavingThrow8 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers19
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers19 {
  bonus: any[]
}

export interface Ability2 {
  base: number
  increments: number
  bonus: number
  race_bonus: number
  total: number
  mod: number
  modifiers: Modifiers20
  id: number
  name: string
  short_name: string
  slug: string
  description: string
  saving_throw: SavingThrow9
}

export interface Modifiers20 {
  bonus: Bonu3[]
  conditional_bonus: any[]
}

export interface Bonu3 {
  name: string
  value: number
  modifier: string
  source: string
}

export interface SavingThrow9 {
  base: number
  bonus: number
  total: number
  ability: string
  ability_mod: number
  modifiers: Modifiers21
  proficiency: string
  name: string
  short_name: string
  slug: string
  ability_name: string
  ability_short_name: string
}

export interface Modifiers21 {
  bonus: any[]
}

export interface Skill {
  acrobacias: Acrobacias
  arcanos: Arcanos2
  atletismo: Atletismo
  enganar: Enganar2
  historia: Historia
  interpretacion: Interpretacion
  intimidar: Intimidar2
  investigacion: Investigacion
  juego_de_manos: JuegoDeManos
  medicina: Medicina
  naturaleza: Naturaleza
  percepcion: Percepcion
  perspicacia: Perspicacia
  persuasion: Persuasion2
  religion: Religion
  sigilo: Sigilo2
  supervivencia: Supervivencia2
  trato_con_animales: TratoConAnimales
}

export interface Acrobacias {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers22
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers22 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Arcanos2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers23
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers23 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Atletismo {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers24
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers24 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Enganar2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers25
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers25 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Historia {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers26
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers26 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Interpretacion {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers27
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers27 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Intimidar2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers28
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers28 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Investigacion {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers29
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers29 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface JuegoDeManos {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers30
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers30 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Medicina {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers31
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers31 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Naturaleza {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers32
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers32 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Percepcion {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers33
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers33 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Perspicacia {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers34
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers34 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Persuasion2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers35
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers35 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Religion {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers36
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers36 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Sigilo2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers37
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers37 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Supervivencia2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers38
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers38 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface TratoConAnimales {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers39
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers39 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Skill2 {
  ranks: number
  bonus: number
  ability: string
  modifiers: Modifiers40
  ability_mod: number
  total: number
  proficiency: string
  proficiency_bonus: number
  id: number
  slug: string
  name: string
  description: string
  requires_training: boolean
  ability_name: string
  ability_short_name: string
  armor_penalty: any
}

export interface Modifiers40 {
  bonus: any[]
  conditional_bonus: any[]
}

export interface Items {
  armas: Arma[]
  armaduras: Armadura[]
  equipo_de_aventuras: any[]
}

export interface Arma {
  name: string
  description: string
  group: string
  slot: string
  equippable: boolean
  location: string
  location_text: string
  grants_attack: boolean
  grants_armor: boolean
  attack: Attack
  armor: Armor2
  icon_url: string
  tags: string[]
  proficient: boolean
  proficiency: string
  fields: Fields
}

export interface Attack {
  range: string
  target: string
  to_hit: ToHit
  damage: Damage
}

export interface ToHit {
  ability_id: string
  bonus: string
  value: string
}

export interface Damage {
  value: string
  dice: string
  ability_id: string
  ability_factor: string
  bonus: string
  type: string
}

export interface Armor2 {
  type: string
  value: string
  max_ability: string
  penalty: string
}

export interface Fields {
  versatil?: string
  municion: any
}

export interface Armadura {
  name: string
  description: string
  group: string
  slot: string
  equippable: boolean
  location: string
  location_text: string
  grants_attack: boolean
  grants_armor: boolean
  attack: Attack2
  armor: Armor3
  icon_url: string
  tags: any[]
  proficient: boolean
  proficiency: string
  fields: Fields2
}

export interface Attack2 {
  range: string
  target: string
  to_hit: ToHit2
  damage: Damage2
}

export interface ToHit2 {
  ability_id: string
  bonus: string
  value: any
}

export interface Damage2 {
  value: any
  dice: string
  ability_id: string
  ability_factor: string
  bonus: string
  type: string
}

export interface Armor3 {
  type: string
  value: string
  max_ability: string
  penalty: string
}

export interface Fields2 {
  fuerza: any
}

export interface Attack3 {
  name: string
  description: string
  group: string
  slot: string
  equippable: boolean
  location: string
  location_text: string
  grants_attack: boolean
  grants_armor: boolean
  attack: Attack4
  armor: Armor4
  icon_url: string
  tags: string[]
  proficient: boolean
  proficiency: string
  fields: Fields3
}

export interface Attack4 {
  range: string
  target: string
  to_hit: ToHit3
  damage: Damage3
}

export interface ToHit3 {
  ability_id: string
  bonus: string
  value: string
}

export interface Damage3 {
  value: string
  dice: string
  ability_id: string
  ability_factor: string
  bonus: string
  type: string
}

export interface Armor4 {
  type: string
  value: string
  max_ability: string
  penalty: string
}

export interface Fields3 {
  versatil?: string
  municion: any
}

export interface Protection {
  name: string
  description: string
  group: string
  slot: string
  equippable: boolean
  location: string
  location_text: string
  grants_attack: boolean
  grants_armor: boolean
  attack: Attack5
  armor: Armor5
  icon_url: string
  tags: any[]
  proficient: boolean
  proficiency: string
  fields: Fields4
}

export interface Attack5 {
  range: string
  target: string
  to_hit: ToHit4
  damage: Damage4
}

export interface ToHit4 {
  ability_id: string
  bonus: string
  value: any
}

export interface Damage4 {
  value: any
  dice: string
  ability_id: string
  ability_factor: string
  bonus: string
  type: string
}

export interface Armor5 {
  type: string
  value: string
  max_ability: string
  penalty: string
}

export interface Fields4 {
  fuerza: any
}

export interface Fields5 {
  alineamiento: string
  apariencia: string
  edad: string
  historia: string
  idiomas: string
  notas: string
  puntos_de_experiencia: any
  perception: Perception
  profession_save_dc: ProfessionSaveDc
  spell_attack: SpellAttack2
  spell_save: SpellSave2
}

export interface Perception {
  base: number
  base_source: any
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface ProfessionSaveDc {
  base: number
  base_source: any
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface SpellAttack2 {
  base: number
  base_source: any
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface SpellSave2 {
  base: number
  base_source: any
  modifiers: any[]
  modifiers_bonus: number
  fixed_value: any
  fixed_value_source: any
  proficiency: any
  proficiency_bonus: number
  total_value: number
  total: number
}

export interface Multiclass {
  multi_caster: boolean
  profession_count: number
  caster_count: number
  pact_caster_count: number
  caster_level: number
  spell_slots: any[]
}

export interface SpellModifiers {
  labels: Labels
  available_spell: AvailableSpell
  known_spell: KnownSpell
  prepared_spell: PreparedSpell
}

export interface Labels {
  spell_ids: SpellIds
  spell_list_ids: SpellListIds
}

export interface SpellIds {
  "45": string[]
  "84": string[]
  "104": string[]
  "136": string[]
  "295": string[]
  "374": string[]
}

export interface SpellListIds {}

export interface AvailableSpell {
  spell_ids: number[]
  spell_list_ids: any[]
}

export interface KnownSpell {
  spell_ids: any[]
  spell_list_ids: any[]
}

export interface PreparedSpell {
  spell_ids: number[]
  spell_list_ids: any[]
}

export interface SpellBook {
  profession_id: number
  profession_name: string
  spells: [number, Spell[]][]
  focus_spells: any[]
  spell_ability_id: number
  spell_ability_name: string
  spell_ability_short_name: string
  spell_ability_slug: string
  spell_ability_mod: number
  spell_list_id: number
  spell_list_name: string
  spell_caster: string
  spell_method: string
  cantrips_enabled: boolean
  min_spell_slot_level: number
  max_spell_slot_level: number
  current_level_slots: CurrentLevelSlots
  prepared_spells?: number
  prepared_cantrips: boolean
  known_spells?: number
  cantrips: number
  spell_save_proficiency: string
  spell_save_dc: number
  spell_attack_proficiency: string
  spell_attack_bonus: number
}

export interface Spell {
  id: number
  name: string
  level: number
  summary: string
  description: string
  components: string
  short_components: string
  component_material_description: string
  range: string
  casting_time: string
  casting_time_unit: string
  short_casting_time: string
  area?: string
  target: any
  duration: string
  saving_throw?: string
  attack?: string
  tags: Tag[]
  spell_school_id: number
  spell_school_name: string
  prerequisites: string
  ritual: boolean
  spell_type: string
  spell_type_text: string
  character_spell_id?: number
  included: boolean
  prepared?: boolean
  profession_id: number
  label: string[]
  icon_url: string
}

export interface Tag {
  id: number
  name: string
  description: string
}

export interface CurrentLevelSlots {
  cantrips: string
  known_spells?: string
  "3"?: string
  "1"?: string
}

export interface Profession {
  id: number
  name: string
  description: string
  archetype_id: number
  archetype_name: string
  archetype_description: string
  level: number
  hit_points_dice: number
  feats: Feat[]
  portrait_url: string
}

export interface Feat {
  id: number
  name: string
  symbol: any
  summary?: string
  description: string
  mode: string
  visible: boolean
  profession_id: number
  category_id?: number
  category_name?: string
  group_name?: string
  required_level: number
  modifiers: any[]
  levels: Level[]
}

export interface Level {
  required_level: number
  name: string
  modifiers: string[]
}

export interface RaceFeat {
  id: number
  name: string
  description: string
}

export interface CustomFeat {
  name: string
  description: string
  summary: string
  visible: boolean
  symbol: any
  value: any
}

export interface Background {
  name: string
  specialty_title: any
  specialty: string
  feat_name: any
  feat_description: string
  ideals: string
  bonds: string
  flaws: string
  traits: string
}

export interface Resources {
  pact_spell_slots: PactSpellSlots
  spell_slots: SpellSlots
}

export interface PactSpellSlots {
  "3": string
}

export interface SpellSlots {
  "1": string
}

export interface Proficiencies {
  skills: Skills2
  saving_throws: SavingThrows
  items: Items2
  item_groups: ItemGroups
}

export interface Skills2 {
  proficient: any[]
  expertise: any[]
}

export interface SavingThrows {
  proficient: string[]
  expertise: any[]
}

export interface Items2 {
  proficient: string[]
  expertise: any[]
}

export interface ItemGroups {
  proficient: string[]
  expertise: any[]
}

export interface Action {
  id: string
  name: string
  text?: string
  icon: string
  description?: string
  action_type: string
  hidden: boolean
  order?: number
  source_name: string
  tooltip_title: string
  owned: boolean
  elements: Element[]
}

export interface Element {
  id?: string
  name: string
  text?: string
  icon: string
  description: string
  action_type: string
  hidden: boolean
  order: any
  source_name?: string
  tooltip_title: string
  owned: boolean
  dice_roll: string
  dice_roll_formula: string
  roll_options: RollOptions
}

export interface RollOptions {
  roll_name: string
  roll_type: string
}
