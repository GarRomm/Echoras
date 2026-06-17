'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../db/models/index');
const emailService = require('../services/emailService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function register(req, res) {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });
  }

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, firstName, lastName, role: 'USER' });

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Déconnecté' });
}

async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'address', 'zipCode', 'city', 'country'],
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateProfile(req, res) {
  const { firstName, lastName, email, phone, address, zipCode, city, country, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const updates = {};

    if (firstName && firstName.trim()) updates.firstName = firstName.trim();
    if (lastName && lastName.trim()) updates.lastName = lastName.trim();

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      updates.email = email;
    }

    updates.phone = phone ?? user.phone;
    updates.address = address ?? user.address;
    updates.zipCode = zipCode ?? user.zipCode;
    updates.city = city ?? user.city;
    updates.country = country ?? user.country;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Le mot de passe actuel est requis' });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.update(updates);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      address: user.address,
      zipCode: user.zipCode,
      city: user.city,
      country: user.country,
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    const user = await User.findOne({ where: { email } });
    // Réponse identique que l'email existe ou non (sécurité anti-énumération)
    if (!user) return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await user.update({ resetToken, resetTokenExpiry });

    const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await emailService.sendResetPasswordEmail(user.email, resetUrl);

    res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
  if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });

  try {
    const user = await User.findOne({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await user.update({ passwordHash, resetToken: null, resetTokenExpiry: null });

    res.json({ message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { register, login, logout, me, updateProfile, forgotPassword, resetPassword };
