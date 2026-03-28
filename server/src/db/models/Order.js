'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'fabrication', 'shipped', 'delivered'),
    allowNull: false,
    defaultValue: 'pending',
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
});

module.exports = Order;
