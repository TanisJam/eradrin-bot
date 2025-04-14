# Eradrin Bot Architecture

This document describes the architecture and best practices implemented in the Eradrin Bot project.

## Overview

Eradrin Bot is a Discord bot designed to facilitate role-playing games and social activities. The project follows a modular and scalable architecture, using TypeScript to ensure type safety and code clarity.

## Project Structure

```
src/
├── commands/           # Discord commands 
├── database/           # Database configuration and models
│   └── models/         # Sequelize models
├── services/           # Business logic services
├── types/              # TypeScript interfaces and types
├── utils/              # Utilities and helper functions
├── constants/          # Fixed configurations and constants
├── bot.ts              # Main entry point for the bot
├── config.ts           # Global application configuration
└── deploy-commands.ts  # Script to register commands in Discord
```

## Design Patterns and Best Practices

### 1. Layered Architecture

The code is organized in different layers to separate responsibilities:

- **Presentation Layer**: Discord commands (`commands/`)
- **Business Logic Layer**: Services (`services/`)
- **Data Layer**: Models and database configuration (`database/`)
- **Utility Layer**: Helper functions and tools (`utils/`)

### 2. SOLID Principles

Components follow the SOLID principles:

- **S (Single Responsibility)**: Each class/module has a single responsibility.
- **O (Open/Closed)**: Classes are open for extension but closed for modification.
- **L (Liskov Substitution)**: Base classes can be substituted with their derivatives.
- **I (Interface Segregation)**: Specific interfaces are used instead of general ones.
- **D (Dependency Inversion)**: Dependencies rely on abstractions, not concrete implementations.

### 3. Implemented Design Patterns

- **Singleton**: Centralized configuration and bot client.
- **Facade**: Services providing simplified interfaces for complex systems.
- **Decorator**: Base service class adding common functionalities.
- **Command**: Pattern used for Discord commands.
- **Repository**: Abstraction for database access.

### 4. Configuration Management

- Centralized configuration in `config.ts`
- Validated and typed environment variables
- Isolated and reusable database configuration

### 5. Error Handling

- Logging system with different levels (info, warn, error, debug)
- Structured exception capture
- Proper error propagation to higher layers
- Informative error messages for users

### 6. Security

- Input validation in commands
- Data sanitization before storage
- Sensitive information hiding
- Strict typing to prevent common errors

## Main Components

### 1. Commands

Each command implements the `Command` interface defined in `types/Command.ts`:

```typescript
export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction, client?: Client) => Promise<void>;
}
```

### 2. Services

Services extend the `BaseService` class that provides common functionalities:

```typescript
export abstract class BaseService {
  protected serviceName: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  // Logging and error handling methods
}
```

### 3. Models

Models use Sequelize with TypeScript interfaces to ensure correct typing:

```typescript
interface UserAttributes {
  id: string;
  nickName: string;
  // other attributes
}

interface UserCreationAttributes extends Optional<UserAttributes, ...> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Properties and methods
}
```

## Command Lifecycle

1. **Registration**: Commands are registered using `deploy-commands.ts`.
2. **Reception**: The Discord client receives the user interaction.
3. **Routing**: In `bot.ts`, the interaction is directed to the corresponding command.
4. **Execution**: The command's `execute()` method processes the interaction.
5. **Business Logic**: The command uses services to execute business logic.
6. **Response**: A response is sent to the user through Discord.

## Implemented Improvements

1. **Strict Typing**: Interfaces and types for all components.
2. **Enhanced Error Handling**: Logging system and structured exception capture.
3. **Centralized Configuration**: Environment variables and configuration in one place.
4. **Modularity**: Independent and easily replaceable components.
5. **Comprehensive Documentation**: Code documented with JSDoc and detailed README.
6. **Base Services**: Base class to standardize service implementation.
7. **Data Validation**: Thorough user input validation.

## Conclusion

The Eradrin Bot architecture follows software development best practices, making it maintainable, extendable, and scalable. The combination of TypeScript, design patterns, and a clear structure enables agile and robust development. 