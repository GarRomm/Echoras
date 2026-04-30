'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetPasswordEmail(to, resetUrl) {
  await transporter.sendMail({
    from: `"Echoras" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Réinitialisation de votre mot de passe Echoras',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe Echoras.</p>
        <p>Cliquez sur le lien ci-dessous (valable <strong>1 heure</strong>) :</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6c3fc5;color:#fff;border-radius:6px;text-decoration:none;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#888;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}

module.exports = { sendResetPasswordEmail };
