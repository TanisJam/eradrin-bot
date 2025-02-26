import { Model, DataTypes } from 'sequelize';
import sequelize from '../config';

class User extends Model {
  declare id: string;
  declare nickName: string;
  declare lastPing: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastPing: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);

export default User;
