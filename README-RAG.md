# RAG Implementation for Eradrin Bot

This document explains how to use the Retrieval-Augmented Generation (RAG) feature for Eradrin Bot.

## What is RAG?

RAG (Retrieval-Augmented Generation) enhances Eradrin's responses by retrieving and incorporating relevant information from a knowledge database. This allows Eradrin to provide more accurate and detailed answers based on specific content you've added to the system.

## How It Works

1. **Knowledge Preparation**: You add text files containing relevant information to subdirectories of the `knowledge/` directory
2. **Knowledge Processing**: You run the local script to process and store this information in the database
3. **Vector Embedding**: Each text chunk is converted to a vector embedding using Google's embedding-001 model
4. **Semantic Retrieval**: When someone asks a question, the system finds the most semantically similar content
5. **Response Generation**: Eradrin uses the retrieved information to enhance its response

## Usage Instructions

### Preparing Knowledge Files

1. Create a directory called `knowledge/` in the root of the project
2. Create subdirectories for each category of information (the directory name will be used as the source)
3. Add text files (.txt or .md) to these directories

Example directory structure:
```
knowledge/
  ├── player-characters/
  │   ├── elowen.txt
  │   ├── thrain.txt
  │   └── zephyr.txt
  ├── locations/
  │   ├── silverymoon.txt
  │   ├── reposo-del-cuervo.txt
  │   └── neverwinter.md
  ├── creatures/
  │   ├── dragons.txt
  │   └── undead.txt
  └── history/
      ├── forgotten-realms.txt
      └── sword-coast.txt
```

### Ingesting Knowledge

Use the script in package.json to ingest knowledge files before deploying:

```bash
# Process everything in the knowledge directory (all categories)
pnpm ingest-knowledge -- --mode=all

# Process all files in a specific category
pnpm ingest-knowledge -- --mode=directory --directory=player-characters

# Process a single file
pnpm ingest-knowledge -- --mode=file --file=player-characters/elowen.txt --chunkSize=400
```

Note: The script uses the `tsx` package to execute TypeScript code directly. It's included as a development dependency in package.json.

Parameters:
- `--mode`: Operation mode (`all`, `directory`, or `file`)
- `--directory`: The subdirectory name to process (for directory mode)
- `--file`: The file path relative to knowledge/ (for file mode)
- `--chunkSize`: Size of text chunks in characters (default: 500)

### Testing RAG

Once knowledge is ingested, users can ask Eradrin questions related to the information:

```
/ask question:Tell me about Elowen
```

## Technical Implementation

The RAG system consists of:

1. **KnowledgeChunk Model**: Stores text chunks and their vector embeddings in SQLite
2. **RAG Service**: Handles vector-based retrieval, cosine similarity calculation, and context formatting
3. **Local Ingestion Script**: Processes and stores knowledge before deployment
4. **Enhanced Ask Command**: Retrieves relevant information and incorporates it into Eradrin's responses

### Vector Embedding Details

This implementation uses Google's `embedding-001` model to generate embeddings:

- Cost-effective embedding model specifically designed for semantic search
- High-quality embeddings for semantic similarity calculations
- Automatic fallback to keyword search if embedding generation fails
- Cosine similarity calculation for finding the most relevant content

### Organized by Source

- Each subdirectory in the `knowledge/` folder becomes a source category
- Source information is stored in the metadata and can be used for filtering
- The source helps users understand where information is coming from
- You can easily update specific categories by reprocessing their directories

### Scaling Considerations

The current implementation performs in-memory similarity calculations, which works well for smaller knowledge bases. For larger knowledge bases:

1. Consider implementing a vector database like Pinecone or Weaviate
2. Add pagination and caching for more efficient retrieval
3. Implement more sophisticated chunking strategies

## Extending the System

To further enhance this RAG implementation:

1. Add support for more file types (PDF, HTML, etc.)
2. Implement filtering based on sources (e.g., only answer from certain categories)
3. Add relevance score thresholding to avoid including low-quality matches
4. Create utilities to visualize knowledge coverage and search effectiveness

## Maintenance

The knowledge database is stored in the SQLite database file. To maintain it:

1. Organize new content in appropriate category directories
2. Run the ingestion script before deployment to update the knowledge base
3. Back up the database file or recreate it from source files as needed
4. Update specific categories as needed without reprocessing everything 