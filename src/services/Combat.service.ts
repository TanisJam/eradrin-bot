import Combat from '../database/models/Combat';
import Character from '../database/models/Character';
import { CharacterService } from './Character.service';
import { BaseService } from './BaseService';
import { AttackResult } from '../types/Combat.type';
import { getAiModel } from '../ai-model';
import { Op } from 'sequelize';
import BodyPart from '../database/models/BodyPart';

// Constantes para umbrales críticos
const THRESHOLDS = {
  BLEEDING: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  PAIN: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  CONSCIOUSNESS: {
    CRITICAL: 10,
    LOW: 30,
    MEDIUM: 60,
    HIGH: 90
  },
  FATIGUE: {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  },
  BODY_PART: {
    UNUSABLE: 15,  // Parte casi inutilizable
    CRITICAL: 5    // Parte en estado crítico
  }
};

// Nuevo tipo para representar los estados de un personaje
export type CharacterCondition = 
  | 'ok'                // Estado normal
  | 'bleeding'          // Sangrado significativo
  | 'severe_bleeding'   // Sangrado severo
  | 'hemorrhage'        // Hemorragia crítica
  | 'injured'           // Heridas leves
  | 'severely_injured'  // Heridas graves
  | 'incapacitated'     // Incapacitado (no puede atacar)
  | 'unconscious'       // Inconsciente (no puede actuar en absoluto)
  | 'dying'             // Muriendo (requiere atención urgente)
  | 'dead'              // Muerto
  | 'defending'         // Estado temporal: defendiéndose
  | 'recovering';       // Estado temporal: recuperándose

/**
 * Servicio para gestionar combates por turnos
 */
export class CombatService extends BaseService {
  private characterService: CharacterService;
  private readonly COMBAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inactividad para terminar combate
  
  private readonly systemInstruction =
    'Eres un narrador de combates al estilo Dwarf Fortress. Te daré una descripción básica de un ataque y debes transformarla ' +
    'en una descripción breve del daño físico causado. ' +
    'Incluye detalles anatómicos precisos y específicos de ser nesesarios. ' +
    'La descripción debe ser muy concisa (máximo 1-2 líneas) y añadir 1-2 emojis relacionados con el tipo de daño. ' +
    'Usa un lenguaje directo pero vívido que capture la esencia brutal de Dwarf Fortress. ' +
    'Ejemplo: "🦴💥 El impacto fractura el cráneo de X, enviando esquirlas de hueso al cerebro mientras la sangre brota por sus oídos."';

  private readonly aiModel;
  
  private readonly generationConfig = {
    temperature: 0.9,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 256,
  };

  constructor() {
    super('CombatService');
    this.characterService = new CharacterService();
    this.aiModel = getAiModel(this.systemInstruction);
  }

  /**
   * Inicia un nuevo combate entre dos personajes
   */
  async startCombate(attackerId: number, defenderId: number): Promise<Combat> {
    try {
      this.logDebug(`Iniciando combate entre ${attackerId} y ${defenderId}`);
      
      // Comprobar si ya existe un combate activo entre estos personajes
      const existingCombat = await Combat.findOne({
        where: {
          isActive: true,
          attackerId,
          defenderId,
        },
      });

      if (existingCombat) {
        this.logInfo(`Combate ya existente: ${existingCombat.id}`);
        return existingCombat;
      }

      // Determinar quién empieza (basado en agilidad o alguna estadística)
      const attacker = await Character.findByPk(attackerId);
      const defender = await Character.findByPk(defenderId);
      
      if (!attacker || !defender) {
        throw new Error('Personaje no encontrado');
      }

      // Iniciar con personaje más ágil o aleatorio si son iguales
      const starterCharacterId = 
        (attacker.stats.agility || 10) > (defender.stats.agility || 10) 
          ? attackerId 
          : defenderId;

      const combat = await Combat.create({
        attackerId,
        defenderId,
        currentCharacterId: starterCharacterId,
        lastActionTimestamp: new Date(),
        combatLog: [`¡Combate iniciado entre ${attacker.name} y ${defender.name}!`]
      });

      this.logInfo(`Nuevo combate creado: ${combat.id}`);
      return combat;
    } catch (error) {
      return this.handleError(error, `Error al iniciar combate`);
    }
  }

  /**
   * Aplica efectos por sangrado al inicio del turno
   * Retorna un objeto con la descripción y si el personaje ha muerto
   */
  private async applyBleedingEffects(character: Character): Promise<{ description: string, isDead: boolean }> {
    if (character.status.bleeding <= THRESHOLDS.BLEEDING.LOW) {
      return { description: '', isDead: false };
    }

    let bleedingDamage = 0;
    let description = '';
    let isDead = false;

    // Calcular daño por sangrado
    if (character.status.bleeding >= THRESHOLDS.BLEEDING.CRITICAL) {
      bleedingDamage = 10; // Daño extremo por hemorragia crítica
      description = `🩸 ${character.name} sufre una hemorragia masiva, perdiendo grandes cantidades de sangre.`;
      
      // Reducir consciencia significativamente
      character.status.consciousness = Math.max(0, character.status.consciousness - 15);
      
      // Posibilidad de muerte
      if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.CRITICAL) {
        description += ` Con el pulso debilitándose, ${character.name} está al borde de la muerte por desangramiento.`;
        isDead = Math.random() < 0.25; // 25% de probabilidad de morir por turno con hemorragia crítica
        
        if (isDead) {
          description += ` 💀 Finalmente, ${character.name} sucumbe a sus heridas, sin poder detener la pérdida de sangre.`;
          character.status.consciousness = 0;
          
          // Agregar condición de muerto
          character.conditions = [...character.conditions.filter(c => c !== 'dying'), 'dead'];
        } else {
          character.conditions = [...character.conditions.filter(c => 
            c !== 'ok' && c !== 'bleeding' && c !== 'severe_bleeding'), 'hemorrhage', 'dying'];
        }
      }
    } else if (character.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      bleedingDamage = 6; // Daño severo
      description = `🩸 ${character.name} pierde mucha sangre, debilitándose visiblemente con cada movimiento.`;
      character.status.consciousness = Math.max(0, character.status.consciousness - 8);
      character.conditions = [...character.conditions.filter(c => 
        c !== 'ok' && c !== 'bleeding'), 'severe_bleeding'];
    } else if (character.status.bleeding >= THRESHOLDS.BLEEDING.MEDIUM) {
      bleedingDamage = 3; // Daño moderado
      description = `🩸 ${character.name} sigue sangrando, su piel palidece.`;
      character.status.consciousness = Math.max(0, character.status.consciousness - 4);
      character.conditions = [...character.conditions.filter(c => c !== 'ok'), 'bleeding'];
    } else {
      bleedingDamage = 1; // Daño leve
      description = `🩸 ${character.name} tiene un sangrado leve pero constante.`;
      character.conditions = [...character.conditions.filter(c => c !== 'ok'), 'bleeding'];
    }

    // Aplicar daño a la salud general
    character.health = Math.max(0, character.health - bleedingDamage);
    
    // Incrementar el valor de sangrado gradualmente si es alto (simula empeorar)
    if (character.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      character.status.bleeding = Math.min(100, character.status.bleeding + 3);
    }
    
    await character.save();
    return { description, isDead };
  }

  /**
   * Evalúa si un personaje está incapacitado o inconsciente basado en sus estados
   */
  private evaluateCharacterCondition(character: Character, bodyParts: BodyPart[]): string {
    // Verificar estado de inconsciencia por niveles bajos de consciencia
    if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.CRITICAL) {
      return `${character.name} está inconsciente y no puede actuar.`;
    }
    
    // Verificar incapacitación por dolor extremo
    if (character.status.pain >= THRESHOLDS.PAIN.CRITICAL) {
      return `${character.name} está completamente incapacitado por el dolor extremo.`;
    }
    
    // Verificar incapacitación por fatiga extrema
    if (character.status.fatigue >= THRESHOLDS.FATIGUE.CRITICAL) {
      return `${character.name} está demasiado agotado para continuar luchando.`;
    }
    
    // Verificar incapacitación por daño a partes críticas
    // Comprobar si la cabeza o el torso están en estado crítico
    const criticalParts = bodyParts.filter(part => 
      (part.type === 'head' || part.type === 'torso') && 
      part.health <= THRESHOLDS.BODY_PART.CRITICAL
    );
    
    if (criticalParts.length > 0) {
      return `${character.name} está gravemente herido en ${criticalParts.map(p => p.name).join(' y ')} y no puede continuar.`;
    }
    
    // Comprobar movilidad - si ambas piernas están inutilizables
    const legs = bodyParts.filter(part => part.type === 'leg');
    if (legs.length >= 2 && legs.every(leg => leg.health <= THRESHOLDS.BODY_PART.UNUSABLE)) {
      return `${character.name} no puede moverse con ambas piernas gravemente dañadas.`;
    }
    
    // Comprobar capacidad de ataque - si ambos brazos están inutilizables
    const arms = bodyParts.filter(part => part.type === 'arm');
    if (arms.length >= 2 && arms.every(arm => arm.health <= THRESHOLDS.BODY_PART.UNUSABLE)) {
      return `${character.name} no puede atacar con ambos brazos gravemente dañados.`;
    }
    
    return ''; // No hay incapacitación
  }

  /**
   * Aplica modificadores al ataque basados en el estado del personaje
   */
  private getAttackModifier(character: Character, bodyParts: BodyPart[]): { 
    modifier: number, 
    description: string 
  } {
    let modifier = 1.0; // Valor base
    let reasons: string[] = [];
    
    // Modificador por dolor
    if (character.status.pain >= THRESHOLDS.PAIN.HIGH) {
      modifier *= 0.6; // -40% de efectividad
      reasons.push("dolor intenso");
    } else if (character.status.pain >= THRESHOLDS.PAIN.MEDIUM) {
      modifier *= 0.75; // -25% de efectividad
      reasons.push("dolor moderado");
    }
    
    // Modificador por fatiga
    if (character.status.fatigue >= THRESHOLDS.FATIGUE.HIGH) {
      modifier *= 0.7; // -30% de efectividad
      reasons.push("fatiga extrema");
    } else if (character.status.fatigue >= THRESHOLDS.FATIGUE.MEDIUM) {
      modifier *= 0.85; // -15% de efectividad
      reasons.push("fatiga moderada");
    }
    
    // Modificador por consciencia
    if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.LOW) {
      modifier *= 0.6; // -40% de efectividad
      reasons.push("aturdimiento");
    } else if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.MEDIUM) {
      modifier *= 0.8; // -20% de efectividad
      reasons.push("mareo");
    }
    
    // Modificador por partes del cuerpo dañadas
    const arms = bodyParts.filter(part => part.type === 'arm');
    
    // Verificar brazos dañados (afectan a la capacidad de ataque)
    const damagedArms = arms.filter(arm => arm.health <= 30);
    if (damagedArms.length > 0) {
      if (damagedArms.length === arms.length) {
        // Todos los brazos dañados
        modifier *= 0.6; // -40% de efectividad
        reasons.push("brazos gravemente heridos");
      } else {
        // Al menos un brazo dañado
        modifier *= 0.8; // -20% de efectividad
        reasons.push("brazo herido");
      }
    }
    
    let description = '';
    if (reasons.length > 0) {
      description = `${character.name} ataca con dificultad debido a ${reasons.join(' y ')}.`;
    }
    
    return { modifier, description };
  }

  /**
   * Procesa un turno de ataque en el combate
   */
  async processTurn(
    combatId: number, 
    characterId: number, 
    actionType: 'attack' | 'defend' | 'recover',
    targetBodyPart?: string
  ) {
    try {
      const combat = await Combat.findByPk(combatId);
      if (!combat) {
        throw new Error('Combate no encontrado');
      }

      if (!combat.isActive) {
        throw new Error('Este combate ya ha terminado');
      }

      // Verificar si es el turno del personaje
      if (combat.currentCharacterId !== characterId) {
        throw new Error('No es tu turno para actuar');
      }

      // Obtener los personajes involucrados
      const attackerChar = await Character.findByPk(combat.attackerId);
      const defenderChar = await Character.findByPk(combat.defenderId);
      
      if (!attackerChar || !defenderChar) {
        throw new Error('Personaje no encontrado');
      }

      // Log de estadísticas antes de la acción
      this.logDebug(`========= STATS ANTES DE LA ACCIÓN (${actionType}) =========`);
      this.logDebug(`Atacante (${attackerChar.name}):`);
      this.logDebug(`  Health: ${attackerChar.health}`);
      this.logDebug(`  Stats: ${JSON.stringify(attackerChar.stats)}`);
      this.logDebug(`  Status: ${JSON.stringify(attackerChar.status)}`);
      this.logDebug(`Defensor (${defenderChar.name}):`);
      this.logDebug(`  Health: ${defenderChar.health}`);
      this.logDebug(`  Stats: ${JSON.stringify(defenderChar.stats)}`);
      this.logDebug(`  Status: ${JSON.stringify(defenderChar.status)}`);
      
      // Obtener partes del cuerpo
      const attackerBodyParts = await BodyPart.findAll({ where: { characterId: attackerChar.id } });
      const defenderBodyParts = await BodyPart.findAll({ where: { characterId: defenderChar.id } });
      
      this.logDebug('Partes del cuerpo del atacante:');
      attackerBodyParts.forEach(part => {
        this.logDebug(`  ${part.name}: ${part.health}/100`);
      });
      
      this.logDebug('Partes del cuerpo del defensor:');
      defenderBodyParts.forEach(part => {
        this.logDebug(`  ${part.name}: ${part.health}/100 ${part.name === targetBodyPart ? '(OBJETIVO)' : ''}`);
      });
      
      this.logDebug('====================================================');

      // Aplicar efectos de sangrado al inicio del turno
      const isAttacker = characterId === combat.attackerId;
      const activeCharacter = isAttacker ? attackerChar : defenderChar;
      const otherCharacter = isAttacker ? defenderChar : attackerChar;
      const activeBodyParts = isAttacker ? attackerBodyParts : defenderBodyParts;
      
      // Aplicar sangrado al personaje activo
      const bleedingResult = await this.applyBleedingEffects(activeCharacter);
      if (bleedingResult.description) {
        combat.combatLog = [
          ...combat.combatLog, 
          `[Ronda ${combat.roundCount}, Inicio del Turno] ${bleedingResult.description}`
        ];
      }
      
      // Verificar si el personaje ha muerto por sangrado
      if (bleedingResult.isDead) {
        combat.isActive = false;
        const message = `¡${activeCharacter.name} ha muerto desangrado! ${otherCharacter.name} es el ganador.`;
        combat.combatLog = [...combat.combatLog, message];
        await combat.save();
        
        return { combat, actionResult: { description: bleedingResult.description }, message };
      }
      
      // Verificar incapacitación
      const incapacitationMessage = this.evaluateCharacterCondition(activeCharacter, activeBodyParts);
      if (incapacitationMessage) {
        // El personaje está incapacitado y no puede realizar su acción
        combat.combatLog = [
          ...combat.combatLog, 
          `[Ronda ${combat.roundCount}, Turno ${combat.currentTurn}] ${incapacitationMessage}`
        ];
        
        // Si está inconsciente o incapacitado, avanzar turno sin realizar acción
        const actionResult = { description: incapacitationMessage };
        
        // Verificar si esto causa el fin del combate
        if (activeCharacter.status.consciousness <= 0 || 
            activeCharacter.conditions.includes('dead') || 
            activeCharacter.conditions.includes('dying')) {
            
          combat.isActive = false;
          const message = `¡El combate ha terminado! ${otherCharacter.name} es el ganador.`;
          combat.combatLog = [...combat.combatLog, message];
          await combat.save();
          
          return { combat, actionResult, message };
        }
        
        // Avanzar al siguiente turno sin realizar acción
        this.advanceTurn(combat, isAttacker ? combat.defenderId : combat.attackerId);
        await combat.save();
        
        return { combat, actionResult };
      }

      let actionResult;

      // Procesar la acción según el tipo
      switch (actionType) {
        case 'attack':
          if (!targetBodyPart) {
            throw new Error('Debes especificar una parte del cuerpo para atacar');
          }
          
          // Obtener modificadores de ataque basados en el estado del personaje
          const attackModifier = this.getAttackModifier(activeCharacter, activeBodyParts);
          let modifierDescription = '';
          
          if (attackModifier.description) {
            modifierDescription = attackModifier.description;
            // Registrar el efecto del estado en el log
            combat.combatLog = [
              ...combat.combatLog, 
              `[Ronda ${combat.roundCount}, Turno ${combat.currentTurn}] ${attackModifier.description}`
            ];
          }
          
          // Almacenar el modificador temporal para que el servicio de Character lo utilice
          if (attackModifier.modifier !== 1.0) {
            activeCharacter.conditions = [
              ...activeCharacter.conditions.filter(c => c !== 'attack_modifier'), 
              `attack_modifier_${attackModifier.modifier}`
            ];
            await activeCharacter.save();
          }
          
          // Procesar el ataque
          actionResult = await this.characterService.attack(
            characterId,
            isAttacker ? combat.defenderId : combat.attackerId,
            targetBodyPart
          );

          // Eliminar el modificador temporal después del ataque
          activeCharacter.conditions = activeCharacter.conditions.filter(
            c => !c.startsWith('attack_modifier')
          );
          await activeCharacter.save();

          // Mejorar descripción con IA
          actionResult.description = await this.enhanceDescription(
            modifierDescription ? 
            `${modifierDescription} ${actionResult.description}` :
            actionResult.description
          );
          
          // Añadir al log de combate
          combat.combatLog = [
            ...combat.combatLog, 
            `[Ronda ${combat.roundCount}, Turno ${combat.currentTurn}] ${actionResult.description}`
          ];
          
          break;
          
        case 'defend':
          // Implementar defensa (reducción de daño en próximo turno)
          // El efecto de defensa es menos efectivo si el personaje está en mal estado
          const defenseEffectiveness = this.getDefenseEffectiveness(activeCharacter);
          
          actionResult = {
            description: `${activeCharacter.name} adopta una postura defensiva${defenseEffectiveness < 1 ? ' con dificultad' : ''}, preparándose para el próximo ataque.`
          };
          
          // Añadir algún efecto temporal de defensa
          activeCharacter.conditions = [
            ...activeCharacter.conditions.filter(c => c !== 'defending'), 
            `defending_${defenseEffectiveness}`
          ];
          await activeCharacter.save();
          
          combat.combatLog = [
            ...combat.combatLog, 
            `[Ronda ${combat.roundCount}, Turno ${combat.currentTurn}] ${actionResult.description}`
          ];
          
          break;
          
        case 'recover':
          // La eficacia de la recuperación se ve afectada por estados
          const recoveryEffectiveness = this.getRecoveryEffectiveness(activeCharacter);
          
          let recoveryDescription = '';
          if (recoveryEffectiveness < 0.5) {
            recoveryDescription = ` con extrema dificultad`;
          } else if (recoveryEffectiveness < 0.8) {
            recoveryDescription = ` con dificultad`;
          }
          
          // Modificar temporalmente la efectividad de recuperación
          activeCharacter.conditions = [
            ...activeCharacter.conditions.filter(c => c !== 'recovering'), 
            `recovery_mod_${recoveryEffectiveness}`
          ];
          await activeCharacter.save();
          
          // Realizar recuperación con el modificador
          await this.characterService.recover(characterId);
          
          // Eliminar el modificador temporal
          activeCharacter.conditions = activeCharacter.conditions.filter(
            c => !c.startsWith('recovery_mod')
          );
          await activeCharacter.save();
          
          actionResult = {
            description: `${activeCharacter.name} se toma un momento para recuperar el aliento${recoveryDescription} y estabilizar sus heridas.`
          };
          
          combat.combatLog = [
            ...combat.combatLog, 
            `[Ronda ${combat.roundCount}, Turno ${combat.currentTurn}] ${actionResult.description}`
          ];
          
          break;
          
        default:
          throw new Error('Acción no válida');
      }

      // Actualizar personajes con los últimos valores
      const updatedAttacker = await Character.findByPk(combat.attackerId);
      const updatedDefender = await Character.findByPk(combat.defenderId);
      
      if (!updatedAttacker || !updatedDefender) {
        throw new Error('Error al actualizar personajes');
      }

      // Comprobar si el combate debe terminar (algún personaje inconsciente, muerto o incapacitado)
      const updatedAttackerBodyParts = await BodyPart.findAll({ where: { characterId: updatedAttacker.id } });
      const updatedDefenderBodyParts = await BodyPart.findAll({ where: { characterId: updatedDefender.id } });
      
      const attackerIncapacitated = this.isCharacterCriticallyDisabled(updatedAttacker, updatedAttackerBodyParts);
      const defenderIncapacitated = this.isCharacterCriticallyDisabled(updatedDefender, updatedDefenderBodyParts);
      
      if (attackerIncapacitated || defenderIncapacitated) {
        const winner = attackerIncapacitated ? updatedDefender.name : updatedAttacker.name;
        const loser = attackerIncapacitated ? updatedAttacker.name : updatedDefender.name;
        const loserChar = attackerIncapacitated ? updatedAttacker : updatedDefender;
        
        // Determinar el tipo de derrota
        let defeatReason = '';
        
        if (loserChar.conditions.includes('permanent_death')) {
          defeatReason = 'ha muerto definitivamente';
        } else if (loserChar.conditions.includes('dead')) {
          defeatReason = 'ha muerto';
        } else if (loserChar.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.CRITICAL) {
          defeatReason = 'ha quedado inconsciente';
        } else if (loserChar.conditions.includes('dying')) {
          defeatReason = 'está al borde de la muerte';
        } else {
          defeatReason = 'está demasiado herido para continuar';
        }
        
        combat.isActive = false;
        const message = loserChar.conditions.includes('permanent_death')
          ? `¡El combate ha terminado! ${loser} ha recibido un golpe fatal y ha muerto permanentemente. ${winner} es el ganador.`
          : `¡El combate ha terminado! ${loser} ${defeatReason}. ${winner} es el ganador.`;
          
        combat.combatLog = [
          ...combat.combatLog,
          message
        ];
        
        await combat.save();
        
        // Log de estadísticas al final del combate
        this.logDebug(`========= STATS FINAL DEL COMBATE =========`);
        this.logDebug(`Ganador: ${winner}`);
        this.logDebug(`Atacante (${updatedAttacker.name}):`);
        this.logDebug(`  Health: ${updatedAttacker.health}`);
        this.logDebug(`  Status: ${JSON.stringify(updatedAttacker.status)}`);
        this.logDebug(`Defensor (${updatedDefender.name}):`);
        this.logDebug(`  Health: ${updatedDefender.health}`);
        this.logDebug(`  Status: ${JSON.stringify(updatedDefender.status)}`);
        this.logDebug('==========================================');
        
        return { 
          combat, 
          actionResult, 
          message 
        };
      }

      // Avanzar al siguiente turno
      this.advanceTurn(combat, isAttacker ? combat.defenderId : combat.attackerId);
      await combat.save();

      // Log de estadísticas después de la acción
      this.logDebug(`========= STATS DESPUÉS DE LA ACCIÓN (${actionType}) =========`);
      
      this.logDebug(`Atacante (${updatedAttacker.name}):`);
      this.logDebug(`  Health: ${updatedAttacker.health}`);
      this.logDebug(`  Stats: ${JSON.stringify(updatedAttacker.stats)}`);
      this.logDebug(`  Status: ${JSON.stringify(updatedAttacker.status)}`);
      this.logDebug(`Defensor (${updatedDefender.name}):`);
      this.logDebug(`  Health: ${updatedDefender.health}`);
      this.logDebug(`  Stats: ${JSON.stringify(updatedDefender.stats)}`);
      this.logDebug(`  Status: ${JSON.stringify(updatedDefender.status)}`);
      
      this.logDebug('Partes del cuerpo del atacante:');
      updatedAttackerBodyParts.forEach(part => {
        this.logDebug(`  ${part.name}: ${part.health}/100`);
      });
      
      this.logDebug('Partes del cuerpo del defensor:');
      updatedDefenderBodyParts.forEach(part => {
        this.logDebug(`  ${part.name}: ${part.health}/100 ${part.name === targetBodyPart ? '(OBJETIVO)' : ''}`);
      });
      
      this.logDebug('======================================================');

      return { combat, actionResult };
    } catch (error) {
      return this.handleError(error, 'Error al procesar turno de combate');
    }
  }

  /**
   * Verifica si un personaje está crítica e irremediablemente incapacitado
   */
  private isCharacterCriticallyDisabled(character: Character, bodyParts: BodyPart[]): boolean {
    // Verificar muerte
    if (character.conditions.includes('dead')) {
      return true;
    }
    
    // Verificar inconsciencia total
    if (character.status.consciousness <= 0) {
      return true;
    }
    
    // Verificar daño crítico en partes vitales
    const headParts = bodyParts.filter(part => part.type === 'head');
    const torsoParts = bodyParts.filter(part => part.type === 'torso');
    
    // Si la cabeza está a 0 o menos
    if (headParts.some(part => part.health <= 0)) {
      this.applyPermanentDeath(character, 'head');
      return true;
    }
    
    // Si el torso está a 0 o menos
    if (torsoParts.some(part => part.health <= 0)) {
      this.applyPermanentDeath(character, 'torso');
      return true;
    }
    
    // Estado dying
    if (character.conditions.includes('dying')) {
      return true;
    }
    
    return false;
  }

  /**
   * Aplica muerte permanente a un personaje cuando una parte vital llega a 0
   */
  private async applyPermanentDeath(character: Character, cause: 'head' | 'torso'): Promise<void> {
    try {
      // Marcar al personaje como permanentemente muerto
      character.conditions = [...character.conditions.filter(c => 
        c !== 'dying' && c !== 'unconscious' && c !== 'incapacitated'), 
        'dead', 'permanent_death'];
      
      // Establecer salud y consciencia a 0
      character.health = 0;
      character.status.consciousness = 0;
      
      // Guardar el nuevo estado del personaje
      await character.save();
      
      // Registrar causa de muerte en el log del sistema
      const causeText = cause === 'head' ? 'destrucción de la cabeza' : 'daño fatal al torso';
      this.logInfo(`MUERTE PERMANENTE: El personaje ${character.name} (ID: ${character.id}) ha muerto por ${causeText}.`);
    } catch (error) {
      this.logError('Error al aplicar muerte permanente:', error);
    }
  }

  /**
   * Calcula la efectividad de la defensa según el estado del personaje
   */
  private getDefenseEffectiveness(character: Character): number {
    let effectiveness = 1.0; // Base
    
    // Reducir por dolor
    if (character.status.pain >= THRESHOLDS.PAIN.HIGH) {
      effectiveness *= 0.6;
    } else if (character.status.pain >= THRESHOLDS.PAIN.MEDIUM) {
      effectiveness *= 0.8;
    }
    
    // Reducir por fatiga
    if (character.status.fatigue >= THRESHOLDS.FATIGUE.HIGH) {
      effectiveness *= 0.7;
    } else if (character.status.fatigue >= THRESHOLDS.FATIGUE.MEDIUM) {
      effectiveness *= 0.85;
    }
    
    // Reducir por consciencia
    if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.LOW) {
      effectiveness *= 0.6;
    } else if (character.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.MEDIUM) {
      effectiveness *= 0.8;
    }
    
    return effectiveness;
  }

  /**
   * Calcula la efectividad de la recuperación según el estado del personaje
   */
  private getRecoveryEffectiveness(character: Character): number {
    let effectiveness = 1.0; // Base
    
    // El sangrado limita significativamente la recuperación
    if (character.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      effectiveness *= 0.4; // Sangrado severo
    } else if (character.status.bleeding >= THRESHOLDS.BLEEDING.MEDIUM) {
      effectiveness *= 0.7; // Sangrado moderado
    }
    
    // El dolor limita la recuperación
    if (character.status.pain >= THRESHOLDS.PAIN.HIGH) {
      effectiveness *= 0.7;
    } else if (character.status.pain >= THRESHOLDS.PAIN.MEDIUM) {
      effectiveness *= 0.85;
    }
    
    return effectiveness;
  }

  /**
   * Avanza al siguiente turno y actualiza el combate
   */
  private advanceTurn(combat: Combat, nextCharacterId: number) {
    this.logDebug(`Avanzando turno: combate ${combat.id}, siguiente personaje: ${nextCharacterId}`);
    
    // Guardar el estado anterior para logueo
    const prevCharacterId = combat.currentCharacterId;
    const prevTurn = combat.currentTurn;
    const prevRound = combat.roundCount;
    
    // Actualizar al siguiente personaje
    combat.currentCharacterId = nextCharacterId;
    combat.lastActionTimestamp = new Date();
    
    // Determinar si debemos cambiar el número de turno
    if (
      (combat.currentTurn === 1 && nextCharacterId === combat.defenderId) ||
      (combat.currentTurn === 2 && nextCharacterId === combat.attackerId)
    ) {
      combat.currentTurn = combat.currentTurn === 1 ? 2 : 1;
      
      // Si volvemos al turno 1, incrementamos la ronda
      if (combat.currentTurn === 1) {
        combat.roundCount += 1;
      }
    }
    
    this.logInfo(
      `Turno avanzado: Combate #${combat.id} - ` +
      `De: personaje ${prevCharacterId} (Turno ${prevTurn}, Ronda ${prevRound}) ` +
      `A: personaje ${nextCharacterId} (Turno ${combat.currentTurn}, Ronda ${combat.roundCount})`
    );
  }

  /**
   * Mejora la descripción de combate usando IA
   */
  private async enhanceDescription(baseDescription: string): Promise<string> {
    try {
      const chatSession = this.aiModel.startChat({
        generationConfig: this.generationConfig,
        history: [],
      });

      const enhancedResult = await chatSession.sendMessage(baseDescription);
      return enhancedResult.response.text();
    } catch (error) {
      this.logError('Error al mejorar descripción con IA', error);
      return baseDescription; // En caso de error, devolver la descripción original
    }
  }

  /**
   * Abandonar un combate activo
   */
  async abandonCombat(combatId: number, characterId: number) {
    try {
      const combat = await Combat.findByPk(combatId);
      if (!combat || !combat.isActive) {
        throw new Error('Combate no encontrado o ya terminado');
      }

      // Verificar si el personaje está en el combate
      if (combat.attackerId !== characterId && combat.defenderId !== characterId) {
        throw new Error('Este personaje no está en el combate');
      }

      const surrenderingChar = await Character.findByPk(characterId);
      const winnerCharId = characterId === combat.attackerId 
        ? combat.defenderId 
        : combat.attackerId;
      const winnerChar = await Character.findByPk(winnerCharId);

      if (!surrenderingChar || !winnerChar) {
        throw new Error('Personaje no encontrado');
      }

      // Finalizar el combate
      combat.isActive = false;
      combat.combatLog = [
        ...combat.combatLog,
        `${surrenderingChar.name} se ha rendido. ${winnerChar.name} es el ganador.`
      ];
      
      await combat.save();
      
      return {
        message: `${surrenderingChar.name} se ha rendido. ${winnerChar.name} es el ganador.`,
        combat
      };
    } catch (error) {
      return this.handleError(error, 'Error al abandonar combate');
    }
  }

  /**
   * Obtiene todos los combates activos de un personaje
   */
  async getActiveCombats(characterId: number) {
    try {
      return await Combat.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { attackerId: characterId },
            { defenderId: characterId }
          ]
        }
      });
    } catch (error) {
      return this.handleError(error, 'Error al obtener combates activos');
    }
  }
} 