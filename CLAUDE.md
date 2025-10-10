# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eradrin Bot is a Discord bot for role-playing games management and social activities, built with TypeScript, Discord.js, and Sequelize (SQLite). It integrates with Google Gemini AI for chatbot functionality and implements RAG (Retrieval-Augmented Generation) for enhanced AI responses.

## Development Commands

### Building and Running
```bash
# Install dependencies (use pnpm, not npm)
pnpm install

# Compile TypeScript
pnpm build

# Deploy commands to Discord (run after creating/modifying commands)
pnpm deploy:commands

# Start the bot (production mode)
pnpm start

# Development mode with auto-reload
pnpm dev

# Safe start (prevents database table alterations)
pnpm safe-start
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration
```

### Database Scripts
```bash
# Sync database models
pnpm sync-database

# Knowledge base management (RAG system)
pnpm ingest-knowledge     # Ingest documents into knowledge base
pnpm verify-knowledge     # Verify knowledge base integrity
pnpm clear-knowledge      # Clear knowledge base

# Other utilities
pnpm reset-impersonation  # Reset impersonation table
pnpm fetch-messages       # Fetch channel messages
pnpm fetch-characters     # Fetch characters from Nivel20
```

## Architecture

### Core Structure

The bot follows a layered MVC-style architecture:

- **Commands Layer** (`src/commands/`): Discord slash command implementations. Each command exports an object implementing the `Command` interface with `data` (SlashCommandBuilder) and `execute` (async function) properties.

- **Services Layer** (`src/services/`): Business logic isolated from Discord interactions. All services extend `BaseService` for consistent logging. Key services:
  - `RAGService`: Implements semantic search over knowledge base using embeddings
  - `Nivel20.service`: Integration with Nivel20 character sheets
  - `Transaction.service`: Database transaction management

- **Database Layer** (`src/database/`):
  - `config.ts`: Sequelize initialization with support for `force` and `alter` sync modes
  - `models/`: Sequelize models (PascalCase files: User.ts, Character.ts, etc.)

- **Types Layer** (`src/types/`): TypeScript interfaces and type definitions

- **Utils Layer** (`src/utils/`): Reusable helper functions and utilities

### Command Registration

Commands are automatically registered in `bot.ts` by importing from `src/commands/index.ts`. To add a new command:
1. Create the command file in `src/commands/` implementing the `Command` interface
2. Export it from `src/commands/index.ts`
3. Run `pnpm deploy:commands` to register with Discord
4. Restart the bot

### Database Management

The bot uses Sequelize with SQLite. Database initialization happens in `bot.ts` on client ready:
- **Safe mode** (`SAFE_START=true`): Prevents table alterations, only syncs structure
- **Normal mode**: Allows table alterations if needed via `sequelize.sync({ alter: true })`
- **Force mode**: Drops and recreates all tables (⚠️ DESTROYS DATA)

SQLite has limitations with `ALTER TABLE`, so complex schema changes may require manual migration scripts in the `scripts/` directory.

### AI Integration

- **Model**: Uses Google Gemini (`gemini-2.5-flash`) configured in `src/ai-model.ts`
- **RAG System**: Implements semantic search using embeddings stored in `KnowledgeChunk` model
- **Knowledge Base**: Documents in `knowledge/` directory can be ingested for RAG
- Safety settings are configured with `BLOCK_NONE` for all harm categories to allow RPG content

### Discord Client Extension

The Discord.js Client is extended with a `commands` property (Collection<string, Command>) via module augmentation at the bottom of `bot.ts`.

## Language and Style Conventions

**User-Facing Content**: All Discord messages must be in Spanish
**Code Documentation**: All comments and JSDoc must be in English

Follow the naming conventions in `.cursorrules`:
- Variables/constants: camelCase (e.g., `lastPingUser`)
- Global constants: UPPER_CASE (e.g., `TOKEN`)
- Classes/Interfaces: PascalCase (e.g., `User`, `Command`)
- Files: kebab-case for utils (e.g., `format-text.ts`), PascalCase for models
- Commands: lowercase (e.g., `ping`, `roll`)

## Configuration

Environment variables are managed through `src/config.ts`. Required variables:
- `CLIENT_ID`: Discord application client ID
- `TOKEN`: Discord bot token
- `GUILD_ID`: Discord server ID for command deployment
- `GEMINI_API_KEY`: Google Gemini API key

The config validates all required variables at startup and throws if any are missing.

## Logging

Use the centralized logger from `src/utils/logger.ts`:
- Services should use BaseService's protected log methods
- Always log command execution, errors, and important state changes
- The logger is configured differently per environment (development/production)

## Error Handling

All async operations must use try/catch blocks. Command errors are caught in `bot.ts` and respond to users with ephemeral error messages. Unhandled rejections are logged at the process level.

## Package Management

⚠️ **Always use `pnpm`** for package management, not npm or yarn.

## Testing

Tests use Jest with ts-jest. Test files should be located in `tests/` directory with `.test.ts` or `.spec.ts` extensions. Setup file: `tests/setup.ts`.

## Docker

The Dockerfile compiles TypeScript with `--skipLibCheck` to prevent build failures. When building:
```bash
docker build -t eradrin-bot .
docker run -d --name eradrin-bot eradrin-bot
# Or use docker-compose
docker-compose up -d
```
