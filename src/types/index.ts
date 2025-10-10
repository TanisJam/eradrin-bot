/**
 * Centralized exports for all types
 * This file serves as the entry point for all types used in the application
 */

// Command types
export * from './commands';

// Game-related types (Combat, Character, etc.)
export * from './game';

// External API types
export * from './external';

// Re-export commonly used types with specific names for convenience
export type { Command } from './commands/Command';
export type { Character, CharacterDetails } from './game/Character';
export { AttackResult, BODY_PARTS } from './game/Combat';
