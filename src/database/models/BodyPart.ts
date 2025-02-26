import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';
import Character from './Character';

class BodyPart extends Model {
  declare id: number;
  declare characterId: number;
  declare name: string;
  declare type: string;
  declare health: number;
  declare isCritical: boolean;
  declare status: 'healthy' | 'bruised' | 'broken' | 'severed' | 'missing';
  declare connectedTo: string[];
  declare tissue: {
    skin: number;
    muscle: number;
    bone: number;
    nerves: number;
    arteries: number;
  };
}

BodyPart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    characterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    health: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    isCritical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('healthy', 'bruised', 'broken', 'severed', 'missing'),
      defaultValue: 'healthy',
    },
    connectedTo: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    tissue: {
      type: DataTypes.JSON,
      defaultValue: {
        skin: 100,
        muscle: 100,
        bone: 100,
        nerves: 100,
        arteries: 100,
      },
    },
  },
  {
    sequelize,
    modelName: 'BodyPart',
  }
);

export default BodyPart;
