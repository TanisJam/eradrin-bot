import { execute, nivel20Service } from '../../../src/commands/character';
import { Nivel20Service } from '../../../src/services/nivel20.service';
import { createCharacterButtons } from '../../../src/utils/discord.utils';
import { ComponentType } from 'discord.js';
import { CharacterSheet } from '../../../src/types/models/character-sheet';
import { Nivel20character } from '../../../src/types/models/nivel20response';

// Mock para Nivel20Service y createCharacterButtons
jest.mock('../../../src/services/nivel20.service');
jest.mock('../../../src/utils/discord.utils');

describe('Comando character', () => {
  let mockInteraction: any;
  let mockMessage: any;
  let mockNivel20Service: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock para el mensaje
    mockMessage = {
      createMessageComponentCollector: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis()
      })
    };
    
    // Mock para la interacción
    mockInteraction = {
      user: { id: 'user123' },
      options: {
        get: jest.fn((name) => (name === 'name' ? { value: 'Gandalf' } : undefined))
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(mockMessage),
      reply: jest.fn().mockResolvedValue(undefined),
      guild: { id: 'guild1' },
      channel: { id: 'channel1', send: jest.fn() }
    };
    
    // Mock para createCharacterButtons
    (createCharacterButtons as jest.Mock).mockReturnValue([
      { type: 1, components: [{ type: 2, customId: 'char_0', label: 'Character 1' }] }
    ]);
    
    // Dummy Nivel20character para el constructor de CharacterSheet
    const dummyNivel20: Nivel20character = {
      printable_hash: {
        skill: {
          acrobacias: { 
            ranks: 0,
            bonus: 0,
            ability: 'des',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 1,
            slug: 'acrobacias',
            name: 'Acrobacias',
            description: '',
            requires_training: false,
            ability_name: 'Destreza',
            ability_short_name: 'Des',
            armor_penalty: null
          },
          arcanos: { 
            ranks: 0,
            bonus: 0,
            ability: 'int',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 2,
            slug: 'arcanos',
            name: 'Arcanos',
            description: '',
            requires_training: false,
            ability_name: 'Inteligencia',
            ability_short_name: 'Int',
            armor_penalty: null
          },
          atletismo: { 
            ranks: 0,
            bonus: 0,
            ability: 'fue',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 3,
            slug: 'atletismo',
            name: 'Atletismo',
            description: '',
            requires_training: false,
            ability_name: 'Fuerza',
            ability_short_name: 'Fue',
            armor_penalty: null
          },
          enganar: { 
            ranks: 0,
            bonus: 0,
            ability: 'car',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 4,
            slug: 'enganar',
            name: 'Engañar',
            description: '',
            requires_training: false,
            ability_name: 'Carisma',
            ability_short_name: 'Car',
            armor_penalty: null
          },
          historia: { 
            ranks: 0,
            bonus: 0,
            ability: 'int',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 5,
            slug: 'historia',
            name: 'Historia',
            description: '',
            requires_training: false,
            ability_name: 'Inteligencia',
            ability_short_name: 'Int',
            armor_penalty: null
          },
          interpretacion: { 
            ranks: 0,
            bonus: 0,
            ability: 'car',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 6,
            slug: 'interpretacion',
            name: 'Interpretación',
            description: '',
            requires_training: false,
            ability_name: 'Carisma',
            ability_short_name: 'Car',
            armor_penalty: null
          },
          perspicacia: { 
            ranks: 0,
            bonus: 0,
            ability: 'sab',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 7,
            slug: 'perspicacia',
            name: 'Perspicacia',
            description: '',
            requires_training: false,
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab',
            armor_penalty: null
          },
          intimidar: { 
            ranks: 0,
            bonus: 0,
            ability: 'car',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 8,
            slug: 'intimidar',
            name: 'Intimidar',
            description: '',
            requires_training: false,
            ability_name: 'Carisma',
            ability_short_name: 'Car',
            armor_penalty: null
          },
          investigacion: { 
            ranks: 0,
            bonus: 0,
            ability: 'int',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 9,
            slug: 'investigacion',
            name: 'Investigación',
            description: '',
            requires_training: false,
            ability_name: 'Inteligencia',
            ability_short_name: 'Int',
            armor_penalty: null
          },
          juego_de_manos: { 
            ranks: 0,
            bonus: 0,
            ability: 'des',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 10,
            slug: 'juego-de-manos',
            name: 'Juego de Manos',
            description: '',
            requires_training: false,
            ability_name: 'Destreza',
            ability_short_name: 'Des',
            armor_penalty: null
          },
          medicina: { 
            ranks: 0,
            bonus: 0,
            ability: 'sab',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 11,
            slug: 'medicina',
            name: 'Medicina',
            description: '',
            requires_training: false,
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab',
            armor_penalty: null
          },
          naturaleza: { 
            ranks: 0,
            bonus: 0,
            ability: 'int',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 12,
            slug: 'naturaleza',
            name: 'Naturaleza',
            description: '',
            requires_training: false,
            ability_name: 'Inteligencia',
            ability_short_name: 'Int',
            armor_penalty: null
          },
          percepcion: { 
            ranks: 0,
            bonus: 0,
            ability: 'sab',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 13,
            slug: 'percepcion',
            name: 'Percepción',
            description: '',
            requires_training: false,
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab',
            armor_penalty: null
          },
          persuasion: { 
            ranks: 0,
            bonus: 0,
            ability: 'car',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 14,
            slug: 'persuasion',
            name: 'Persuasión',
            description: '',
            requires_training: false,
            ability_name: 'Carisma',
            ability_short_name: 'Car',
            armor_penalty: null
          },
          religion: { 
            ranks: 0,
            bonus: 0,
            ability: 'int',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 15,
            slug: 'religion',
            name: 'Religión',
            description: '',
            requires_training: false,
            ability_name: 'Inteligencia',
            ability_short_name: 'Int',
            armor_penalty: null
          },
          sigilo: { 
            ranks: 0,
            bonus: 0,
            ability: 'des',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 16,
            slug: 'sigilo',
            name: 'Sigilo',
            description: '',
            requires_training: false,
            ability_name: 'Destreza',
            ability_short_name: 'Des',
            armor_penalty: null
          },
          supervivencia: { 
            ranks: 0,
            bonus: 0,
            ability: 'sab',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 17,
            slug: 'supervivencia',
            name: 'Supervivencia',
            description: '',
            requires_training: false,
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab',
            armor_penalty: null
          },
          trato_con_animales: { 
            ranks: 0,
            bonus: 0,
            ability: 'sab',
            modifiers: { bonus: [], conditional_bonus: [] },
            ability_mod: 0,
            total: 0,
            proficiency: 'none',
            proficiency_bonus: 0,
            id: 18,
            slug: 'trato-con-animales',
            name: 'Trato con Animales',
            description: '',
            requires_training: false,
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab',
            armor_penalty: null
          }
        },
        ability: {
          fue: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 1,
            name: 'Fuerza',
            short_name: 'Fue',
            slug: 'fuerza',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'fue',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Fuerza',
              short_name: 'TS Fuerza',
              slug: 'ts-fuerza',
              ability_name: 'Fuerza',
              ability_short_name: 'Fue'
            }
          },
          des: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 2,
            name: 'Destreza',
            short_name: 'Des',
            slug: 'destreza',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'des',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Destreza',
              short_name: 'TS Destreza',
              slug: 'ts-destreza',
              ability_name: 'Destreza',
              ability_short_name: 'Des'
            }
          },
          con: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 3,
            name: 'Constitución',
            short_name: 'Con',
            slug: 'constitucion',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'con',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Constitución',
              short_name: 'TS Constitución',
              slug: 'ts-constitucion',
              ability_name: 'Constitución',
              ability_short_name: 'Con'
            }
          },
          int: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 4,
            name: 'Inteligencia',
            short_name: 'Int',
            slug: 'inteligencia',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'int',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Inteligencia',
              short_name: 'TS Inteligencia',
              slug: 'ts-inteligencia',
              ability_name: 'Inteligencia',
              ability_short_name: 'Int'
            }
          },
          sab: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 5,
            name: 'Sabiduría',
            short_name: 'Sab',
            slug: 'sabiduria',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'sab',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Sabiduría',
              short_name: 'TS Sabiduría',
              slug: 'ts-sabiduria',
              ability_name: 'Sabiduría',
              ability_short_name: 'Sab'
            }
          },
          car: { 
            base: 10,
            increments: 0,
            bonus: 0,
            race_bonus: 0,
            total: 10,
            mod: 0,
            modifiers: { bonus: [], conditional_bonus: [] },
            id: 6,
            name: 'Carisma',
            short_name: 'Car',
            slug: 'carisma',
            description: '',
            saving_throw: {
              base: 0,
              bonus: 0,
              total: 0,
              ability: 'car',
              ability_mod: 0,
              modifiers: { bonus: [] },
              proficiency: 'none',
              name: 'Tirada de Salvación de Carisma',
              short_name: 'TS Carisma',
              slug: 'ts-carisma',
              ability_name: 'Carisma',
              ability_short_name: 'Car'
            }
          }
        },
        speed: {
          base: 30,
          base_source: 'race',
          modifiers: [],
          modifiers_bonus: 0,
          total: 30,
          fixed_value: 0,
          fixed_value_source: '',
          proficiency: 'none',
          proficiency_bonus: 0,
          total_value: 30
        },
        initiative: {
          base: 2,
          base_source: 'ability',
          modifiers: [],
          modifiers_bonus: 0,
          total: 2,
          fixed_value: 0,
          fixed_value_source: '',
          proficiency: 'none',
          proficiency_bonus: 0,
          total_value: 2
        },
        armor: {
          base_armor: 10,
          equipment_bonus: 0,
          modifiers_bonus: 0,
          ability_limit: 0,
          ability_bonus: 0,
          normal: 10,
          flat_footed: 10,
          touch: 10,
          modifiers: [],
          fixed_base: null,
          fixed_base_source: null
        },
        info: {
          name: 'Gandalf el Gris',
          level_desc: 'Mago Nivel 20',
          hit_points: 100,
          proficiency_bonus: 2,
          image_url: '',
          level: 20,
          id: 1,
          status: '',
          race_id: 1,
          race_name: '',
          subrace_id: null,
          subrace_name: null,
          race: '',
          player: '',
          speed: 30,
          campaign_id: 1,
          campaign: '',
          campaign_logo: null,
          spell_caster: false
        },
        originals: {
          abilities: {
            fue: { total: 10 },
            des: { total: 10 },
            con: { total: 10 },
            int: { total: 10 },
            sab: { total: 10 },
            car: { total: 10 }
          },
          skills: {
            arcanos: { proficiency: null, total: 0 },
            enganar: { proficiency: null, total: 0 },
            intimidar: { proficiency: null, total: 0 },
            persuasion: { proficiency: null, total: 0 },
            sigilo: { proficiency: null, total: 0 },
            supervivencia: { proficiency: null, total: 0 }
          },
          static: {
            spell_attack: { total: 0 },
            spell_save: { total: 0 }
          }
        },
        proficiency: {
          none: 0,
          proficient: 2,
          expertise: 4
        },
        tags: [],
        tag_ids: [],
        race: {
          id: 1,
          name: 'Humano',
          portrait_url: '',
          description: ''
        },
        subrace: null,
        saving_throw: {
          fue: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'fue',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Fuerza',
            short_name: 'TS Fuerza',
            slug: 'ts-fuerza',
            ability_name: 'Fuerza',
            ability_short_name: 'Fue'
          },
          des: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'des',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Destreza',
            short_name: 'TS Destreza',
            slug: 'ts-destreza',
            ability_name: 'Destreza',
            ability_short_name: 'Des'
          },
          con: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'con',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Constitución',
            short_name: 'TS Constitución',
            slug: 'ts-constitucion',
            ability_name: 'Constitución',
            ability_short_name: 'Con'
          },
          int: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'int',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Inteligencia',
            short_name: 'TS Inteligencia',
            slug: 'ts-inteligencia',
            ability_name: 'Inteligencia',
            ability_short_name: 'Int'
          },
          sab: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'sab',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Sabiduría',
            short_name: 'TS Sabiduría',
            slug: 'ts-sabiduria',
            ability_name: 'Sabiduría',
            ability_short_name: 'Sab'
          },
          car: {
            base: 0,
            bonus: 0,
            total: 0,
            ability: 'car',
            ability_mod: 0,
            modifiers: { bonus: [] },
            proficiency: 'none',
            name: 'Tirada de Salvación de Carisma',
            short_name: 'TS Carisma',
            slug: 'ts-carisma',
            ability_name: 'Carisma',
            ability_short_name: 'Car'
          }
        },
        saving_throws: [],
        abilities: [],
        skills: [],
        unlocked_feats: [],
        feats: [],
        items: {
          armas: [],
          armaduras: [],
          equipo_de_aventuras: []
        },
        attacks: [],
        protections: [],
        equipment: '',
        fields: {
          alineamiento: '',
          apariencia: '',
          edad: '',
          historia: '',
          idiomas: '',
          notas: '',
          puntos_de_experiencia: null,
          perception: {
            base: 0,
            base_source: null,
            modifiers: [],
            modifiers_bonus: 0,
            fixed_value: null,
            fixed_value_source: null,
            proficiency: null,
            proficiency_bonus: 0,
            total_value: 0,
            total: 0
          },
          profession_save_dc: {
            base: 0,
            base_source: null,
            modifiers: [],
            modifiers_bonus: 0,
            fixed_value: null,
            fixed_value_source: null,
            proficiency: null,
            proficiency_bonus: 0,
            total_value: 0,
            total: 0
          },
          spell_attack: {
            base: 0,
            base_source: null,
            modifiers: [],
            modifiers_bonus: 0,
            fixed_value: null,
            fixed_value_source: null,
            proficiency: null,
            proficiency_bonus: 0,
            total_value: 0,
            total: 0
          },
          spell_save: {
            base: 0,
            base_source: null,
            modifiers: [],
            modifiers_bonus: 0,
            fixed_value: null,
            fixed_value_source: null,
            proficiency: null,
            proficiency_bonus: 0,
            total_value: 0,
            total: 0
          }
        },
        multiclass: {
          multi_caster: false,
          profession_count: 1,
          caster_count: 1,
          pact_caster_count: 0,
          caster_level: 1,
          spell_slots: []
        },
        spell_modifiers: {
          labels: {
            spell_ids: {
              "45": [],
              "84": [],
              "104": [],
              "136": [],
              "295": [],
              "374": []
            },
            spell_list_ids: {}
          },
          available_spell: {
            spell_ids: [],
            spell_list_ids: []
          },
          known_spell: {
            spell_ids: [],
            spell_list_ids: []
          },
          prepared_spell: {
            spell_ids: [],
            spell_list_ids: []
          }
        },
        spell_books: [],
        professions: [],
        race_feats: [],
        other_feats: [],
        custom_feats: [],
        background: {
          name: '',
          specialty_title: null,
          specialty: '',
          feat_name: null,
          feat_description: '',
          ideals: '',
          bonds: '',
          flaws: '',
          traits: ''
        },
        resources: {
          pact_spell_slots: {
            "3": "1"
          },
          spell_slots: {
            "1": "1"
          }
        },
        proficiencies: {
          skills: {
            proficient: [],
            expertise: []
          },
          saving_throws: {
            proficient: [],
            expertise: []
          },
          items: {
            proficient: [],
            expertise: []
          },
          item_groups: {
            proficient: [],
            expertise: []
          }
        },
        actions: []
      }
    };
    const charSheet = new CharacterSheet(dummyNivel20, 'https://example.com/gandalf');
    charSheet.toEmbed = jest.fn().mockReturnValue({
      color: 0x1d82b6,
      title: '📜 Gandalf',
      description: '**Mago Nivel 20**',
      fields: []
    });
    jest.spyOn(nivel20Service, 'getCharacterStats').mockResolvedValue(charSheet);
    jest.spyOn(nivel20Service, 'searchCharacters').mockResolvedValue([
      { name: 'Gandalf el Gris', link: 'https://example.com/gandalf' }
    ]);
  });
  
  test('debe ejecutar el comando character sin errores', async () => {
    // Ejecutar el comando
    await execute(mockInteraction);
    
    // Verificar que se llama a deferReply
    expect(mockInteraction.deferReply).toHaveBeenCalled();
    
    // Verificar que se llama a searchCharacters
    expect(nivel20Service.searchCharacters).toHaveBeenCalled();
    
    // Verificar que se llama a editReply
    expect(mockInteraction.editReply).toHaveBeenCalled();
    
    // Verificar que se crea un colector de componentes
    expect(mockMessage.createMessageComponentCollector).toHaveBeenCalledWith({
      componentType: ComponentType.Button,
      time: expect.any(Number)
    });
  });
}); 