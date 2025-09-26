import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, ComponentType } from 'discord.js';
import { DuelistService } from '../services/Duelist.service';
import { CombatService } from '../services/Combat.service';
import Duelist from '../database/models/Duelist';
import { BODY_PARTS } from '../types/Combat.type';
import Combat from '../database/models/Combat';
import BodyPart from '../database/models/BodyPart';
import { TransactionService } from '../services/Transaction.service';
import { logger } from '../utils/logger';

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

// Agregar función para formatear el estado general y condiciones del duelista
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
  } else if (duelist.conditions.includes('severe_bleeding')) {
    generalStateEmoji = '🩸';
    stateDescription = '**SANGRADO SEVERO**';
  } else if (duelist.conditions.includes('bleeding')) {
    generalStateEmoji = '🩸';
    stateDescription = '**SANGRADO**';
  } 
  
  // Verificar estados críticos en parámetros vitales
  if (duelist.status.consciousness <= 10 && !duelist.conditions.includes('permanent_death') && !duelist.conditions.includes('dead')) {
    generalStateEmoji = '😵';
    stateDescription = stateDescription || '**ATURDIDO**';
  } else if (duelist.status.pain >= 80 && !duelist.conditions.includes('permanent_death') && !duelist.conditions.includes('dead')) {
    generalStateEmoji = '😖';
    stateDescription = stateDescription || '**DOLOR EXTREMO**';
  } else if (duelist.status.fatigue >= 80 && !duelist.conditions.includes('permanent_death') && !duelist.conditions.includes('dead')) {
    generalStateEmoji = '😩';
    stateDescription = stateDescription || '**AGOTADO**';
  }
  
  // Verificar partes del cuerpo en estado crítico
  const criticalParts = bodyParts.filter(part => {
    let maxHealth;
    switch (part.type) {
      case 'head': maxHealth = 60; break;
      case 'torso': maxHealth = 120; break;
      case 'arm': maxHealth = 50; break;
      case 'leg': maxHealth = 70; break;
      default: maxHealth = 100;
    }
    return part.health <= (maxHealth * 0.1); // 10% o menos de salud
  });
  
  if (criticalParts.length > 0 && !stateDescription) {
    generalStateEmoji = '🚑';
    stateDescription = `**${criticalParts.length > 1 ? 'PARTES CRÍTICAS' : 'PARTE CRÍTICA'}**`;
  }
  
  // Agregar mensaje especial para muerte permanente
  if (duelist.conditions.includes('permanent_death')) {
    return `${generalStateEmoji} **¡MUERTO PERMANENTEMENTE!** ${generalStateEmoji}`;
  }
  
  // Mostrar solo la información que cambia durante el combate
  let statusLines = [];
  
  // Mostrar el estado general solo si no es "Estable"
  if (stateDescription) {
    statusLines.push(`${generalStateEmoji} **Estado**: ${stateDescription}`);
  }
  
  // Solo mostrar parámetros vitales si son relevantes
  let vitalInfo = [];
  
  if (duelist.status.bleeding > 10) {
    vitalInfo.push(`🩸 ${duelist.status.bleeding > 50 ? '**Sangrado**' : 'Sangrado'}: ${duelist.status.bleeding}/100`);
  }
  
  if (duelist.status.consciousness < 90) {
    vitalInfo.push(`😵 ${duelist.status.consciousness < 30 ? '**Conciencia**' : 'Conciencia'}: ${duelist.status.consciousness}/100`);
  }
  
  if (duelist.status.pain > 20) {
    vitalInfo.push(`😖 ${duelist.status.pain > 70 ? '**Dolor**' : 'Dolor'}: ${duelist.status.pain}/100`);
  }
  
  if (duelist.status.fatigue > 30) {
    vitalInfo.push(`😩 ${duelist.status.fatigue > 70 ? '**Fatiga**' : 'Fatiga'}: ${duelist.status.fatigue}/100`);
  }
  
  // Si no hay condiciones ni estados vitales significativos, mostrar un mensaje positivo
  if (statusLines.length === 0 && vitalInfo.length === 0) {
    return "✅ **Estado óptimo**";
  }
  
  // Agregar los parámetros vitales si existen
  if (vitalInfo.length > 0) {
    statusLines.push(vitalInfo.join(' | '));
  }
  
  return statusLines.join('\n');
};

// Función para crear barra visual de progreso
const getBar = (value: number, max: number) => {
  const percentage = value / max;
  if (percentage <= 0.2) return '🔴';
  if (percentage <= 0.5) return '🟠';
  if (percentage <= 0.8) return '🟡';
  return '🟢';
};

// Creamos la función formatBodyPartsHealth a nivel del módulo para evitar duplicación
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

  // Ordenar por gravedad (de mayor a menor daño)
  damagedParts.sort((a, b) => {
    let maxHealthA, maxHealthB;
    
    switch (a.type) {
      case 'head': maxHealthA = 60; break;
      case 'torso': maxHealthA = 120; break;
      case 'arm': maxHealthA = 50; break;
      case 'leg': maxHealthA = 70; break;
      default: maxHealthA = 100;
    }
    
    switch (b.type) {
      case 'head': maxHealthB = 60; break;
      case 'torso': maxHealthB = 120; break;
      case 'arm': maxHealthB = 50; break;
      case 'leg': maxHealthB = 70; break;
      default: maxHealthB = 100;
    }
    
    const percentageA = a.health / maxHealthA;
    const percentageB = b.health / maxHealthB;
    
    return percentageA - percentageB;
  });
  
  // Mostrar solo las 3 partes del cuerpo más dañadas
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

export const data = new SlashCommandBuilder()
  .setName('duel')
  .setDescription('Start a turn-based combat with another user')
  .addUserOption((option) =>
    option
      .setName('target')
      .setDescription('User to challenge')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('target');
    if (!targetUser) {
      await interaction.editReply('Debes seleccionar un usuario válido');
      return;
    }

    if (targetUser.id === interaction.user.id) {
      await interaction.editReply('No puedes desafiarte a ti mismo');
      return;
    }

    // Utilizar transacción multi-modelo para obtener toda la información necesaria
    const duelData = await TransactionService.executeMultiModelTransaction({
      // 1. Obtener o crear duelistas
      duelists: async (transaction) => {
        let attackerChar = await Duelist.findOne({
          where: { userId: interaction.user.id },
          transaction
        });

        if (!attackerChar) {
          attackerChar = await duelistService.generateRandomDuelist(
            interaction.user.id,
            interaction.user.username
          );
        }

        let defenderChar = await Duelist.findOne({
          where: { userId: targetUser.id },
          transaction
        });

        if (!defenderChar) {
          defenderChar = await duelistService.generateRandomDuelist(
            targetUser.id,
            targetUser.username
          );
        }

        // Verificar que ambos duelistas se obtuvieron correctamente
        if (!attackerChar || !defenderChar) {
          throw new Error('No se pudo obtener información de los duelistas');
        }

        return { attacker: attackerChar, defender: defenderChar };
      },
      
      // 2. Verificar estado de los personajes
      characterStatuses: async (transaction, { duelists }) => {
        const attackerStatus = canEngageInCombat(duelists.attacker);
        const defenderStatus = canEngageInCombat(duelists.defender);
        
        return { attacker: attackerStatus, defender: defenderStatus };
      },
      
      // 3. Obtener partes del cuerpo para ambos personajes
      bodyParts: async (transaction, { duelists }) => {
        const [attackerParts, defenderParts] = await Promise.all([
          BodyPart.findAll({ 
            where: { duelistId: duelists.attacker.id },
            transaction
          }),
          BodyPart.findAll({ 
            where: { duelistId: duelists.defender.id },
            transaction
          })
        ]);
        
        return { attacker: attackerParts, defender: defenderParts };
      },
      
      // 4. Iniciar combate
      combat: async (transaction, { duelists }) => {
        return await combatService.startCombate(
          duelists.attacker.id, 
          duelists.defender.id
        );
      }
    }, "Inicialización de duelo entre personajes");
    
    // Verificar si algún personaje no puede combatir
    if (!duelData.characterStatuses.attacker.canEngage) {
      await interaction.editReply(
        `❌ **Error:** No puedes iniciar un combate porque tu personaje ${duelData.characterStatuses.attacker.reason}. ${duelData.characterStatuses.attacker.reason !== 'ha muerto permanentemente' ? 'Debes recuperarte primero.' : ''}`
      );
      return;
    }

    if (!duelData.characterStatuses.defender.canEngage) {
      await interaction.editReply(
        `❌ **Error:** No puedes desafiar a ${targetUser.username} porque su personaje ${duelData.characterStatuses.defender.reason}.`
      );
      return;
    }
    
    // Formatear datos para la interfaz
    const attackerBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.attacker);
    const defenderBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.defender);
    
    // Determinar quién comienza
    const firstPlayer = duelData.combat.currentDuelistId === duelData.duelists.attacker.id 
      ? interaction.user 
      : targetUser;
    
    // Crear embed para mostrar la información del combate
    let embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`⚔️ ¡Combate iniciado! ⚔️`)
      .setDescription(`${interaction.user} ha desafiado a ${targetUser} a un duelo.`)
      .addFields(
        { 
          name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
          value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
          inline: true 
        },
        { 
          name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
          value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
          inline: true 
        },
        { name: '\u200B', value: '\u200B' },
        { 
          name: '🩹 Heridas', 
          value: `**${duelData.duelists.attacker.name}**: ${attackerBodyPartsText}\n**${duelData.duelists.defender.name}**: ${defenderBodyPartsText}`,
          inline: false 
        },
        { name: '⏱️ Turno de', value: `${firstPlayer.displayName || firstPlayer.username}`, inline: false }
      )
      .setFooter({ text: `Combate #${duelData.combat.id} - Ronda ${duelData.combat.roundCount}` });
    
    // Crear botones para acciones
    const attackButton = new ButtonBuilder()
      .setCustomId(`attack_${duelData.combat.id}`)
      .setLabel('Atacar')
      .setStyle(ButtonStyle.Danger);
      
    const defendButton = new ButtonBuilder()
      .setCustomId(`defend_${duelData.combat.id}`)
      .setLabel('Defender')
      .setStyle(ButtonStyle.Primary);
      
    const recoverButton = new ButtonBuilder()
      .setCustomId(`recover_${duelData.combat.id}`)
      .setLabel('Recuperarse')
      .setStyle(ButtonStyle.Success);
      
    const surrenderButton = new ButtonBuilder()
      .setCustomId(`surrender_${duelData.combat.id}`)
      .setLabel('Rendirse')
      .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(attackButton, defendButton, recoverButton, surrenderButton);

    // Enviar mensaje con información del combate y botones de acción
    const response = await interaction.editReply({
      content: `# ${interaction.user.displayName} ⚔️ ${targetUser.displayName}\n**Turno actual: ${firstPlayer.displayName || firstPlayer.username}**`,
      embeds: [embed],
      components: [actionRow],
      files: [
        {
          attachment: interaction.user.displayAvatarURL({ size: 128 }),
          name: 'attacker.png',
        },
        {
          attachment: targetUser.displayAvatarURL({ size: 128 }),
          name: 'defender.png',
        },
      ],
    });
    
    // Configurar colector de interacciones para los botones
    const collector = response.createMessageComponentCollector({ 
      componentType: ComponentType.Button, 
      time: 10 * 60 * 1000 // 10 minutos
    });
    
    collector.on('collect', async (i) => {
      try {
        // Obtener la instancia más reciente del combate desde la base de datos
        const updatedCombat = await Combat.findByPk(duelData.combat.id);
        if (!updatedCombat || !updatedCombat.isActive) {
          await i.reply({ 
            content: 'Este combate ya ha terminado o no existe', 
            ephemeral: true 
          });
          collector.stop();
          return;
        }
        
        // Actualizar la referencia local
        Object.assign(duelData.combat, updatedCombat);
        
        // Verificar si es el turno del usuario que hizo clic
        const currentTurnUserId = duelData.combat.currentDuelistId === duelData.duelists.attacker.id 
          ? interaction.user.id 
          : targetUser.id;
          
        if (i.user.id !== currentTurnUserId) {
          await i.reply({ 
            content: `¡No es tu turno! Es el turno de ${currentTurnUserId === interaction.user.id ? interaction.user.username : targetUser.username}`, 
            ephemeral: true 
          });
          return;
        }
        
        // Extraer acción y ID del combate para botones principales
        const [action, combatId] = i.customId.split('_');
        
        if (action === 'surrender') {
          // Manejar rendición
          const currentCharId = i.user.id === interaction.user.id ? duelData.duelists.attacker.id : duelData.duelists.defender.id;
          const result = await combatService.abandonCombat(Number(combatId), currentCharId);
          
          // Actualizar caracteres
          duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
          duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
          
          // Obtener las partes del cuerpo para cada personaje
          duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
          duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
          
          // Actualizar mensaje con resultado final
          const finalEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('¡Combate finalizado!')
            .setDescription(result.message)
            .addFields(
              { 
                name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                inline: true 
              },
              { 
                name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                inline: true 
              },
              { name: '\u200B', value: '\u200B' },
              { 
                name: '🩹 Heridas finales', 
                value: `**${duelData.duelists.attacker.name}**: ${formatBodyPartsHealth(duelData.bodyParts.attacker)}\n**${duelData.duelists.defender.name}**: ${formatBodyPartsHealth(duelData.bodyParts.defender)}`,
                inline: false 
              }
            )
            .setFooter({ text: `Combate #${result.combat.id} - ${result.combat.roundCount} rondas` });
            
          await i.update({ embeds: [finalEmbed], components: [] });
          collector.stop();
          return;
        }
        
        if (action === 'attack') {
          // Elegir una parte del cuerpo al azar
          const randomBodyPart = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
          const currentCharId = i.user.id === interaction.user.id ? duelData.duelists.attacker.id : duelData.duelists.defender.id;
          
          try {
            // Mostrar mensaje de qué parte se está atacando
            await i.update({ 
              content: `**Atacando aleatoriamente la ${randomBodyPart}...**`,
              components: [] 
            });
            
            const result = await combatService.processTurn(
              Number(combatId),
              currentCharId,
              'attack',
              randomBodyPart
            );
            
            // Verificar si el combate ha terminado
            if (result.message) {
              // Actualizar caracteres
              duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
              duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
              
              // Obtener las partes del cuerpo para la información final
              duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
              duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
              
              // Crear el embed final del combate
              const finalEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('¡Combate finalizado!')
                .setDescription(result.message)
                .addFields(
                  { 
                    name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                    value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                    inline: true 
                  },
                  { 
                    name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                    value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                    inline: true 
                  },
                  { name: '\u200B', value: '\u200B' },
                  { 
                    name: '🩹 Heridas finales', 
                    value: `**${duelData.duelists.attacker.name}**: ${formatBodyPartsHealth(duelData.bodyParts.attacker)}\n**${duelData.duelists.defender.name}**: ${formatBodyPartsHealth(duelData.bodyParts.defender)}`,
                    inline: false 
                  }
                )
                .setFooter({ text: `Combate #${result.combat.id} - ${result.combat.roundCount} rondas` });
              
              await i.editReply({ embeds: [finalEmbed], components: [] });
              collector.stop();
              return;
            }
            
            // Si el combate no ha terminado, determinar quién tiene el próximo turno
            const nextPlayer = result.combat.currentDuelistId === duelData.duelists.attacker.id 
              ? interaction.user 
              : targetUser;
            
            // Actualizar caracteres
            duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
            duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
            
            // Obtener las partes del cuerpo para cada personaje
            duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
            duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
            
            const attackerBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.attacker);
            const defenderBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.defender);
            
            const updatedEmbed = new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle(`⚔️ ¡Combate en progreso! ⚔️`)
              .setDescription(result.actionResult && result.actionResult.description ? result.actionResult.description : 'Resultado del combate')
              .addFields(
                { 
                  name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                  value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                  inline: true 
                },
                { 
                  name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                  value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                  inline: true 
                },
                { name: '\u200B', value: '\u200B' },
                { 
                  name: '🩹 Heridas', 
                  value: `**${duelData.duelists.attacker.name}**: ${attackerBodyPartsText}\n**${duelData.duelists.defender.name}**: ${defenderBodyPartsText}`,
                  inline: false 
                },
                { name: '⏱️ Turno de', value: `${nextPlayer.displayName || nextPlayer.username}`, inline: false }
              )
              .setFooter({ text: `Combate #${result.combat.id} - Ronda ${result.combat.roundCount}` });
              
              // Actualizar el embed original para futuros usos
              embed = updatedEmbed;

              await i.editReply({ 
                content: `# ${interaction.user.displayName} ⚔️ ${targetUser.displayName}\n**Turno actual: ${nextPlayer.displayName || nextPlayer.username}**`,
                embeds: [updatedEmbed], 
                components: [actionRow] 
              });
          } catch (error) {
            console.error('Error al procesar ataque:', error);
            await i.reply({ content: 'Ocurrió un error al procesar tu ataque', ephemeral: true });
          }
          return;
        }
        
        // Manejar otros tipos de acciones (defender, recuperar)
        const currentCharId = i.user.id === interaction.user.id ? duelData.duelists.attacker.id : duelData.duelists.defender.id;
        const result = await combatService.processTurn(
          Number(combatId),
          currentCharId,
          action as 'defend' | 'recover'
        );
        
        // Verificar si el combate ha terminado
        if (result.message) {
          // Actualizar caracteres
          duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
          duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
          
          // Obtener las partes del cuerpo para la información final
          duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
          duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
          
          const finalEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('¡Combate finalizado!')
            .setDescription(result.message)
            .addFields(
              { 
                name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                inline: true 
              },
              { 
                name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                inline: true 
              },
              { name: '\u200B', value: '\u200B' },
              { 
                name: '🩹 Heridas finales', 
                value: `**${duelData.duelists.attacker.name}**: ${formatBodyPartsHealth(duelData.bodyParts.attacker)}\n**${duelData.duelists.defender.name}**: ${formatBodyPartsHealth(duelData.bodyParts.defender)}`,
                inline: false 
              }
            )
            .setFooter({ text: `Combate #${result.combat.id} - ${result.combat.roundCount} rondas` });
            
          await i.update({ embeds: [finalEmbed], components: [] });
          collector.stop();
          return;
        }
        
        // Línea 317: Agregamos un log para ver lo que está pasando
        console.log(`ID currentDuelistId: ${result.combat.currentDuelistId}, attackerChar ID: ${duelData.duelists.attacker.id}, defenderChar ID: ${duelData.duelists.defender.id}`);
        
        // Verificar directamente qué personaje tiene el turno ahora
        const nextPlayer = result.combat.currentDuelistId === duelData.duelists.attacker.id 
          ? interaction.user 
          : targetUser;
          
        // Actualizar caracteres
        duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
        duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
        
        // Obtener las partes del cuerpo para cada personaje
        duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
        duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
        
        const attackerBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.attacker);
        const defenderBodyPartsText = formatBodyPartsHealth(duelData.bodyParts.defender);
        
        const updatedEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(`⚔️ ¡Combate en progreso! ⚔️`)
          .setDescription(result.actionResult && result.actionResult.description ? result.actionResult.description : 'Resultado del combate')
          .addFields(
            { 
              name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
              value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
              inline: true 
            },
            { 
              name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
              value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
              inline: true 
            },
            { name: '\u200B', value: '\u200B' },
            { 
              name: '🩹 Heridas', 
              value: `**${duelData.duelists.attacker.name}**: ${attackerBodyPartsText}\n**${duelData.duelists.defender.name}**: ${defenderBodyPartsText}`,
              inline: false 
            },
            { name: '⏱️ Turno de', value: `${nextPlayer.displayName || nextPlayer.username}`, inline: false }
          )
          .setFooter({ text: `Combate #${result.combat.id} - Ronda ${result.combat.roundCount}` });
          
          // Actualizar el embed original para futuros usos
          embed = updatedEmbed;

          await i.update({ 
            embeds: [updatedEmbed], 
            content: `# ${interaction.user.displayName} ⚔️ ${targetUser.displayName}\n**Turno actual: ${nextPlayer.displayName || nextPlayer.username}**`,
            components: [actionRow] 
          });
      } catch (error) {
        console.error('Error en interacción de botón:', error);
        if (!i.replied && !i.deferred) {
          await i.reply({ content: 'Ocurrió un error al procesar tu acción', ephemeral: true });
        }
      }
    });
    
    collector.on('end', async () => {
      try {
        // Verificar el estado actual del combate en la base de datos
        const updatedCombat = await Combat.findByPk(duelData.combat.id);
        
        // Si el combate ya no existe o ya estaba finalizado, no hacemos nada
        if (!updatedCombat) {
          return;
        }
        
        // Actualizar caracteres para tener la información más reciente
        duelData.duelists.attacker = await Duelist.findByPk(duelData.duelists.attacker.id);
        duelData.duelists.defender = await Duelist.findByPk(duelData.duelists.defender.id);
        
        // Obtener las partes del cuerpo actualizadas
        duelData.bodyParts.attacker = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
        duelData.bodyParts.defender = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
        
        // Si el combate ya no está activo, obtener la razón real de finalización
        if (!updatedCombat.isActive) {
          // Obtener el último mensaje del log de combate para saber cómo terminó
          const combatLog = updatedCombat.combatLog;
          const lastMessage = combatLog[combatLog.length - 1] || '';
          
          // Crear embed con la información real
          const finalEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('¡Combate finalizado!')
            .setDescription(lastMessage)
            .addFields(
              { 
                name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                inline: true 
              },
              { 
                name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                inline: true 
              },
              { name: '\u200B', value: '\u200B' },
              { 
                name: '🩹 Heridas finales', 
                value: `**${duelData.duelists.attacker.name}**: ${formatBodyPartsHealth(duelData.bodyParts.attacker)}\n**${duelData.duelists.defender.name}**: ${formatBodyPartsHealth(duelData.bodyParts.defender)}`,
                inline: false 
              }
            )
            .setFooter({ text: `Combate #${updatedCombat.id} - ${updatedCombat.roundCount} rondas` });
            
          await interaction.editReply({ embeds: [finalEmbed], components: [] });
        } else {
          // Si el combate sigue activo pero el colector expiró, se abandonó por inactividad
          // Marcar el combate como inactivo en la base de datos
          updatedCombat.isActive = false;
          updatedCombat.combatLog = [
            ...updatedCombat.combatLog,
            'El combate ha sido abandonado por inactividad.'
          ];
          await updatedCombat.save();
          
          // Actualizar mensaje con información de abandono
          const timeoutEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('¡Combate abandonado!')
            .setDescription('El combate ha sido abandonado por inactividad.')
            .addFields(
              { 
                name: `${duelData.duelists.attacker.name} [${duelData.duelists.attacker.race}]`, 
                value: formatDuelistStatus(duelData.duelists.attacker, duelData.bodyParts.attacker), 
                inline: true 
              },
              { 
                name: `${duelData.duelists.defender.name} [${duelData.duelists.defender.race}]`, 
                value: formatDuelistStatus(duelData.duelists.defender, duelData.bodyParts.defender), 
                inline: true 
              },
              { name: '\u200B', value: '\u200B' },
              { 
                name: '🩹 Heridas finales', 
                value: `**${duelData.duelists.attacker.name}**: ${formatBodyPartsHealth(duelData.bodyParts.attacker)}\n**${duelData.duelists.defender.name}**: ${formatBodyPartsHealth(duelData.bodyParts.defender)}`,
                inline: false 
              }
            )
            .setFooter({ text: `Combate #${updatedCombat.id} - ${updatedCombat.roundCount} rondas` });
            
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        }
      } catch (error) {
        console.error('Error al finalizar combate:', error);
        try {
          // Intentar obtener datos actualizados para el mensaje de error
          const latestAttackerChar = await Duelist.findByPk(duelData.duelists.attacker.id);
          const latestDefenderChar = await Duelist.findByPk(duelData.duelists.defender.id);
          const latestAttackerBodyParts = await BodyPart.findAll({ where: { duelistId: duelData.duelists.attacker.id } });
          const latestDefenderBodyParts = await BodyPart.findAll({ where: { duelistId: duelData.duelists.defender.id } });
          
          // En caso de error, mostrar mensaje genérico
          const errorEmbed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('¡Combate finalizado!')
            .setDescription('El combate ha finalizado.')
            .addFields(
              { 
                name: `${latestAttackerChar!.name} [${latestAttackerChar!.race}]`, 
                value: formatDuelistStatus(latestAttackerChar!, latestAttackerBodyParts), 
                inline: true 
              },
              { 
                name: `${latestDefenderChar!.name} [${latestDefenderChar!.race}]`, 
                value: formatDuelistStatus(latestDefenderChar!, latestDefenderBodyParts), 
                inline: true 
              },
              { name: '\u200B', value: '\u200B' },
              { 
                name: '🩹 Heridas finales', 
                value: `**${latestAttackerChar!.name}**: ${formatBodyPartsHealth(latestAttackerBodyParts)}\n**${latestDefenderChar!.name}**: ${formatBodyPartsHealth(latestDefenderBodyParts)}`,
                inline: false 
              }
            )
            .setFooter({ text: `Combate finalizado` });
            
          await interaction.editReply({ embeds: [errorEmbed], components: [] });
        } catch (finalError) {
          // Si falla todo, mostrar un mensaje muy simple
          console.error('Error crítico al crear embed de error:', finalError);
          await interaction.editReply('El combate ha finalizado debido a un error.');
        }
      }
    });
  } catch (error) {
    console.error('Error en comando duel:', error);
    await interaction.editReply('Ocurrió un error al ejecutar el duelo');
  }
}
