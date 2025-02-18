import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config';
import User from './User';

interface GeneralAttributes {
  id: number;
  lastPingUserId: string;
}

interface GeneralCreationAttributes extends Optional<GeneralAttributes, 'id'> {}

class General extends Model<GeneralAttributes, GeneralCreationAttributes> implements GeneralAttributes {
  public id!: number;
  public lastPingUserId!: string;

  public lastPingUser?: User;
}

General.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lastPingUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'General',
  }
);

// Establecer relaciones
General.belongsTo(User, { foreignKey: 'lastPingUserId', as: 'lastPingUser' });
User.hasMany(General, { foreignKey: 'lastPingUserId', as: 'generals' });

export default General;