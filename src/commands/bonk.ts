import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { DuelistService } from '../services/Duelist.service';
import { CombatService } from '../services/Combat.service';
import Duelist from '../database/models/Duelist';
import { BODY_PARTS } from '../types';
import BodyPart from '../database/models/BodyPart';
import Combat from '../database/models/Combat';

// Crear instancias de los servicios
const duelistService = new DuelistService();
const combatService = new CombatService();

// Helper function to check if a duelist can engage in combat
const canEngageInCombat = (duelist: Duelist): { canEngage: boolean; reason: string } => {
  if (duelist.conditions.includes('permanent_death')) {
    return { canEngage: false, reason: 'ha muerto permanentemente' };
  }
  if (duelist.conditions.includes('dead')) {
    return { canEngage: false, reason: 'está muerto' };
  }
  if (duelist.conditions.includes('dying')) {
    return { canEngage: false, reason: 'está agonizando' };
  }
  if (duelist.conditions.includes('unconscious')) {
    return { canEngage: false, reason: 'está inconsciente' };
  }
  if (duelist.conditions.includes('incapacitated')) {
    return { canEngage: false, reason: 'está incapacitado' };
  }
  return { canEngage: true, reason: '' };
};

// Formatear el estado del duelista
const formatDuelistStatus = (duelist: Duelist, bodyParts: BodyPart[]) => {
  // Determinar el estado general del duelista
  let generalStateEmoji = '✅'; // Estado normal por defecto
  let stateDescription = '';
  
  // Verificar si hay condiciones especiales
  if (duelist.conditions.includes('permanent_death')) {
    generalStateEmoji = '☠️';
    stateDescription = '**MUERTO PERMANENTEMENTE**';
  } else if (duelist.conditions.includes('dead')) {
    generalStateEmoji = '⚰️';
    stateDescription = '**MUERTO**';
  } else if (duelist.conditions.includes('dying')) {
    generalStateEmoji = '💀';
    stateDescription = '**MURIENDO**';
  } else if (duelist.conditions.includes('unconscious')) {
    generalStateEmoji = '😴';
    stateDescription = '**INCONSCIENTE**';
  } else if (duelist.conditions.includes('incapacitated')) {
    generalStateEmoji = '🤕';
    stateDescription = '**INCAPACITADO**';
  } else if (duelist.conditions.includes('severely_injured')) {
    generalStateEmoji = '🩸';
    stateDescription = '**HERIDO GRAVE**';
  } else if (duelist.conditions.includes('injured')) {
    generalStateEmoji = '🩹';
    stateDescription = '**HERIDO**';
  } else if (duelist.conditions.includes('hemorrhage')) {
    generalStateEmoji = '🩸';
    stateDescription = '**HEMORRAGIA**';
  } 
  
  // Si no hay condiciones ni estados vitales significativos, mostrar un mensaje positivo
  if (!stateDescription) {
    return "✅ **Estado óptimo**";
  }
  
  return `${generalStateEmoji} **Estado**: ${stateDescription}`;
};

// Formatear las partes del cuerpo dañadas
const formatBodyPartsHealth = (bodyParts: BodyPart[]) => {
  // Agrupar por tipo y solo mostrar las que están bajo del 100%
  const damagedParts = bodyParts.filter(part => {
    let maxHealth;
    switch (part.type) {
      case 'head': maxHealth = 60; break;
      case 'torso': maxHealth = 120; break;
      case 'arm': maxHealth = 50; break;
      case 'leg': maxHealth = 70; break;
      default: maxHealth = 100;
    }
    return part.health < maxHealth;
  });
  
  // Si no hay partes dañadas, mostrar mensaje simple
  if (damagedParts.length === 0) {
    return '✅ **Todas las partes en buen estado**';
  }

  // Mostrar solo las partes del cuerpo más dañadas (máximo 3)
  const criticalParts = damagedParts.slice(0, 3).map(part => {
    let maxHealth;
    
    switch (part.type) {
      case 'head': maxHealth = 60; break;
      case 'torso': maxHealth = 120; break;
      case 'arm': maxHealth = 50; break;
      case 'leg': maxHealth = 70; break;
      default: maxHealth = 100;
    }
    
    const healthPercentage = (part.health / maxHealth) * 100;
    let healthEmoji = '🟢';
    
    if (healthPercentage < 25) {
      healthEmoji = '🔴'; // Crítico
    } else if (healthPercentage < 50) {
      healthEmoji = '🟠'; // Dañado
    } else if (healthPercentage < 75) {
      healthEmoji = '🟡'; // Levemente dañado
    }
    
    return `${healthEmoji} ${part.name}: ${part.health}/${maxHealth}`;
  }).join(' | ');
  
  return criticalParts + (damagedParts.length > 3 ? ` _(+${damagedParts.length - 3} más)_` : '');
};

/**
 * Genera una descripción detallada de un ataque
 */
function generarDescripcionAtaque(
  atacante: string, 
  defensor: string, 
  parteCuerpo: string, 
  resultado: any
): string {
  // Variedad de verbos de ataque
  const verbosAtaque = [
    'golpea', 'impacta', 'ataca', 'arremete contra', 'asesta un golpe a',
    'propina un golpazo a', 'sacude', 'da un puñetazo a', 'da un porrazo a'
  ];
  
  // Variedad de adjetivos para intensidad
  const intensidades = [
    'con fuerza', 'brutalmente', 'con precisión', 'violentamente', 'de forma contundente',
    'hábilmente', 'con destreza', 'salvajemente', 'despiadadamente', 'sin piedad'
  ];
  
  // Variedad de efectos según la parte del cuerpo
  const efectos: Record<string, string[]> = {
    'cabeza': [
      'dejándolo aturdido', 'casi noqueándolo', 'haciendo que vea estrellas', 
      'provocándole un mareo', 'dejándole un chichón'
    ],
    'torso': [
      'dejándolo sin aire', 'doblándolo de dolor', 'provocando que retroceda',
      'causando un dolor agudo', 'haciendo que se tambalee'
    ],
    'brazo izquierdo': [
      'entumeciendo su brazo', 'causando que pierda fuerza', 'haciendo que baje la guardia',
      'limitando su capacidad de defensa', 'causando un moretón visible'
    ],
    'brazo derecho': [
      'entumeciendo su brazo', 'causando que pierda fuerza', 'haciendo que baje la guardia',
      'limitando su capacidad de ataque', 'causando un moretón visible'
    ],
    'pierna izquierda': [
      'haciendo que se tambalee', 'provocando un dolor punzante', 'afectando su equilibrio',
      'limitando su movilidad', 'causando que se arrodille momentáneamente'
    ],
    'pierna derecha': [
      'haciendo que se tambalee', 'provocando un dolor punzante', 'afectando su equilibrio',
      'limitando su movilidad', 'causando que se arrodille momentáneamente'
    ]
  };
  
  // Obtener valores aleatorios para construir la descripción
  const verbo = verbosAtaque[Math.floor(Math.random() * verbosAtaque.length)];
  const intensidad = intensidades[Math.floor(Math.random() * intensidades.length)];
  
  // Obtener efecto según la parte del cuerpo
  const efectosParte = efectos[parteCuerpo] || [
    'causando dolor', 'provocando daño', 'dejando una marca'
  ];
  const efecto = efectosParte[Math.floor(Math.random() * efectosParte.length)];
  
  // Si hubo daño crítico o esquiva, personalizamos más la descripción
  let descripcionExtra = '';
  if (resultado?.actionResult?.critical) {
    descripcionExtra = ' ¡Ha sido un golpe crítico que causará serios problemas!';
  } else if (resultado?.actionResult?.dodged) {
    return `💨 ${defensor} esquiva ágilmente el ataque de ${atacante} dirigido a su ${parteCuerpo}!`;
  } else if (resultado?.actionResult?.blocked) {
    return `🛡️ ${defensor} bloquea hábilmente el ataque de ${atacante} dirigido a su ${parteCuerpo}!`;
  }
  
  // Construir la descripción completa
  return `💥 ${atacante} ${verbo} ${intensidad} la ${parteCuerpo} de ${defensor}, ${efecto}${descripcionExtra}`;
}

/**
 * Genera una descripción detallada de una defensa
 */
function generarDescripcionDefensa(usuario: string, oponente: string): string {
  const tiposDefensa = [
    'adopta una postura defensiva', 'se coloca en guardia', 'refuerza su defensa',
    'prepara su guardia', 'se protege', 'se pone en alerta', 'toma una posición defensiva'
  ];
  
  const estilos = [
    'cuidadosamente', 'ágilmente', 'con cautela', 'estratégicamente', 
    'sabiamente', 'con determinación', 'astutamente'
  ];
  
  const efectos = [
    'lista para contrarrestar cualquier ataque', 'anticipando los movimientos enemigos',
    'minimizando posibles daños', 'aumentando sus posibilidades de supervivencia',
    'preparándose para lo peor', 'evaluando las intenciones de su adversario',
    'calculando su próximo movimiento'
  ];
  
  const tipoDefensa = tiposDefensa[Math.floor(Math.random() * tiposDefensa.length)];
  const estilo = estilos[Math.floor(Math.random() * estilos.length)];
  const efecto = efectos[Math.floor(Math.random() * efectos.length)];
  
  return `🛡️ ${usuario} ${tipoDefensa} ${estilo}, ${efecto} contra ${oponente}.`;
}

/**
 * Genera una descripción detallada de una recuperación
 */
function generarDescripcionRecuperacion(usuario: string): string {
  const acciones = [
    'toma un momento para recuperar el aliento', 'se concentra en sanar sus heridas',
    'respira profundamente para recuperar energía', 'examina sus heridas rápidamente',
    'aplica primeros auxilios a sus lesiones', 'recupera la compostura', 
    'usa técnicas de respiración para calmarse'
  ];
  
  const metodos = [
    'con determinación', 'metódicamente', 'con urgencia', 'eficientemente',
    'con calma', 'con experiencia', 'profesionalmente'
  ];
  
  const resultados = [
    'sintiendo cómo vuelven sus fuerzas', 'notando una mejora en su estado',
    'logrando estabilizar su condición', 'reduciendo el dolor de sus heridas',
    'preparándose para continuar la lucha', 'recuperando parte de su vitalidad',
    'sintiendo un alivio inmediato'
  ];
  
  const accion = acciones[Math.floor(Math.random() * acciones.length)];
  const metodo = metodos[Math.floor(Math.random() * metodos.length)];
  const resultado = resultados[Math.floor(Math.random() * resultados.length)];
  
  return `🧪 ${usuario} ${accion} ${metodo}, ${resultado}.`;
}

/**
 * Genera una descripción para la acción de ayudar
 */
function generarDescripcionAyuda(usuario: string, objetivo: string, esResucitar: boolean): string {
  if (esResucitar) {
    const acciones = [
      'utiliza sus conocimientos para revivirlo', 'realiza maniobras de resucitación',
      'aplica técnicas ancestrales de reanimación', 'usa sus poderes curativos',
      'emplea un ritual místico de resurrección', 'aplica primeros auxilios avanzados',
      'utiliza un antiguo hechizo sanador'
    ];
    
    const metodos = [
      'con determinación', 'meticulosamente', 'con urgencia', 'con maestría',
      'con precisión', 'con esperanza', 'con energía renovada'
    ];
    
    const resultados = [
      'trayéndolo de vuelta a la vida', 'logrando estabilizar sus signos vitales',
      'permitiéndole respirar nuevamente', 'salvándolo de una muerte segura',
      'dándole una segunda oportunidad', 'rescatándolo del más allá',
      'devolviendo el aliento a su cuerpo'
    ];
    
    const accion = acciones[Math.floor(Math.random() * acciones.length)];
    const metodo = metodos[Math.floor(Math.random() * metodos.length)];
    const resultado = resultados[Math.floor(Math.random() * resultados.length)];
    
    return `✨ ${usuario} ${accion} ${metodo}, ${resultado}. ${objetivo} ha renacido con una nueva apariencia y energía.`;
  } else {
    const acciones = [
      'atiende las heridas de', 'aplica vendajes a', 'ofrece cuidados a',
      'trata las lesiones de', 'proporciona ayuda médica a', 'cura diligentemente a',
      'administra medicinas a'
    ];
    
    const metodos = [
      'con delicadeza', 'con experiencia', 'con habilidad', 'con tacto',
      'expertamente', 'cuidadosamente', 'rápidamente'
    ];
    
    const resultados = [
      'mejorando visiblemente su condición', 'aliviando su dolor',
      'cerrando sus heridas abiertas', 'deteniendo cualquier hemorragia',
      'estabilizando sus signos vitales', 'reduciendo la inflamación',
      'revitalizando su energía'
    ];
    
    const accion = acciones[Math.floor(Math.random() * acciones.length)];
    const metodo = metodos[Math.floor(Math.random() * metodos.length)];
    const resultado = resultados[Math.floor(Math.random() * resultados.length)];
    
    return `💉 ${usuario} ${accion} ${objetivo} ${metodo}, ${resultado}.`;
  }
}

// Configuración de cooldown (en milisegundos)
const COOLDOWN_TIME = 1 * 60 * 1000; // 1 minuto
const cooldowns = new Map<string, number>();

/**
 * Verifica si un usuario está en cooldown y retorna el tiempo restante en segundos
 */
function checkCooldown(userId: string): number {
  const now = Date.now();
  const lastUsed = cooldowns.get(userId);

  if (lastUsed) {
    const timeLeft = COOLDOWN_TIME - (now - lastUsed);
    if (timeLeft > 0) {
      return Math.ceil(timeLeft / 1000); // Convertir a segundos
    }
  }

  // No hay cooldown activo, actualizar el timestamp
  cooldowns.set(userId, now);
  return 0;
}

/**
 * Formatea el tiempo de cooldown en un formato legible
 */
function formatTimeLeft(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes} minuto${minutes !== 1 ? 's' : ''} y ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
}

export const data = new SlashCommandBuilder()
  .setName('bonk')
  .setDescription('Realiza acciones de combate y ayuda')
  .addSubcommand(subcommand =>
    subcommand
      .setName('golpear')
      .setDescription('Da un golpe a otro usuario')
      .addUserOption(option => 
        option
          .setName('target')
          .setDescription('Usuario a golpear')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('defender')
      .setDescription('Adopta una postura defensiva')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('recuperar')
      .setDescription('Recupera tu salud y energía')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('ayudar')
      .setDescription('Ayuda a otro usuario a curarse o resucitar')
      .addUserOption(option => 
        option
          .setName('target')
          .setDescription('Usuario al que quieres ayudar')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const userId = interaction.user.id;
    // Comprobar cooldown
    const cooldownTime = checkCooldown(userId);
    if (cooldownTime > 0) {
      await interaction.editReply({
        content: `Debes esperar ${formatTimeLeft(cooldownTime)} antes de usar este comando nuevamente.`,
      });
      return;
    }

    // Obtener el subcomando usado
    const subcommand = interaction.options.getSubcommand();
    
    // Obtener el usuario que ejecuta el comando
    let attackerChar = await Duelist.findOne({
      where: { userId: interaction.user.id },
    });

    if (!attackerChar) {
      attackerChar = await duelistService.generateRandomDuelist(
        interaction.user.id,
        interaction.user.username
      );
    }
    
    // Verificar si el usuario puede realizar acciones
    const attackerStatus = canEngageInCombat(attackerChar);
    if (!attackerStatus.canEngage) {
      await interaction.editReply(`❌ **Error:** No puedes realizar esta acción porque tu personaje ${attackerStatus.reason}. ${attackerStatus.reason !== 'ha muerto permanentemente' ? 'Debes recuperarte primero.' : ''}`);
      return;
    }

    // Obtener el target si es necesario (golpear o ayudar)
    let targetUser = null;
    let defenderChar = null;
    let esResucitar = false;
    
    if (subcommand === 'golpear' || subcommand === 'ayudar') {
      targetUser = interaction.options.getUser('target');
      
      if (!targetUser) {
        await interaction.editReply('Debes seleccionar un usuario válido');
        return;
      }
      
      if (targetUser.id === interaction.user.id && subcommand === 'golpear') {
        await interaction.editReply('No puedes golpearte a ti mismo');
        return;
      }
      
      // Obtener o crear el personaje del target
      defenderChar = await Duelist.findOne({
        where: { userId: targetUser.id },
      });

      if (!defenderChar) {
        defenderChar = await duelistService.generateRandomDuelist(
          targetUser.id,
          targetUser.username
        );
      }
      
      // Para la acción "ayudar", verificamos si el personaje está muerto para resucitarlo
      if (subcommand === 'ayudar') {
        const estaMuerto = defenderChar.conditions.includes('dead') || 
                         defenderChar.conditions.includes('permanent_death');
        
        if (estaMuerto) {
          esResucitar = true;
        } else if (targetUser.id === interaction.user.id) {
          await interaction.editReply('Para recuperarte, usa `/bonk recuperar` en su lugar');
          return;
        }
      } else {
        // Para golpear, verificar si el target puede ser golpeado
        const defenderStatus = canEngageInCombat(defenderChar);
        if (!defenderStatus.canEngage && subcommand === 'golpear') {
          await interaction.editReply(`❌ **Error:** No puedes golpear a ${targetUser.username} porque su personaje ${defenderStatus.reason}.`);
          return;
        }
      }
    }

    // Obtener las partes del cuerpo para el usuario
    const attackerBodyParts = await BodyPart.findAll({ where: { duelistId: attackerChar!.id } });
    
    // Obtener las partes del cuerpo para el target si es necesario
    let defenderBodyParts: BodyPart[] = [];
    if (defenderChar) {
      defenderBodyParts = await BodyPart.findAll({ where: { duelistId: defenderChar!.id } });
    }
    
    let resultado: any = {}; // Inicializar con objeto vacío para evitar undefined
    let descripcion = '';
    let combatIdUsado = 0;
    
    // Procesar acción según el subcomando
    switch (subcommand) {
      case 'golpear': {
        // Siempre seleccionar una parte aleatoria del cuerpo
        const parteCuerpo = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
        
        // Iniciar un combate simple
        const combat = await combatService.startCombate(attackerChar.id, defenderChar!.id);
        combatIdUsado = combat.id;
        
        // Verificar si es el turno del atacante, si no lo es, necesitamos ajustar el combate
        if (combat.currentDuelistId !== attackerChar.id) {
          // Cambiar el turno para que sea el del atacante
          combat.currentDuelistId = attackerChar.id;
          await combat.save();
        }
        
        resultado = await combatService.processTurn(
          combat.id,
          attackerChar.id,
          'attack',
          parteCuerpo
        );
        
        descripcion = generarDescripcionAtaque(
          interaction.user.toString(),
          targetUser!.toString(),
          parteCuerpo,
          resultado
        );
        break;
      }
      
      case 'defender': {
        // Iniciar un "autocombate" solo para aplicar efectos de defensa
        const combat = await combatService.startCombate(attackerChar.id, attackerChar.id);
        combatIdUsado = combat.id;
        
        // Asegurarnos que es su turno
        if (combat.currentDuelistId !== attackerChar.id) {
          combat.currentDuelistId = attackerChar.id;
          await combat.save();
        }
        
        resultado = await combatService.processTurn(
          combat.id,
          attackerChar.id,
          'defend'
        );
        
        descripcion = generarDescripcionDefensa(
          interaction.user.toString(),
          "sus enemigos"
        );
        break;
      }
      
      case 'recuperar': {
        // Iniciar un "autocombate" solo para aplicar efectos de recuperación
        const combat = await combatService.startCombate(attackerChar.id, attackerChar.id);
        combatIdUsado = combat.id;
        
        // Asegurarnos que es su turno
        if (combat.currentDuelistId !== attackerChar.id) {
          combat.currentDuelistId = attackerChar.id;
          await combat.save();
        }
        
        resultado = await combatService.processTurn(
          combat.id,
          attackerChar.id,
          'recover'
        );
        
        descripcion = generarDescripcionRecuperacion(
          interaction.user.toString()
        );
        break;
      }
      
      case 'ayudar': {
        if (esResucitar) {
          // Si el personaje está muerto, lo "resucitamos" creando uno nuevo
          await Duelist.destroy({ where: { id: defenderChar!.id } });
          
          defenderChar = await duelistService.generateRandomDuelist(
            targetUser!.id,
            targetUser!.username
          );
          
          // Obtener las nuevas partes del cuerpo
          defenderBodyParts = await BodyPart.findAll({ where: { duelistId: defenderChar!.id } });
          
          descripcion = generarDescripcionAyuda(
            interaction.user.toString(),
            targetUser!.toString(),
            true // Es resucitar
          );
        } else {
          // Mejorar la salud del personaje objetivo
          const combat = await combatService.startCombate(attackerChar.id, defenderChar!.id);
          combatIdUsado = combat.id;
          
          // Asegurarnos que es su turno
          if (combat.currentDuelistId !== attackerChar.id) {
            combat.currentDuelistId = attackerChar.id;
            await combat.save();
          }
          
          // Aplicar efectos de curación al objetivo
          // Usamos el procesamiento de turno de recuperar, pero aplicado al defensor
          defenderChar!.status.bleeding = Math.max(0, defenderChar!.status.bleeding - 30);
          defenderChar!.status.pain = Math.max(0, defenderChar!.status.pain - 30);
          defenderChar!.status.fatigue = Math.max(0, defenderChar!.status.fatigue - 30);
          defenderChar!.status.consciousness = Math.min(100, defenderChar!.status.consciousness + 30);
          
          // Recuperar un poco de salud en todas las partes del cuerpo
          for (const part of defenderBodyParts) {
            let maxHealth;
            switch (part.type) {
              case 'head': maxHealth = 60; break;
              case 'torso': maxHealth = 120; break;
              case 'arm': maxHealth = 50; break;
              case 'leg': maxHealth = 70; break;
              default: maxHealth = 100;
            }
            
            part.health = Math.min(maxHealth, part.health + 15);
            await part.save();
          }
          
          // Eliminar condiciones negativas si es posible
          const condicionesAEliminar = ['injured', 'bleeding'];
          defenderChar!.conditions = defenderChar!.conditions.filter(
            condition => !condicionesAEliminar.includes(condition)
          );
          
          await defenderChar!.save();
          
          descripcion = generarDescripcionAyuda(
            interaction.user.toString(),
            targetUser!.toString(),
            false // No es resucitar
          );
        }
        break;
      }
      
      default:
        descripcion = `🤔 Acción desconocida`;
    }
    
    // Actualizar caracteres después de la acción
    attackerChar = await Duelist.findByPk(attackerChar!.id);
    
    if (defenderChar && !esResucitar) {
      defenderChar = await Duelist.findByPk(defenderChar!.id);
    }
    
    // Actualizar las partes del cuerpo después de la acción
    const updatedAttackerBodyParts = await BodyPart.findAll({ where: { duelistId: attackerChar!.id } });
    let updatedDefenderBodyParts = defenderBodyParts;
    
    if (defenderChar) {
      updatedDefenderBodyParts = await BodyPart.findAll({ where: { duelistId: defenderChar!.id } });
    }
    
    // Crear el embed con el resultado
    const bonkEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`💥 ¡${subcommand.toUpperCase()}! 💥`)
      .setDescription(descripcion);
    
    // Agregar campos según el tipo de acción
    if (subcommand === 'golpear' || subcommand === 'ayudar') {
      bonkEmbed.addFields(
        { 
          name: `${attackerChar!.name} [${attackerChar!.race}]`, 
          value: formatDuelistStatus(attackerChar!, updatedAttackerBodyParts), 
          inline: true 
        },
        { 
          name: `${defenderChar!.name} [${defenderChar!.race}]`, 
          value: formatDuelistStatus(defenderChar!, updatedDefenderBodyParts), 
          inline: true 
        }
      );
      
      if (subcommand === 'golpear') {
        bonkEmbed.addFields(
          { 
            name: '🩹 Heridas', 
            value: `**${defenderChar!.name}**: ${formatBodyPartsHealth(updatedDefenderBodyParts)}`,
            inline: false 
          }
        );
      } else {
        // En caso de ayudar, mostramos la mejora
        bonkEmbed.addFields(
          { 
            name: '💊 Estado actual', 
            value: `**${defenderChar!.name}**: ${formatBodyPartsHealth(updatedDefenderBodyParts)}`,
            inline: false 
          }
        );
      }
    } else {
      // Para acciones personales (defender o recuperar)
      bonkEmbed.addFields(
        { 
          name: `${attackerChar!.name} [${attackerChar!.race}]`, 
          value: formatDuelistStatus(attackerChar!, updatedAttackerBodyParts), 
          inline: false 
        },
        { 
          name: '🛡️ Estado actual', 
          value: `**${attackerChar!.name}**: ${formatBodyPartsHealth(updatedAttackerBodyParts)}`,
          inline: false 
        }
      );
    }
    
    bonkEmbed.setFooter({ text: `Usa este comando de nuevo en 1 minuto` });

    // Prepara los archivos de avatar a incluir
    const files = [
      {
        attachment: interaction.user.displayAvatarURL({ size: 128 }),
        name: 'user.png',
      }
    ];
    
    if (targetUser) {
      files.push({
        attachment: targetUser.displayAvatarURL({ size: 128 }),
        name: 'target.png',
      });
    }

    // Enviar mensaje con resultado
    await interaction.editReply({
      content: resultado.actionResult?.description || descripcion,
      embeds: [bonkEmbed],
      files: files,
    });

    // Terminar el combate si se inició uno
    if (combatIdUsado > 0) {
      const combat = await Combat.findByPk(combatIdUsado);
      if (combat && combat.isActive) {
        combat.isActive = false;
        await combat.save();
      }
    }
    
  } catch (error) {
    console.error('Error en comando bonk:', error);
    // Si hay un error, eliminamos el cooldown para que el usuario pueda volver a intentarlo
    cooldowns.delete(interaction.user.id);
    await interaction.editReply('Ocurrió un error al ejecutar el comando');
  }
} 