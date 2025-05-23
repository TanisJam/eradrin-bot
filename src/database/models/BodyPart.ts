import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';
import Duelist from './Duelist';

class BodyPart extends Model {
  declare id: number;
  declare duelistId: number;
  declare name: string;
  declare type: string;
  declare health: number;
  declare isCritical: boolean;
  declare status: 'healthy' | 'bruised' | 'broken' | 'severed' | 'missing';
  private _connectedTo: string = '[]';
  declare tissue: {
    skin: number;
    muscle: number;
    bone: number;
    nerves: number;
    arteries: number;
  };

  get connectedTo(): string[] {
    return JSON.parse(this._connectedTo || '[]');
  }

  set connectedTo(value: string[]) {
    this._connectedTo = JSON.stringify(value);
  }
}

BodyPart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    duelistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('head', 'torso', 'arm', 'leg'),
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
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        return JSON.parse(this.getDataValue('connectedTo') || '[]');
      },
      set(val) {
        this.setDataValue('connectedTo', JSON.stringify(val));
      }
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
