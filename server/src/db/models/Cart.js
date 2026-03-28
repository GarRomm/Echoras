'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
});

module.exports = Cart;
