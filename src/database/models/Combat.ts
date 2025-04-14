import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';
import Character from './Character';

class Combat extends Model {
  declare id: number;
  declare attackerId: number;
  declare defenderId: number;
  declare isActive: boolean;
  declare currentTurn: number;
  declare currentCharacterId: number;
  declare roundCount: number;
  declare lastActionTimestamp: Date;
  declare combatLog: string[];
}

Combat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    attackerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Character,
        key: 'id',
      },
    },
    defenderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Character,
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    currentTurn: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    currentCharacterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roundCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    lastActionTimestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    combatLog: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('combatLog');
        return JSON.parse(rawValue);
      },
      set(value: string[]) {
        this.setDataValue('combatLog', JSON.stringify(value));
      }
    },
  },
  {
    sequelize,
    modelName: 'Combat',
  }
);

export default Combat; 