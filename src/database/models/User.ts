import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config';

// Interfaz para atributos del modelo User
interface UserAttributes {
  id: string;
  nickName: string;
  lastPing: Date;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para la creación de un User (opcional para createdAt y updatedAt)
interface UserCreationAttributes extends Optional<UserAttributes, 'avatar' | 'createdAt' | 'updatedAt'> {}

/**
 * Modelo de usuario para la base de datos
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare nickName: string;
  declare lastPing: Date;
  declare avatar?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  /**
   * Actualiza la fecha del último ping
   */
  public async updateLastPing(): Promise<void> {
    this.lastPing = new Date();
    await this.save();
  }
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: 'ID del usuario en Discord',
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nickname del usuario en el servidor',
    },
    lastPing: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Última vez que el usuario usó el comando ping',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL del avatar del usuario',
    },
  },
  {
    sequelize,
    modelName: 'User',
    timestamps: true,
    comment: 'Almacena información sobre usuarios de Discord',
  }
);

export default User;
