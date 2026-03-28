'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const SculptureParams = sequelize.define('SculptureParams', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  peakHeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1.5,
  },
  smoothing: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  cylinderRadius: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1.0,
  },
  cylinderHeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 4.0,
  },
  ringThickness: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.3,
  },
  segments: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 512,
  },
  helixTurns: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 6,
  },
  ribbonWidth: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.15,
  },
  waveformColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#40E0D0',
  },
  cylinderColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#FFFFFF',
  },
}, {
  timestamps: false,
});

module.exports = SculptureParams;
