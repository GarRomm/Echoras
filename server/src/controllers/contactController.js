'use strict';

const { sendContactEmail, sendContactConfirmationEmail } = require('../services/emailService');

const SUBJECTS = ['Commande en cours', 'Sculpture & personnalisation', 'Paiement', 'Autre'];

async function sendContact(req, res) {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  if (!SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: 'Sujet invalide' });
  }
  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Message trop court' });
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message trop long (max 4000 caractères)' });
  }

  try {
    await sendContactEmail({ name, email, subject, message });
    await sendContactConfirmationEmail({ name, email });
    res.json({ ok: true });
  } catch (err) {
    console.error('contact email error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi. Veuillez réessayer.' });
  }
}

module.exports = { sendContact };
