import Combat from '../database/models/Combat';
import Duelist from '../database/models/Duelist';
import { DuelistService } from './Duelist.service';
import { BaseService } from './BaseService';
import { AttackResult } from '../types/Combat.type';
import { getAiModel } from '../ai-model';
import { Op } from 'sequelize';
import BodyPart from '../database/models/BodyPart';
import sequelize from '../database/config';
import { TransactionService } from './Transaction.service';
import { THRESHOLDS, DuelistCondition } from '../constants/CombatThresholds';

/**
 * Servicio para gestionar combates por turnos
 */
export class CombatService extends BaseService {
  private duelistService: DuelistService;
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
    this.duelistService = new DuelistService();
    this.aiModel = getAiModel(this.systemInstruction);
  }

  /**
   * Inicia un nuevo combate entre dos duelistas
   */
  async startCombate(attackerId: number, defenderId: number): Promise<Combat> {
    return TransactionService.executeInTransaction(async (transaction) => {
      this.logDebug(`Iniciando combate entre ${attackerId} y ${defenderId}`);
      
      // Comprobar si ya existe un combate activo entre estos duelistas
      const existingCombat = await Combat.findOne({
        where: {
          isActive: true,
          attackerId,
          defenderId,
        },
        transaction
      });

      if (existingCombat) {
        this.logInfo(`Combate ya existente: ${existingCombat.id}`);
        return existingCombat;
      }

      // Verificar que ambos duelistas existen
      const [attacker, defender] = await Promise.all([
        Duelist.findByPk(attackerId, { transaction }),
        Duelist.findByPk(defenderId, { transaction })
      ]);
      
      if (!attacker || !defender) {
        throw new Error(`Duelista no encontrado: ${!attacker ? 'atacante' : 'defensor'} (ID: ${!attacker ? attackerId : defenderId})`);
      }

      this.logDebug(`Duelistas verificados: ${attacker.name} (${attackerId}) vs ${defender.name} (${defenderId})`);

      // Iniciar con duelista más ágil o aleatorio si son iguales
      const starterDuelistId = 
        (attacker.stats.agility || 10) > (defender.stats.agility || 10) 
          ? attackerId 
          : defenderId;

      // Usar el método create de la instancia del modelo
      return await Combat.create({
        attackerId,
        defenderId,
        currentDuelistId: starterDuelistId,
        lastActionTimestamp: new Date(),
        combatLog: [`¡Combate iniciado entre ${attacker.name} y ${defender.name}!`]
      }, { transaction });
    }, "Iniciar combate entre duelistas");
  }

  /**
   * Aplica efectos por sangrado al inicio del turno
   * Retorna un objeto con la descripción y si el duelista ha muerto
   */
  private async applyBleedingEffects(duelist: Duelist): Promise<{ description: string, isDead: boolean }> {
    if (duelist.status.bleeding <= THRESHOLDS.BLEEDING.LOW) {
      return { description: '', isDead: false };
    }

    let bleedingDamage = 0;
    let description = '';
    let isDead = false;

    // Calcular daño por sangrado
    if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.CRITICAL) {
      bleedingDamage = 10; // Daño extremo por hemorragia crítica
      description = `🩸 ${duelist.name} sufre una hemorragia masiva, perdiendo grandes cantidades de sangre.`;
      
      // Reducir consciencia significativamente
      duelist.status.consciousness = Math.round((Math.max(0, duelist.status.consciousness - 15)) * 10) / 10;
      
      // Posibilidad de muerte
      if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.CRITICAL) {
        description += ` Con el pulso debilitándose, ${duelist.name} está al borde de la muerte por desangramiento.`;
        isDead = Math.random() < 0.25; // 25% de probabilidad de morir por turno con hemorragia crítica
        
        if (isDead) {
          description += ` 💀 Finalmente, ${duelist.name} sucumbe a sus heridas, sin poder detener la pérdida de sangre.`;
          duelist.status.consciousness = 0;
          
          // Agregar condición de muerto
          duelist.conditions = [...duelist.conditions.filter(c => c !== 'dying'), 'dead'];
        } else {
          duelist.conditions = [...duelist.conditions.filter(c => 
            c !== 'ok' && c !== 'bleeding' && c !== 'severe_bleeding'), 'hemorrhage', 'dying'];
        }
      }
    } else if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      bleedingDamage = 6; // Daño severo
      description = `🩸 ${duelist.name} pierde mucha sangre, debilitándose visiblemente con cada movimiento.`;
      duelist.status.consciousness = Math.round((Math.max(0, duelist.status.consciousness - 8)) * 10) / 10;
      duelist.conditions = [...duelist.conditions.filter(c => 
        c !== 'ok' && c !== 'bleeding'), 'severe_bleeding'];
    } else if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.MEDIUM) {
      bleedingDamage = 3; // Daño moderado
      description = `🩸 ${duelist.name} sigue sangrando, su piel palidece.`;
      duelist.status.consciousness = Math.round((Math.max(0, duelist.status.consciousness - 4)) * 10) / 10;
      duelist.conditions = [...duelist.conditions.filter(c => c !== 'ok'), 'bleeding'];
    } else {
      bleedingDamage = 1; // Daño leve
      description = `🩸 ${duelist.name} tiene un sangrado leve pero constante.`;
      duelist.conditions = [...duelist.conditions.filter(c => c !== 'ok'), 'bleeding'];
    }

    // Aplicar daño a la salud general
    duelist.health = Math.max(0, duelist.health - bleedingDamage);
    
    // Incrementar el valor de sangrado gradualmente si es alto (simula empeorar)
    if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      duelist.status.bleeding = Math.round((Math.min(100, duelist.status.bleeding + 3)) * 10) / 10;
    }
    
    await duelist.save();
    return { description, isDead };
  }

  /**
   * Evalúa si un duelista está incapacitado o inconsciente basado en sus estados
   */
  private evaluateDuelistCondition(duelist: Duelist, bodyParts: BodyPart[]): string {
    // Verificar estado de inconsciencia por niveles bajos de consciencia
    if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.CRITICAL) {
      return `${duelist.name} está inconsciente y no puede actuar.`;
    }
    
    // Verificar incapacitación por dolor extremo
    if (duelist.status.pain >= THRESHOLDS.PAIN.CRITICAL) {
      return `${duelist.name} está completamente incapacitado por el dolor extremo.`;
    }
    
    // Verificar incapacitación por fatiga extrema
    if (duelist.status.fatigue >= THRESHOLDS.FATIGUE.CRITICAL) {
      return `${duelist.name} está demasiado agotado para continuar luchando.`;
    }
    
    // Verificar incapacitación por daño a partes críticas
    // Comprobar si la cabeza o el torso están en estado crítico
    const criticalParts = bodyParts.filter(part => 
      (part.type === 'head' || part.type === 'torso') && 
      part.health <= THRESHOLDS.BODY_PART.CRITICAL
    );
    
    if (criticalParts.length > 0) {
      return `${duelist.name} está gravemente herido en ${criticalParts.map(p => p.name).join(' y ')} y no puede continuar.`;
    }
    
    // Comprobar movilidad - si ambas piernas están inutilizables
    const legs = bodyParts.filter(part => part.type === 'leg');
    if (legs.length >= 2 && legs.every(leg => leg.health <= THRESHOLDS.BODY_PART.UNUSABLE)) {
      return `${duelist.name} no puede moverse con ambas piernas gravemente dañadas.`;
    }
    
    // Comprobar capacidad de ataque - si ambos brazos están inutilizables
    const arms = bodyParts.filter(part => part.type === 'arm');
    if (arms.length >= 2 && arms.every(arm => arm.health <= THRESHOLDS.BODY_PART.UNUSABLE)) {
      return `${duelist.name} no puede atacar con ambos brazos gravemente dañados.`;
    }
    
    return ''; // No hay incapacitación
  }

  /**
   * Aplica modificadores al ataque basados en el estado del duelista
   */
  private getAttackModifier(duelist: Duelist, bodyParts: BodyPart[]): { 
    modifier: number, 
    description: string 
  } {
    let modifier = 1.0;
    let reasons: string[] = [];
    
    // Modificador por dolor
    if (duelist.status.pain >= THRESHOLDS.PAIN.HIGH) {
      modifier *= 0.6; // -40% de efectividad
      reasons.push("dolor intenso");
    } else if (duelist.status.pain >= THRESHOLDS.PAIN.MEDIUM) {
      modifier *= 0.75; // -25% de efectividad
      reasons.push("dolor moderado");
    }
    
    // Modificador por fatiga
    if (duelist.status.fatigue >= THRESHOLDS.FATIGUE.HIGH) {
      modifier *= 0.7; // -30% de efectividad
      reasons.push("fatiga extrema");
    } else if (duelist.status.fatigue >= THRESHOLDS.FATIGUE.MEDIUM) {
      modifier *= 0.85; // -15% de efectividad
      reasons.push("fatiga moderada");
    }
    
    // Modificador por consciencia
    if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.LOW) {
      modifier *= 0.6; // -40% de efectividad
      reasons.push("aturdimiento");
    } else if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.MEDIUM) {
      modifier *= 0.8; // -20% de efectividad
      reasons.push("mareo");
    }
    
    // Comprobar si hay partes dañadas que afecten al ataque (brazos)
    const damagedArms = bodyParts.filter(
      part => part.type === 'arm' && part.health <= THRESHOLDS.BODY_PART.UNUSABLE
    );
    
    if (damagedArms.length > 0) {
      // Si tiene un brazo inutilizado, penalizar el ataque
      modifier *= 0.7; // -30% de efectividad
      reasons.push(`${damagedArms.length > 1 ? 'brazos dañados' : 'brazo dañado'}`);
    }
    
    let description = '';
    if (reasons.length > 0) {
      description = `${duelist.name} ataca con dificultad debido a ${reasons.join(' y ')}.`;
    }
    
    return { 
      modifier, 
      description 
    };
  }
  
  /**
   * Procesa un turno del combate
   */
  async processTurn(
    combatId: number, 
    duelistId: number, 
    actionType: 'attack' | 'defend' | 'recover',
    targetBodyPart?: string
  ) {
    try {
      // Obtener el combate
      const combat = await Combat.findByPk(combatId);
      
      if (!combat || !combat.isActive) {
        throw new Error('Combate no encontrado o finalizado');
      }

      // Verificar si es el turno del duelista
      if (combat.currentDuelistId !== duelistId) {
        throw new Error('No es tu turno para actuar');
      }

      // Obtener los duelistas involucrados
      const attackerChar = await Duelist.findByPk(combat.attackerId);
      const defenderChar = await Duelist.findByPk(combat.defenderId);
      
      if (!attackerChar || !defenderChar) {
        throw new Error('Duelista no encontrado');
      }

      // Obtener las partes del cuerpo de ambos
      const attackerBodyParts = await BodyPart.findAll({ where: { duelistId: attackerChar.id } });
      const defenderBodyParts = await BodyPart.findAll({ where: { duelistId: defenderChar.id } });
      
      // Actualizar timestamp de última acción
      combat.lastActionTimestamp = new Date();
      await combat.save();
      
      // Variable para almacenar el resultado de la acción
      let actionResult;
      
      // Aplicar efectos de sangrado al inicio del turno
      const isAttacker = duelistId === combat.attackerId;
      const activeCharacter = isAttacker ? attackerChar : defenderChar;
      const otherCharacter = isAttacker ? defenderChar : attackerChar;
      const activeBodyParts = isAttacker ? attackerBodyParts : defenderBodyParts;
      
      // Aplicar sangrado al duelista activo
      const bleedingResult = await this.applyBleedingEffects(activeCharacter);
      if (bleedingResult.description) {
        combat.combatLog = [
          ...combat.combatLog, 
          bleedingResult.description
        ];
        await combat.save();
      }
      
      // Verificar si el duelista ha muerto por sangrado
      if (bleedingResult.isDead) {
        combat.isActive = false;
        const winnerName = otherCharacter.name;
        const loserName = activeCharacter.name;
        const message = `${loserName} ha muerto desangrado. ¡${winnerName} es el vencedor!`;
        
        combat.combatLog = [
          ...combat.combatLog, 
          message
        ];
        await combat.save();
        
        return {
          combat,
          actionResult: {
            description: bleedingResult.description
          },
          message
        };
      }
      
      // Verificar incapacitación
      const incapacitationMessage = this.evaluateDuelistCondition(activeCharacter, activeBodyParts);
      if (incapacitationMessage) {
        // El duelista está incapacitado y no puede realizar su acción
        combat.combatLog = [
          ...combat.combatLog, 
          incapacitationMessage
        ];
        
        // Pasar al siguiente turno
        this.advanceTurn(combat, isAttacker ? combat.defenderId : combat.attackerId);
        
        return {
          combat,
          actionResult: {
            description: incapacitationMessage
          }
        };
      }
      
      // Procesar la acción elegida
      switch (actionType) {
        case 'attack':
          if (!targetBodyPart) {
            throw new Error('Debe especificar una parte del cuerpo para atacar');
          }
          
          try {
            // Obtener modificadores de ataque basados en el estado del duelista
            const attackModifier = this.getAttackModifier(activeCharacter, activeBodyParts);
            let modifierDescription = '';
            
            if (attackModifier.description) {
              combat.combatLog = [
                ...combat.combatLog, 
                attackModifier.description
              ];
              modifierDescription = attackModifier.description;
              await combat.save();
            }
            
            // Almacenar el modificador temporal para que el servicio de Duelist lo utilice
            if (attackModifier.modifier !== 1.0) {
              activeCharacter.conditions = [
                ...activeCharacter.conditions.filter(c => !c.startsWith('attack_modifier_')),
                `attack_modifier_${attackModifier.modifier.toFixed(2)}`
              ];
              await activeCharacter.save();
            }
            
            // Procesar el ataque
            actionResult = await this.duelistService.attack(
              duelistId,
              isAttacker ? combat.defenderId : combat.attackerId,
              targetBodyPart
            );
            
            // Si hay descripción de modificador, combinarla con el resultado
            if (modifierDescription && actionResult.description) {
              actionResult.description = `${modifierDescription} ${actionResult.description}`;
            }
            
            // Mejorar la descripción con IA si está disponible
            if (this.aiModel) {
              actionResult.description = await this.enhanceDescription(actionResult.description);
            }
            
            // Registrar el resultado en el log de combate
            combat.combatLog = [
              ...combat.combatLog, 
              actionResult.description
            ];
          } catch (error) {
            this.logError('Error procesando ataque:', error);
            combat.combatLog = [
              ...combat.combatLog, 
              `Error al procesar ataque: ${(error as Error).message}`
            ];
          }
          break;
          
        case 'defend':
          // Implementar defensa (reducción de daño en próximo turno)
          // El efecto de defensa es menos efectivo si el duelista está en mal estado
          const defenseEffectiveness = this.getDefenseEffectiveness(activeCharacter);
          
          // Aplicar efecto de defensa como una condición temporal
          activeCharacter.conditions = [
            ...activeCharacter.conditions.filter(c => !c.startsWith('defending_')),
            `defending_${defenseEffectiveness.toFixed(2)}`
          ];
          await activeCharacter.save();
          
          const defenseDescription = `${activeCharacter.name} se coloca en posición defensiva, preparándose para el próximo ataque${defenseEffectiveness < 1.5 ? ' con cierta dificultad' : ''}.`;
          
          // Registrar acción en el log
          combat.combatLog = [
            ...combat.combatLog, 
            defenseDescription
          ];
          
          actionResult = {
            description: defenseDescription
          };
          break;
          
        case 'recover':
          // El efecto de recuperación depende del estado actual
          const recoveryEffectiveness = this.getRecoveryEffectiveness(activeCharacter);
          
          // Agregar un modificador temporal para la recuperación
          activeCharacter.conditions = [
            ...activeCharacter.conditions.filter(c => !c.startsWith('recovery_modifier_')),
            `recovery_modifier_${recoveryEffectiveness.toFixed(2)}`
          ];
          await activeCharacter.save();
          
          // Realizar recuperación con el modificador
          await this.duelistService.recover(duelistId);
          
          // Eliminar el modificador temporal
          activeCharacter.conditions = activeCharacter.conditions.filter(c => !c.startsWith('recovery_modifier_'));
          await activeCharacter.save();
          
          const recoveryDescription = `${activeCharacter.name} toma un momento para recuperarse.`;
          
          // Registrar acción en el log
          combat.combatLog = [
            ...combat.combatLog, 
            recoveryDescription
          ];
          
          actionResult = {
            description: recoveryDescription
          };
          break;
      }
      
      // Pasar al siguiente turno
      this.advanceTurn(combat, isAttacker ? combat.defenderId : combat.attackerId);
      
      // Actualizar duelistas con los últimos valores
      const updatedAttacker = await Duelist.findByPk(combat.attackerId);
      const updatedDefender = await Duelist.findByPk(combat.defenderId);
      
      if (!updatedAttacker || !updatedDefender) {
        throw new Error('Error al actualizar duelistas');
      }

      // Comprobar si el combate debe terminar (algún duelista inconsciente, muerto o incapacitado)
      const updatedAttackerBodyParts = await BodyPart.findAll({ where: { duelistId: updatedAttacker.id } });
      const updatedDefenderBodyParts = await BodyPart.findAll({ where: { duelistId: updatedDefender.id } });
      
      const isAttackerDisabled = this.isCharacterCriticallyDisabled(updatedAttacker, updatedAttackerBodyParts);
      const isDefenderDisabled = this.isCharacterCriticallyDisabled(updatedDefender, updatedDefenderBodyParts);
      
      if (isAttackerDisabled || isDefenderDisabled) {
        combat.isActive = false;
        let message = '';
        
        if (isAttackerDisabled && isDefenderDisabled) {
          message = `¡Ambos duelistas han caído! ¡El combate termina en empate!`;
        } else {
          const winnerName = isAttackerDisabled ? updatedDefender.name : updatedAttacker.name;
          const loserName = isAttackerDisabled ? updatedAttacker.name : updatedDefender.name;
          message = `${loserName} no puede continuar. ¡${winnerName} es el vencedor!`;
        }
        
        combat.combatLog = [
          ...combat.combatLog, 
          message
        ];
        await combat.save();
        
        return {
          combat,
          actionResult,
          message
        };
      }
      
      return {
        combat,
        actionResult
      };
    } catch (error) {
      this.logError('Error al procesar turno:', error);
      throw error;
    }
  }

  /**
   * Verifica si un duelista está crítica e irremediablemente incapacitado
   */
  private isCharacterCriticallyDisabled(duelist: Duelist, bodyParts: BodyPart[]): boolean {
    // Verificar muerte
    if (duelist.conditions.includes('dead')) {
      return true;
    }
    
    // Verificar inconsciencia total
    if (duelist.status.consciousness <= 0) {
      return true;
    }
    
    // Comprobar daño grave en partes vitales
    const headParts = bodyParts.filter(part => part.type === 'head');
    const torsoParts = bodyParts.filter(part => part.type === 'torso');
    
    // Si la cabeza está a 0 o menos
    if (headParts.some(part => part.health <= 0)) {
      this.applyPermanentDeath(duelist, 'head');
      return true;
    }
    
    // Si el torso está a 0 o menos
    if (torsoParts.some(part => part.health <= 0)) {
      this.applyPermanentDeath(duelist, 'torso');
      return true;
    }
    
    // Estado dying
    if (duelist.conditions.includes('dying')) {
      return true;
    }
    
    // Si está inconsciente
    if (duelist.conditions.includes('unconscious')) {
      return true;
    }
    
    return false;
  }

  /**
   * Aplica muerte permanente a un duelista cuando una parte vital llega a 0
   */
  private async applyPermanentDeath(duelist: Duelist, cause: 'head' | 'torso'): Promise<void> {
    try {
      // Marcar al duelista como permanentemente muerto
      duelist.conditions = [...duelist.conditions.filter(c => 
        c !== 'dying' && c !== 'unconscious' && c !== 'incapacitated'), 
        'dead', 'permanent_death'];
      
      // Establecer salud y consciencia a 0
      duelist.health = 0;
      duelist.status.consciousness = 0;
      
      // Guardar el nuevo estado del duelista
      await duelist.save();
      
      // Registrar causa de muerte en el log del sistema
      const causeText = cause === 'head' ? 'destrucción de la cabeza' : 'daño fatal al torso';
      this.logInfo(`MUERTE PERMANENTE: El duelista ${duelist.name} (ID: ${duelist.id}) ha muerto por ${causeText}.`);
    } catch (error) {
      this.logError('Error al aplicar muerte permanente:', error);
    }
  }

  /**
   * Calcula la efectividad de la defensa según el estado del duelista
   */
  private getDefenseEffectiveness(duelist: Duelist): number {
    let effectiveness = 1.0; // Base
    
    // Fatiga afecta negativamente a la defensa
    if (duelist.status.fatigue >= THRESHOLDS.FATIGUE.HIGH) {
      effectiveness *= 0.7; // 30% menos efectivo
    } else if (duelist.status.fatigue >= THRESHOLDS.FATIGUE.MEDIUM) {
      effectiveness *= 0.85; // 15% menos efectivo
    }
    
    // Dolor afecta negativamente a la defensa
    if (duelist.status.pain >= THRESHOLDS.PAIN.HIGH) {
      effectiveness *= 0.8; // 20% menos efectivo
    } else if (duelist.status.pain >= THRESHOLDS.PAIN.MEDIUM) {
      effectiveness *= 0.9; // 10% menos efectivo
    }
    
    // Consciencia baja afecta negativamente
    if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.LOW) {
      effectiveness *= 0.7; // 30% menos efectivo
    } else if (duelist.status.consciousness <= THRESHOLDS.CONSCIOUSNESS.MEDIUM) {
      effectiveness *= 0.85; // 15% menos efectivo
    }
    
    // Bonus por agilidad (5% por cada punto por encima de 10)
    const agilityBonus = Math.max(0, (duelist.stats.agility - 10) * 0.05);
    effectiveness += agilityBonus;
    
    // Normalizamos entre 1.0 y 2.0
    return Math.max(1.0, Math.min(2.0, effectiveness));
  }

  /**
   * Calcula la efectividad de la recuperación según el estado del duelista
   */
  private getRecoveryEffectiveness(duelist: Duelist): number {
    let effectiveness = 1.0; // Base
    
    // Recuperación afectada por stats
    const recoveryBonus = Math.max(0, (duelist.stats.recovery - 10) * 0.05);
    effectiveness += recoveryBonus;
    
    // Bonus si está descansado
    if (duelist.status.fatigue < THRESHOLDS.FATIGUE.LOW) {
      effectiveness += 0.2; // 20% más efectivo
    }
    
    // Malus si tiene mucho dolor
    if (duelist.status.pain >= THRESHOLDS.PAIN.HIGH) {
      effectiveness *= 0.8; // 20% menos efectivo
    }
    
    // Malus si está sangrando mucho
    if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.HIGH) {
      effectiveness *= 0.7; // 30% menos efectivo
    } else if (duelist.status.bleeding >= THRESHOLDS.BLEEDING.MEDIUM) {
      effectiveness *= 0.85; // 15% menos efectivo
    }
    
    // Normalizamos entre 0.5 y 2.0
    return Math.max(0.5, Math.min(2.0, effectiveness));
  }

  /**
   * Avanza el turno al siguiente duelista
   */
  private advanceTurn(combat: Combat, nextDuelistId: number) {
    combat.currentDuelistId = nextDuelistId;
    
    // Si el turno vuelve al atacante, incrementamos el contador de rondas
    if (nextDuelistId === combat.attackerId) {
      combat.roundCount += 1;
    }
    
    // Si han pasado muchos turnos, terminamos el combate automáticamente
    if (combat.roundCount > 20) {
      // Terminar el combate después de 20 rondas
      combat.isActive = false;
      combat.combatLog = [
        ...combat.combatLog,
        'El combate se ha alargado demasiado y termina sin un claro ganador.'
      ];
    }
  }

  /**
   * Mejora las descripciones de combate utilizando IA generativa
   */
  private async enhanceDescription(baseDescription: string): Promise<string> {
    try {
      if (!this.aiModel || baseDescription.length < 10) {
        return baseDescription;
      }
      
      const response = await this.aiModel.generateContent(baseDescription);
      const enhancedDescription = response.response.text();
      
      return enhancedDescription || baseDescription;
    } catch (error) {
      this.logError('Error al mejorar descripción con IA:', error);
      return baseDescription;
    }
  }

  /**
   * Permite a un duelista abandonar un combate
   */
  async abandonCombat(combatId: number, duelistId: number) {
    try {
      const combat = await Combat.findByPk(combatId);
      
      if (!combat || !combat.isActive) {
        throw new Error('Combate no encontrado o ya finalizado');
      }
      
      const isAttacker = duelistId === combat.attackerId;
      const surrenderingDuelistId = duelistId;
      const winningDuelistId = isAttacker ? combat.defenderId : combat.attackerId;
      
      // Obtener los duelistas
      const surrenderingDuelist = await Duelist.findByPk(surrenderingDuelistId);
      const winningDuelist = await Duelist.findByPk(winningDuelistId);
      
      if (!surrenderingDuelist || !winningDuelist) {
        throw new Error('Error al obtener duelistas');
      }
      
      // Marcar el combate como finalizado
      combat.isActive = false;
      
      // Añadir rendición al log
      const message = `${surrenderingDuelist.name} se rinde. ¡${winningDuelist.name} es el vencedor!`;
      combat.combatLog = [
        ...combat.combatLog,
        message
      ];
      
      await combat.save();
      
      return {
        success: true,
        combat,
        message,
        winningDuelist,
        surrenderingDuelist
      };
    } catch (error) {
      return this.handleError(error, `Error al procesar rendición`);
    }
  }

  /**
   * Obtiene los combates activos de un duelista
   */
  async getActiveCombats(duelistId: number) {
    try {
      const combats = await Combat.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { attackerId: duelistId },
            { defenderId: duelistId }
          ]
        }
      });
      
      return combats;
    } catch (error) {
      return this.handleError(error, `Error al obtener combates activos`);
    }
  }
} 