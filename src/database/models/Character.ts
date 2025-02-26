import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';
import BodyPart from './BodyPart';
import User from './User';

class Character extends Model {
  declare id: number;
  declare userId: string;
  declare name: string;
  declare race: string;
  declare health: number;
  declare stats: {
    strength: number;
    agility: number;
    endurance: number;
    recovery: number;
  };
  declare status: {
    bleeding: number;
    pain: number;
    consciousness: number;
    fatigue: number;
  };
  declare conditions: string[];
}

Character.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    race: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    health: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    stats: {
      type: DataTypes.JSON,
      defaultValue: {
        strength: 10,
        agility: 10,
        endurance: 10,
        recovery: 10,
      },
    },
    status: {
      type: DataTypes.JSON,
      defaultValue: {
        bleeding: 0,
        pain: 0,
        consciousness: 100,
        fatigue: 0,
      },
    },
    conditions: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('conditions');
        return JSON.parse(rawValue);
      },
      set(value: string[]) {
        this.setDataValue('conditions', JSON.stringify(value));
      }
    },
  },
  {
    sequelize,
    modelName: 'Character',
  }
);

// Associations
Character.belongsTo(User, { foreignKey: 'userId' });
Character.hasMany(BodyPart, { foreignKey: 'characterId', as: 'bodyParts' });
BodyPart.belongsTo(Character, { foreignKey: 'characterId' });

export default Character;
