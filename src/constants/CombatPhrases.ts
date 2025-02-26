export const ATTACK_VERBS = {
  LIGHT: ['rasguña', 'roza', 'araña', 'toca', 'golpea ligeramente', 'alcanza'],
  MODERATE: ['golpea', 'impacta', 'choca contra', 'castiga', 'azota'],
  HEAVY: ['machaca', 'destroza', 'aplasta', 'desgarra', 'tritura'],
  DEVASTATING: ['pulveriza', 'aniquila', 'devasta', 'destruye', 'arrasa']
};

export const ADVERBS = {
  LIGHT: ['suavemente', 'levemente', 'superficialmente', 'ligeramente'],
  MODERATE: ['firmemente', 'sólidamente', 'contundentemente', 'duramente'],
  HEAVY: ['brutalmente', 'violentamente', 'salvajemente', 'ferozmente'],
  DEVASTATING: ['devastadoramente', 'demoledoramente', 'catastróficamente']
};

export const EFFECTS = {
  LIGHT: [
    'causando un rasguño',
    'dejando una marca',
    'provocando una leve molestia',
    'apenas dañando la piel'
  ],
  MODERATE: [
    'causando un moretón',
    'abriendo una herida',
    'provocando sangrado',
    'dejando una marca visible'
  ],
  HEAVY: [
    'rompiendo huesos',
    'destrozando músculos',
    'causando una herida profunda',
    'provocando un daño severo'
  ],
  DEVASTATING: [
    'destruyendo tejidos',
    'causando daño masivo',
    'provocando una herida fatal',
    'dejando daño permanente'
  ]
};

export const REACTIONS = {
  LIGHT: [
    'se estremece',
    'hace una mueca',
    'parpadea sorprendido',
    'da un respingo'
  ],
  MODERATE: [
    'gruñe de dolor',
    'retrocede tambaleante',
    'suelta un quejido',
    'se encoge'
  ],
  HEAVY: [
    'grita de agonía',
    'se tambalea violentamente',
    'aúlla de dolor',
    'cae de rodillas'
  ],
  DEVASTATING: [
    'se desploma',
    'cae como un árbol talado',
    'pierde el conocimiento',
    'se derrumba'
  ]
};

export const BODY_PART_DETAILS = {
  'Cabeza': ['cráneo', 'sien', 'mandíbula', 'rostro', 'nuca'],
  'Torso': ['pecho', 'costillas', 'abdomen', 'espalda', 'costado'],
  'Brazo Izquierdo': ['codo izquierdo', 'hombro izquierdo', 'antebrazo izquierdo', 'muñeca izquierda'],
  'Brazo Derecho': ['codo derecho', 'hombro derecho', 'antebrazo derecho', 'muñeca derecha'],
  'Pierna Izquierda': ['rodilla izquierda', 'muslo izquierdo', 'pantorrilla izquierda', 'tobillo izquierdo'],
  'Pierna Derecha': ['rodilla derecha', 'muslo derecho', 'pantorrilla derecha', 'tobillo derecho']
};

export const BLEEDING_DESCRIPTIONS = [
  ['gotas de sangre brotan', 'un hilo de sangre escurre', 'sangre comienza a manar'],
  ['sangre fluye', 'sangre brota constantemente', 'un río carmesí emerge'],
  ['sangre mana abundantemente', 'sangre fluye sin control', 'una hemorragia se desata']
];

export const CONSCIOUSNESS_DESCRIPTIONS = [
  ['parpadea confundido', 'sacude la cabeza', 'intenta mantener el equilibrio'],
  ['tambalea mareado', 'lucha por mantenerse en pie', 'apenas puede enfocar la vista'],
  ['está al borde del desmayo', 'apenas se mantiene consciente', 'está a punto de colapsar']
];
