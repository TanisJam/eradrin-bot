import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config';

const db: any = {};

// Cargar automáticamente todos los modelos en el directorio actual
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      (file.slice(-3) === '.ts' || file.slice(-3) === '.js') &&
      file.indexOf('.test.') === -1
    );
  })
  .forEach(file => {
    // Nota: Este enfoque podría necesitar ajustes dependiendo de cómo estén definidos tus modelos
    // Esta es una versión simplificada que asume importaciones ES module
    const modelPath = path.join(__dirname, file);
    const model = require(modelPath).default;
    if (model && model.name) {
      db[model.name] = model;
    }
  });

// Establecer asociaciones entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db; 