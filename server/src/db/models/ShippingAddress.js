'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const ShippingAddress = sequelize.define('ShippingAddress', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  street: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'France',
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = ShippingAddress;
