import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config';
import User from './User';

interface PingHistoryAttributes {
  id: number;
  lastPingUserId: string;
}

interface PingHistoryCreationAttributes extends Optional<PingHistoryAttributes, 'id'> {}

class PingHistory extends Model<PingHistoryAttributes, PingHistoryCreationAttributes> implements PingHistoryAttributes {
  public id!: number;
  public lastPingUserId!: string;

  public lastPingUser?: User;
}

PingHistory.init(
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
    modelName: 'PingHistory',
  }
);

// Associations
PingHistory.belongsTo(User, { foreignKey: 'lastPingUserId', as: 'lastPingUser' });
User.hasMany(PingHistory, { foreignKey: 'lastPingUserId', as: 'pingHistory' });

export default PingHistory;
