import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';
import BodyPart from './BodyPart';
import User from './User';

class Duelist extends Model {
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

Duelist.init(
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
    modelName: 'Duelist',
  }
);

// Associations
Duelist.belongsTo(User, { foreignKey: 'userId' });
Duelist.hasMany(BodyPart, { foreignKey: 'duelistId', as: 'bodyParts' });
BodyPart.belongsTo(Duelist, { foreignKey: 'duelistId' });

export default Duelist; 