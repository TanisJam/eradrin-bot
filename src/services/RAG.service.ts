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
   * Simple search method that returns relevant chunks based on keyword search
   * This is a basic implementation without vector embeddings
   */
  async searchRelevantChunks(query: string, limit = 3): Promise<KnowledgeChunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      const queryEmbeddingString = JSON.stringify(queryEmbedding);

      // Fallback to keyword search if embedding fails
      if (!queryEmbedding.length) {
        return this.searchByKeywords(query, limit);
      }

      // Get all chunks to compare - in a production system with many chunks,
      // you would implement a vector database or specialized solution
      const allChunks = await KnowledgeChunk.findAll();
      
      // Calculate similarity and sort by most similar
      const chunksWithSimilarity = allChunks.map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding);
        const similarity = this.calculateCosineSimilarity(queryEmbedding, chunkEmbedding);
        return { chunk, similarity };
      });
      
      // Sort by similarity (highest first) and take the top N results
      const sortedChunks = chunksWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.chunk);
      
      return sortedChunks;
    } catch (error) {
      this.logError('Error searching with embeddings, falling back to keywords', error);
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