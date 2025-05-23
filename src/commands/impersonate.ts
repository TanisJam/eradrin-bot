import { 
  CommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  TextChannel, 
  ChannelType,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { logger } from '../utils/logger';
import ImpersonationCharacter from '../database/models/ImpersonationCharacter';
import User from '../database/models/User';

/**
 * Comando impersonate - Gestiona personajes de impersonación y envía mensajes con ellos
 */
export const data = new SlashCommandBuilder()
  .setName('impersonate')
  .setDescription('Impersona a un personaje para enviar mensajes')
  .addSubcommand(subcommand =>
    subcommand
      .setName('say')
      .setDescription('Envía un mensaje con el personaje seleccionado/guardado')
      .addStringOption(option => 
        option.setName('mensaje')
          .setDescription('El mensaje que quieres enviar con tu personaje')
          .setRequired(true)
      )
  )
  .addSubcommandGroup(group => 
    group
      .setName('character')
      .setDescription('Gestiona tus personajes de impersonación (máximo 5)')
      .addSubcommand(subcommand => 
        subcommand
          .setName('load')
          .setDescription('Carga un nuevo personaje (reemplaza el más antiguo si tienes 5)')
          .addStringOption(option => 
            option.setName('nombre')
              .setDescription('El nombre del personaje')
              .setRequired(true)
          )
          .addStringOption(option => 
            option.setName('imagen')
              .setDescription('URL de la imagen del personaje')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand => 
        subcommand
          .setName('select')
          .setDescription('Selecciona un personaje para usar en tus mensajes')
      )
      .addSubcommand(subcommand => 
        subcommand
          .setName('delete')
          .setDescription('Elimina un personaje guardado de tu colección')
      )
  )
  // Limitamos el comando a personas con permiso para gestionar webhooks
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks);

/**
 * Implementación del comando impersonate
 */
export async function execute(interaction: CommandInteraction) {
  try {
    // Verificar que estamos en un canal de texto
    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await interaction.reply({ 
        content: '❌ Este comando solo puede ser usado en un canal de texto.', 
        ephemeral: true 
      });
      return;
    }

    const userId = interaction.user.id;
    const subcommandGroup = (interaction.options as any).getSubcommandGroup(false);
    const subcommand = (interaction.options as any).getSubcommand();

    // Asegurarse de que el usuario existe en la base de datos
    const [user] = await User.findOrCreate({
      where: { id: userId },
      defaults: {
        id: userId,
        nickName: interaction.user.username,
        lastPing: new Date()
      }
    });

    // Procesar el subcomando 'say' directamente
    if (subcommand === 'say') {
      const mensaje = (interaction.options as any).getString('mensaje');
      await sendMessageWithSelectedCharacter(interaction, userId, mensaje);
      return;
    }

    // Procesar los subcomandos bajo 'character'
    if (subcommandGroup === 'character') {
      switch (subcommand) {
        case 'load':
          await handleLoadCharacter(interaction, userId);
          break;
        case 'select':
          await handleSelectCharacter(interaction, userId);
          break;
        case 'delete':
          await handleDeleteCharacter(interaction, userId);
          break;
        default:
          await interaction.reply({
            content: '❌ Subcomando no reconocido.',
            ephemeral: true
          });
      }
    }
  } catch (error) {
    logger.error('Error en comando impersonate:', error);
    await interaction.reply({
      content: '❌ Ha ocurrido un error al procesar el comando. Por favor, inténtalo de nuevo más tarde.',
      ephemeral: true
    });
  }
}

/**
 * Envía un mensaje utilizando el personaje seleccionado
 */
async function sendMessageWithSelectedCharacter(interaction: CommandInteraction, userId: string, mensaje: string) {
  try {
    // Verificar primero si el usuario tiene algún personaje
    const hasAnyCharacter = await ImpersonationCharacter.count({
      where: { userId }
    });

    if (hasAnyCharacter === 0) {
      await interaction.reply({
        content: '⚠️ No tienes ningún personaje guardado. Usa `/impersonate character load` para crear uno antes de enviar mensajes.',
        ephemeral: true
      });
      return;
    }

    // Buscar el personaje seleccionado
    const selectedCharacter = await ImpersonationCharacter.findOne({
      where: { 
        userId, 
        isSelected: true 
      }
    });

    // Si no hay personaje seleccionado, buscar el último creado
    if (!selectedCharacter) {
      const lastCharacter = await ImpersonationCharacter.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      // Marcar el último personaje como seleccionado y usarlo
      if (lastCharacter) {
        await lastCharacter.update({ isSelected: true });
        await sendMessageWithWebhook(interaction, lastCharacter.name, lastCharacter.imageUrl, mensaje);
      } else {
        // Este caso no debería ocurrir debido a la verificación anterior, pero lo incluimos por seguridad
        await interaction.reply({
          content: '❌ Error: No se pudo encontrar ningún personaje. Usa `/impersonate character load` para crear uno.',
          ephemeral: true
        });
      }
    } else {
      // Enviar mensaje con el personaje seleccionado
      await sendMessageWithWebhook(interaction, selectedCharacter.name, selectedCharacter.imageUrl, mensaje);
    }
  } catch (error) {
    logger.error('Error al enviar mensaje con personaje:', error);
    await interaction.reply({
      content: 'Hubo un error al enviar el mensaje.',
      ephemeral: true
    });
  }
}

/**
 * Envía un mensaje usando un webhook
 */
async function sendMessageWithWebhook(interaction: CommandInteraction, name: string, imageUrl: string, message: string) {
  const textChannel = interaction.channel as TextChannel;

  // Responder para que la interacción no falle
  await interaction.reply({
    content: '🔄 Enviando mensaje...',
    ephemeral: true
  });

  try {
    // Crear un webhook temporal
    const webhook = await textChannel.createWebhook({
      name: 'Mensaje Temporal',
      avatar: 'https://i.imgur.com/AfFp7pu.png'
    });

    // Usar el webhook para enviar el mensaje
    await webhook.send({
      content: message,
      username: name,
      avatarURL: imageUrl
    });

    // Eliminar el webhook después de usarlo
    await webhook.delete();

    // Editar la respuesta original para confirmar
    await interaction.editReply({
      content: '✅ ¡Mensaje enviado con éxito como **' + name + '**!'
    });
  } catch (error) {
    logger.error('Error al crear o usar webhook:', error);
    await interaction.editReply({
      content: '❌ Hubo un error al enviar el mensaje. Verifica que la URL de la imagen sea válida y accesible para Discord.'
    });
  }
}

/**
 * Maneja la carga de un nuevo personaje
 */
async function handleLoadCharacter(interaction: CommandInteraction, userId: string) {
  const nombre = (interaction.options as any).getString('nombre');
  const imageUrl = (interaction.options as any).getString('imagen');

  try {
    // Validar URL de imagen (básico)
    if (!imageUrl.startsWith('http')) {
      await interaction.reply({
        content: '❌ La URL de imagen debe comenzar con http:// o https://',
        ephemeral: true
      });
      return;
    }

    // Obtener todos los personajes del usuario
    const characters = await ImpersonationCharacter.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']] // Ordenados por más reciente primero
    });

    // Si ya tiene 5 o más personajes, reemplazar el más antiguo
    if (characters.length >= 5) {
      // Ordenar por fecha de creación, el más antiguo primero
      const oldestCharacter = await ImpersonationCharacter.findOne({
        where: { userId },
        order: [['createdAt', 'ASC']]
      });

      if (oldestCharacter) {
        // Guardar el nombre antes de la actualización
        const oldCharacterName = oldestCharacter.name;
        
        // Deseleccionar todos los personajes
        await ImpersonationCharacter.update(
          { isSelected: false },
          { where: { userId } }
        );

        // Actualizar el personaje más antiguo
        await oldestCharacter.update({
          name: nombre,
          imageUrl: imageUrl,
          isSelected: true
        });

        await interaction.reply({
          content: `✅ Personaje **${nombre}** cargado y seleccionado (reemplazando a **${oldCharacterName}** que era el más antiguo).`,
          ephemeral: true
        });
        return;
      }
    }

    // Deseleccionar todos los personajes
    await ImpersonationCharacter.update(
      { isSelected: false },
      { where: { userId } }
    );

    // Encontrar un slot disponible
    const usedSlots = characters.map(c => c.slotNumber);
    let newSlot = 1;
    while (usedSlots.includes(newSlot) && newSlot <= 5) {
      newSlot++;
    }

    // Si todos los slots están ocupados pero tenemos menos de 5 personajes
    // (puede pasar si se han eliminado personajes), usar el siguiente número
    if (newSlot > 5) {
      newSlot = characters.length + 1;
    }

    // Crear un nuevo personaje
    await ImpersonationCharacter.create({
      userId,
      name: nombre,
      imageUrl: imageUrl,
      slotNumber: newSlot,
      isSelected: true
    });

    await interaction.reply({
      content: `✅ Personaje **${nombre}** cargado y seleccionado en el slot ${newSlot}.\nPuedes enviar mensajes con él usando \`/impersonate say\`.`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error al cargar personaje:', error);
    await interaction.reply({
      content: '❌ Ha ocurrido un error al cargar el personaje. Verifica que la URL de imagen sea válida y esté accesible.',
      ephemeral: true
    });
  }
}

/**
 * Maneja la selección de un personaje usando menú desplegable
 */
async function handleSelectCharacter(interaction: CommandInteraction, userId: string) {
  try {
    const characters = await ImpersonationCharacter.findAll({
      where: { userId },
      order: [['slotNumber', 'ASC']]
    });

    if (characters.length === 0) {
      await interaction.reply({
        content: 'No tienes personajes guardados. Usa `/impersonate character load` para crear uno.',
        ephemeral: true
      });
      return;
    }

    // Crear menú desplegable con los personajes
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_character')
      .setPlaceholder('Selecciona un personaje')
      .addOptions(
        characters.map(character => 
          new StringSelectMenuOptionBuilder()
            .setLabel(character.name)
            .setDescription(`Slot ${character.slotNumber}`)
            .setValue(character.id.toString())
            .setDefault(character.isSelected)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // Mostrar embed con la lista de personajes
    const embed = new EmbedBuilder()
      .setTitle('Selecciona un personaje')
      .setColor(0x0099FF)
      .setDescription('Estos son tus personajes guardados:');

    characters.forEach(character => {
      embed.addFields({
        name: `${character.isSelected ? '✅ ' : ''}${character.name}`,
        value: `[Ver imagen](${character.imageUrl})`
      });
    });

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    // Esperar respuesta del menú
    try {
      const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect, 
        time: 60000 
      });

      collector.on('collect', async i => {
        const selectedId = parseInt(i.values[0]);

        // Deseleccionar todos los personajes
        await ImpersonationCharacter.update(
          { isSelected: false },
          { where: { userId } }
        );

        // Seleccionar el personaje elegido
        await ImpersonationCharacter.update(
          { isSelected: true },
          { where: { id: selectedId } }
        );

        const selectedCharacter = await ImpersonationCharacter.findByPk(selectedId);

        await i.update({
          content: `Has seleccionado: ${selectedCharacter?.name}`,
          embeds: [],
          components: []
        });
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await interaction.editReply({
            content: 'Selección de personaje cancelada.',
            embeds: [],
            components: []
          });
        }
      });
    } catch (error) {
      logger.error('Error en el collector:', error);
    }
  } catch (error) {
    logger.error('Error al mostrar personajes:', error);
    await interaction.reply({
      content: 'Ha ocurrido un error al mostrar tus personajes.',
      ephemeral: true
    });
  }
}

/**
 * Maneja la eliminación de un personaje
 */
async function handleDeleteCharacter(interaction: CommandInteraction, userId: string) {
  try {
    const characters = await ImpersonationCharacter.findAll({
      where: { userId },
      order: [['slotNumber', 'ASC']]
    });

    if (characters.length === 0) {
      await interaction.reply({
        content: 'No tienes personajes guardados para eliminar.',
        ephemeral: true
      });
      return;
    }

    // Crear menú desplegable con los personajes
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('delete_character')
      .setPlaceholder('Selecciona un personaje para eliminar')
      .addOptions(
        characters.map(character => 
          new StringSelectMenuOptionBuilder()
            .setLabel(character.name)
            .setDescription(`Slot ${character.slotNumber}`)
            .setValue(character.id.toString())
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    // Mostrar lista de personajes
    const embed = new EmbedBuilder()
      .setTitle('Eliminar personaje')
      .setColor(0xFF0000)
      .setDescription('Selecciona el personaje que quieres eliminar:');

    characters.forEach(character => {
      embed.addFields({
        name: `${character.isSelected ? '✅ ' : ''}${character.name}`,
        value: `Slot ${character.slotNumber}`
      });
    });

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    // Esperar respuesta del menú
    try {
      const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect, 
        time: 60000 
      });

      collector.on('collect', async i => {
        const selectedId = parseInt(i.values[0]);
        const character = await ImpersonationCharacter.findByPk(selectedId);
        const wasSelected = character?.isSelected;
        const characterName = character?.name;
        const deletedSlot = character?.slotNumber;

        // Eliminar el personaje
        await character?.destroy();

        // Reorganizar los slots para evitar huecos
        if (deletedSlot) {
          await reorganizeSlots(userId);
        }

        // Si el personaje era el seleccionado, seleccionar otro automáticamente
        if (wasSelected) {
          const newSelected = await ImpersonationCharacter.findOne({
            where: { userId },
            order: [['createdAt', 'DESC']]
          });

          if (newSelected) {
            await newSelected.update({ isSelected: true });
          }
        }

        await i.update({
          content: `Has eliminado el personaje: ${characterName}`,
          embeds: [],
          components: []
        });
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await interaction.editReply({
            content: 'Eliminación de personaje cancelada.',
            embeds: [],
            components: []
          });
        }
      });
    } catch (error) {
      logger.error('Error en el collector:', error);
    }
  } catch (error) {
    logger.error('Error al mostrar personajes para eliminar:', error);
    await interaction.reply({
      content: 'Ha ocurrido un error al procesar tu solicitud.',
      ephemeral: true
    });
  }
}

/**
 * Reorganiza los números de slot para evitar huecos
 */
async function reorganizeSlots(userId: string) {
  try {
    // Obtener todos los personajes ordenados por slot
    const characters = await ImpersonationCharacter.findAll({
      where: { userId },
      order: [['slotNumber', 'ASC']]
    });

    // Reasignar slots de forma consecutiva
    for (let i = 0; i < characters.length; i++) {
      const newSlot = i + 1;
      if (characters[i].slotNumber !== newSlot) {
        await characters[i].update({ slotNumber: newSlot });
      }
    }

    logger.debug(`Slots reorganizados para usuario ${userId}`);
  } catch (error) {
    logger.error('Error al reorganizar slots:', error);
  }
} 