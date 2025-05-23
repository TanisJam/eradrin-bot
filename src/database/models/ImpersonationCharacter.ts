import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config';
import User from './User';

/**
 * Interfaz para atributos del modelo ImpersonationCharacter
 */
interface ImpersonationCharacterAttributes {
  id?: number;
  userId: string;
  name: string;
  imageUrl: string;
  slotNumber: number;
  isSelected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Modelo para personajes de impersonación
 * Cada usuario puede guardar hasta 5 slots con nombres e imágenes
 */
class ImpersonationCharacter extends Model<ImpersonationCharacterAttributes> implements ImpersonationCharacterAttributes {
  declare id: number;
  declare userId: string;
  declare name: string;
  declare imageUrl: string;
  declare slotNumber: number;
  declare isSelected: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

ImpersonationCharacter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID único del personaje de impersonación',
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      comment: 'ID del usuario en Discord',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre del personaje para impersonar',
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'URL de la imagen del personaje para impersonar',
    },
    slotNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Número de slot del personaje (1-5)',
    },
    isSelected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si este personaje está seleccionado actualmente',
    },
  },
  {
    sequelize,
    modelName: 'ImpersonationCharacter',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'slotNumber'],
        name: 'user_slot_unique'
      }
    ],
    comment: 'Almacena personajes de impersonación para cada usuario',
  }
);

// Definimos la relación con el modelo User
ImpersonationCharacter.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ImpersonationCharacter, { foreignKey: 'userId' });

export default ImpersonationCharacter; 