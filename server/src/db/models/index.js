'use strict';

const User           = require('./User');
const Material       = require('./Material');
const SculptureParams = require('./SculptureParams');
const AudioAnalysis  = require('./AudioAnalysis');
const Sculpture      = require('./Sculpture');
const ShippingAddress = require('./ShippingAddress');
const Order          = require('./Order');
const Cart           = require('./Cart');
const CartItem       = require('./CartItem');

// ── User ↔ Sculpture ───────────────────────────────────────────────
User.hasMany(Sculpture, { foreignKey: 'userId', onDelete: 'CASCADE' });
Sculpture.belongsTo(User, { foreignKey: 'userId' });

// ── Sculpture ↔ SculptureParams ────────────────────────────────────
Sculpture.belongsTo(SculptureParams, { foreignKey: 'sculptureParamsId', as: 'params' });
SculptureParams.hasOne(Sculpture, { foreignKey: 'sculptureParamsId' });

// ── Sculpture ↔ Material ───────────────────────────────────────────
Sculpture.belongsTo(Material, { foreignKey: 'materialId' });
Material.hasMany(Sculpture, { foreignKey: 'materialId' });

// ── Sculpture ↔ AudioAnalysis ──────────────────────────────────────
Sculpture.belongsTo(AudioAnalysis, { foreignKey: 'audioAnalysisId', as: 'analysis' });
AudioAnalysis.hasOne(Sculpture, { foreignKey: 'audioAnalysisId' });

// ── User ↔ ShippingAddress ─────────────────────────────────────────
User.hasMany(ShippingAddress, { foreignKey: 'userId', onDelete: 'CASCADE' });
ShippingAddress.belongsTo(User, { foreignKey: 'userId' });

// ── User ↔ Order ───────────────────────────────────────────────────
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// ── Sculpture ↔ Order ──────────────────────────────────────────────
Sculpture.hasOne(Order, { foreignKey: 'sculptureId' });
Order.belongsTo(Sculpture, { foreignKey: 'sculptureId' });

// ── Order ↔ ShippingAddress ────────────────────────────────────────
Order.belongsTo(ShippingAddress, { foreignKey: 'shippingAddressId' });
ShippingAddress.hasMany(Order, { foreignKey: 'shippingAddressId' });

// ── User ↔ Cart (1:1) ──────────────────────────────────────────────
User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// ── Cart ↔ CartItem ────────────────────────────────────────────────
Cart.hasMany(CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// ── CartItem ↔ Sculpture ───────────────────────────────────────────
CartItem.belongsTo(Sculpture, { foreignKey: 'sculptureId' });
Sculpture.hasMany(CartItem, { foreignKey: 'sculptureId' });

// ── CartItem ↔ Material ────────────────────────────────────────────
CartItem.belongsTo(Material, { foreignKey: 'materialId' });
Material.hasMany(CartItem, { foreignKey: 'materialId' });

module.exports = {
  User,
  Material,
  SculptureParams,
  AudioAnalysis,
  Sculpture,
  ShippingAddress,
  Order,
  Cart,
  CartItem,
};
