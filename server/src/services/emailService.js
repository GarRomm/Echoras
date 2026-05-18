'use strict';

const { Resend } = require('resend');

const FROM = process.env.EMAIL_FROM || 'Echoras <noreply@echoras.fr>';
const CONTACT_TO = process.env.CONTACT_EMAIL || 'romainsics@gmail.com';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

async function sendResetPasswordEmail(to, resetUrl) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe Echoras',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe Echoras.</p>
        <p>Cliquez sur le lien ci-dessous (valable <strong>1 heure</strong>) :</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#C9863A;color:#fff;border-radius:6px;text-decoration:none;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#888;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}

async function sendContactEmail({ name, email, subject, message }) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: CONTACT_TO,
    replyTo: `${name} <${email}>`,
    subject: `[Contact] ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
        <h2 style="margin-bottom:4px;">Nouveau message de contact</h2>
        <p style="color:#888; margin-top:0;">Via le formulaire echoras.fr</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0;">
          <tr><td style="padding:8px 0; color:#888; width:100px;">Nom</td><td style="padding:8px 0;">${name}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0; color:#888;">Sujet</td><td style="padding:8px 0;">${subject}</td></tr>
        </table>
        <div style="background:#f5f5f5; border-radius:8px; padding:16px;">
          <p style="margin:0; white-space:pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });
}

async function sendContactConfirmationEmail({ name, email }) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Votre message a bien été reçu — Echoras',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Merci ${name} !</h2>
        <p>Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais (généralement sous 24–48h ouvrées).</p>
        <p>En attendant, consultez notre <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/faq">FAQ</a> — votre réponse s'y trouve peut-être déjà.</p>
        <p style="color:#888; font-size:12px; margin-top:32px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
      </div>
    `,
  });
}

module.exports = { sendResetPasswordEmail, sendContactEmail, sendContactConfirmationEmail };
