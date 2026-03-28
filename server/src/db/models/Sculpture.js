'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Sculpture = sequelize.define('Sculpture', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  audioFileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  stlFilePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'ordered'),
    allowNull: false,
    defaultValue: 'draft',
  },
});

module.exports = Sculpture;
