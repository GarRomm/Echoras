'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const AudioAnalysis = sequelize.define('AudioAnalysis', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  bpm: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  rmsEnvelope: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  spectralCentroid: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  frequencyBands: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  beats: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = AudioAnalysis;
