'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.ENUM('plastic_white', 'plastic_black', 'metal_silver', 'metal_gold', 'wood'),
    allowNull: false,
    unique: true,
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  textureRef: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = Material;
