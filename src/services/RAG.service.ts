import { BaseService } from './BaseService';
import KnowledgeChunk from '../database/models/KnowledgeChunk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { Op } from 'sequelize';

export class RAGService extends BaseService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    super('RAGService');
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  /**
   * Search method that returns relevant chunks based on semantic similarity
   * Also returns additional chunks from the same file sources
   * @param query The search query
   * @param limit Maximum number of chunks to return based on similarity
   * @param additionalChunksLimit Maximum number of additional chunks from same sources
   * @param similarityThreshold Minimum similarity score (0-1) to include a chunk (default: 0.7)
   * @param minResultsBeforeFallback Minimum number of results before falling back to relaxed mode
   */
  async searchRelevantChunks(
    query: string, 
    limit = 8, 
    additionalChunksLimit = 0, 
    similarityThreshold = 0.7,
    minResultsBeforeFallback = 2
  ): Promise<KnowledgeChunk[]> {
    try {
      // First try with strict mode
      const strictResults = await this.searchWithMode(
        query, 
        limit, 
        additionalChunksLimit, 
        similarityThreshold, 
        'strict'
      );
      
      // If we have enough results, return them
      if (strictResults.length >= minResultsBeforeFallback) {
        console.log(`Found ${strictResults.length} chunks in strict mode, returning results`);
        return strictResults;
      }
      
      // Otherwise, fall back to relaxed mode
      console.log(`Found only ${strictResults.length} chunks in strict mode, falling back to relaxed mode`);
      return this.searchWithMode(
        query, 
        limit, 
        additionalChunksLimit, 
        similarityThreshold, 
        'relaxed'
      );
    } catch (error) {
      this.logError('Error in searchRelevantChunks', error);
      return this.searchByKeywords(query, limit);
    }
  }
  
  /**
   * Internal method that performs the search with a specific mode
   * @private
   */
  private async searchWithMode(
    query: string, 
    limit: number, 
    additionalChunksLimit: number, 
    similarityThreshold: number,
    mode: 'strict' | 'relaxed'
  ): Promise<KnowledgeChunk[]> {
    try {
      // Adjust parameters based on mode
      if (mode === 'relaxed') {
        // In relaxed mode, use a lower threshold and potentially more results
        similarityThreshold = Math.min(similarityThreshold, 0.5);
        limit = Math.max(limit, 12);
      }
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Get chunks based on similarity or keywords
      let relevantChunks: KnowledgeChunk[] = [];
      
      if (!queryEmbedding.length) {
        // Fallback to keyword search if embedding fails
        relevantChunks = await this.searchByKeywords(query, limit);
      } else {
        // Get all chunks to compare
        const allChunks = await KnowledgeChunk.findAll();
        
        // Calculate similarity and sort by most similar
        const chunksWithSimilarity = allChunks.map(chunk => {
          const chunkEmbedding = JSON.parse(chunk.embedding);
          const similarity = this.calculateCosineSimilarity(queryEmbedding, chunkEmbedding);
          return { chunk, similarity };
        });
        
        // Sort by similarity (highest first)
        const sortedChunks = chunksWithSimilarity
          .sort((a, b) => b.similarity - a.similarity);
        
        // Get unique chunks above threshold or up to limit
        const seenIds = new Set<number>();
        relevantChunks = [];
        
        // If we're in relaxed mode, also prepare for potential keyword-based results
        let keywordResults: KnowledgeChunk[] = [];
        if (mode === 'relaxed') {
          keywordResults = await this.searchByKeywords(query, Math.floor(limit / 2));
          
          // Add keyword-based results to seen IDs to avoid duplicates
          for (const chunk of keywordResults) {
            seenIds.add(chunk.id);
          }
        }
        
        // Add chunks based on similarity
        for (const item of sortedChunks) {
          // In strict mode, or in relaxed mode with good similarity
          if (item.similarity >= similarityThreshold) {
            if (!seenIds.has(item.chunk.id)) {
              seenIds.add(item.chunk.id);
              relevantChunks.push(item.chunk);
              
              // Stop when we have enough chunks
              if (relevantChunks.length >= limit) break;
            }
          } else {
            // If we already have at least one chunk, we can break
            if (relevantChunks.length > 0) {
              this.logDebug(`Stopping at similarity ${item.similarity} (below threshold ${similarityThreshold})`);
              break;
            }
            
            // If we have no chunks yet, include this one even if below threshold
            if (mode === 'strict' && !seenIds.has(item.chunk.id)) {
              seenIds.add(item.chunk.id);
              relevantChunks.push(item.chunk);
              this.logDebug(`Including chunk with similarity ${item.similarity} (below threshold) because no better matches found`);
              break;
            }
          }
        }
        
        // In relaxed mode, merge similarity-based and keyword-based results
        if (mode === 'relaxed' && keywordResults.length > 0) {
          // Add keyword results if we don't have enough chunks
          if (relevantChunks.length < limit) {
            relevantChunks.push(...keywordResults);
            this.logDebug(`Added ${keywordResults.length} keyword-based results in relaxed mode`);
          }
        }
        
        this.logDebug(`Found ${relevantChunks.length} chunks with mode=${mode}, threshold=${similarityThreshold}`);
      }

      // Extract file sources from the relevant chunks
      const fileSources = new Set<string>();
      let primarySource: string | null = null;
      
      // Try to get the source of the first (most relevant) chunk
      if (relevantChunks.length > 0) {
        try {
          const firstChunkMetadata = JSON.parse(relevantChunks[0].metadata);
          if (firstChunkMetadata.source) {
            primarySource = firstChunkMetadata.source;
            // Only add to fileSources if not null
            if (primarySource) {
              fileSources.add(primarySource);
            }
          }
        } catch (error) {
          this.logError('Error parsing first chunk metadata', error);
        }
      }
      
      // Then get sources from other chunks
      for (const chunk of relevantChunks) {
        try {
          const metadata = JSON.parse(chunk.metadata);
          if (metadata.source) {
            fileSources.add(metadata.source);
          }
        } catch (error) {
          this.logError('Error parsing chunk metadata', error);
        }
      }

      // Keep track of unique chunk IDs
      const uniqueChunkIds = new Set(relevantChunks.map(chunk => chunk.id));
      
      // Find additional chunks from the same sources, prioritizing the primary source
      if (fileSources.size > 0 && additionalChunksLimit > 0) {
        const additionalChunks: KnowledgeChunk[] = [];
        
        // First prioritize the primary source (from the first result)
        if (primarySource) {
          const primarySourceChunks = await KnowledgeChunk.findAll({
            where: {
              metadata: {
                [Op.like]: `%"source":"${primarySource}"%`
              },
              id: {
                [Op.notIn]: Array.from(uniqueChunkIds)
              }
            },
            limit: additionalChunksLimit
          });
          
          // Add these chunks to our results
          for (const chunk of primarySourceChunks) {
            if (!uniqueChunkIds.has(chunk.id)) {
              uniqueChunkIds.add(chunk.id);
              additionalChunks.push(chunk);
            }
          }
        }
        
        // If we still need more chunks, try other sources
        if (additionalChunks.length < additionalChunksLimit) {
          const remainingLimit = additionalChunksLimit - additionalChunks.length;
          const otherSources = Array.from(fileSources)
            .filter(source => source !== primarySource);
            
          if (otherSources.length > 0) {
            const whereConditions = otherSources.map(source => ({
              metadata: {
                [Op.like]: `%"source":"${source}"%`
              }
            }));
    
            const otherSourceChunks = await KnowledgeChunk.findAll({
              where: {
                [Op.or]: whereConditions,
                id: {
                  [Op.notIn]: Array.from(uniqueChunkIds)
                }
              },
              limit: remainingLimit
            });
    
            // Add the additional chunks
            for (const chunk of otherSourceChunks) {
              if (!uniqueChunkIds.has(chunk.id)) {
                uniqueChunkIds.add(chunk.id);
                additionalChunks.push(chunk);
              }
            }
          }
        }
        
        // Add all additional chunks to our results
        relevantChunks.push(...additionalChunks);
      }

      // Double-check for duplicates before returning
      const finalSeenIds = new Set<number>();
      const finalChunks: KnowledgeChunk[] = [];
      
      for (const chunk of relevantChunks) {
        if (!finalSeenIds.has(chunk.id)) {
          finalSeenIds.add(chunk.id);
          finalChunks.push(chunk);
        }
      }

      console.log(`Found ${finalChunks.length} unique chunks (mode: ${mode})`);
      return finalChunks;
    } catch (error) {
      this.logError('Error in searchWithMode', error);
      return this.searchByKeywords(query, limit);
    }
  }

  /**
   * Fallback search using keywords
   */
  private async searchByKeywords(query: string, limit = 3): Promise<KnowledgeChunk[]> {
    try {
      // Split the query into keywords
      const keywords = query.toLowerCase().split(' ')
        .filter(word => word.length > 3) // Only use words longer than 3 chars
        .map(word => word.replace(/[^\w]/g, '')); // Remove special characters
      
      if (keywords.length === 0) {
        return [];
      }

      // Build a WHERE condition for each keyword
      const whereConditions = keywords.map(keyword => ({
        content: {
          [Op.like]: `%${keyword}%`
        }
      }));

      // Find chunks that match any of the keywords
      const chunks = await KnowledgeChunk.findAll({
        where: {
          [Op.or]: whereConditions
        },
        limit
      });

      return chunks;
    } catch (error) {
      this.logError('Error searching for relevant chunks', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1.length || !vec2.length || vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Generate embeddings for text using Google's embedding model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Clean and prepare the text
      const cleanText = text.trim();
      if (!cleanText) {
        return [];
      }

      // Get the embedding model (embedding-001 is cost-effective for this purpose)
      const embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
      
      // Generate the embedding
      const result = await embeddingModel.embedContent(cleanText);
      const embedding = result.embedding.values;
      
      this.logDebug(`Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      this.logError('Error generating embedding', error);
      // Return empty array on failure, which will trigger fallback to keyword search
      return [];
    }
  }

  /**
   * Store new knowledge chunk
   */
  async storeChunk(content: string, metadata: Record<string, any> = {}): Promise<KnowledgeChunk> {
    try {
      const embedding = await this.generateEmbedding(content);
      
      // Need to convert to string for storage according to model definition
      const embeddingString = JSON.stringify(embedding);
      const metadataString = JSON.stringify(metadata);
      
      const chunk = await KnowledgeChunk.create({
        content,
        embedding: embeddingString,
        metadata: metadataString
      });
      
      return chunk;
    } catch (error) {
      this.logError('Error storing knowledge chunk', error);
      throw error;
    }
  }

  /**
   * Format chunks into context string for the AI prompt
   */
  formatChunksForContext(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }
    
    return chunks
      .map(chunk => {
        // Parse metadata from JSON string
        const metadata = JSON.parse(chunk.metadata);
        const source = metadata.source ? ` [Source: ${metadata.source}]` : '';
        return `INFORMATION:${source}\n${chunk.content}\n`;
      })
      .join('\n');
  }

  /**
   * Ingest multiple knowledge chunks from text
   * This is used for the command to prepare RAG data before deployment
   */
  async ingestKnowledge(text: string, chunkSize = 500, metadata: Record<string, any> = {}): Promise<number> {
    try {
      // Split text into chunks of approximately chunkSize characters
      // This is a simple approach - a more sophisticated one would split by paragraphs or semantically
      const chunks: string[] = [];
      let currentChunk = '';
      
      const sentences = text.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // Store each chunk
      for (const chunkContent of chunks) {
        await this.storeChunk(chunkContent, metadata);
      }
      
      return chunks.length;
    } catch (error) {
      this.logError('Error ingesting knowledge', error);
      throw error;
    }
  }
}

// Create a singleton instance
const ragService = new RAGService();

// Export the singleton
export default ragService; 