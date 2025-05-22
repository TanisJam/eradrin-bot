import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config';

interface KnowledgeChunkAttributes {
  id: number;
  content: string;
  embedding: string; // Store vector embeddings as serialized JSON
  metadata: string;  // Store metadata as serialized JSON
}

// Define optional attributes for creation
interface KnowledgeChunkCreationAttributes extends Optional<KnowledgeChunkAttributes, 'id'> {}

class KnowledgeChunk extends Model<KnowledgeChunkAttributes, KnowledgeChunkCreationAttributes> implements KnowledgeChunkAttributes {
  declare id: number;
  declare content: string;
  declare embedding: string;
  declare metadata: string;
}

KnowledgeChunk.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embedding: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
    },
  },
  {
    sequelize,
    modelName: 'KnowledgeChunk',
    timestamps: true,
  }
);

export default KnowledgeChunk; 