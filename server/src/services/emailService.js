'use strict';

const resendPkg = require('resend');

const FROM = process.env.EMAIL_FROM || 'Echoras <noreply@echoras.fr>';
const CONTACT_TO = process.env.CONTACT_EMAIL || 'romainsics@gmail.com';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new resendPkg.Resend(process.env.RESEND_API_KEY);
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
    subject: 'Votre message a bien été reçu - Echoras',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Merci ${name} !</h2>
        <p>Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais (généralement sous 24–48h ouvrées).</p>
        <p>En attendant, consultez notre <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/faq">FAQ</a> - votre réponse s'y trouve peut-être déjà.</p>
        <p style="color:#888; font-size:12px; margin-top:32px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
      </div>
    `,
  });
}

const STATUS_LABELS = {
  fabrication: 'En cours de fabrication',
  shipped:     'Expédiée',
  delivered:   'Livrée',
};

async function sendOrderConfirmationEmail({ to, firstName, orders, total }) {
  const resend = getResendClient();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  const rows = orders.map(o => `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #eee;">${o.orderNumber}</td>
      <td style="padding:10px 0; border-bottom:1px solid #eee;">${o.sculptureName}</td>
      <td style="padding:10px 0; border-bottom:1px solid #eee; text-align:right;">${o.price.toFixed(2)} €</td>
    </tr>`).join('');

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Confirmation de commande - Echoras`,
    html: `
      <div style="font-family:sans-serif; max-width:560px; margin:auto; color:#12121a;">
        <h2 style="margin-bottom:4px;">Merci pour votre commande${firstName ? `, ${firstName}` : ''} !</h2>
        <p style="color:#555; margin-top:0;">Votre commande a bien été enregistrée. Nous vous tiendrons informé(e) de son avancement.</p>
        <table style="width:100%; border-collapse:collapse; margin:24px 0;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px; text-align:left;">Référence</th>
              <th style="padding:10px; text-align:left;">Sculpture</th>
              <th style="padding:10px; text-align:right;">Prix</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 0; font-weight:600;">Total</td>
              <td style="padding:12px 0; font-weight:600; text-align:right;">${total.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
        <a href="${origin}/mes-commandes" style="display:inline-block;padding:12px 24px;background:#C9863A;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Suivre ma commande
        </a>
        <p style="color:#888; font-size:12px; margin-top:32px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
      </div>
    `,
  });
}

async function sendOrderStatusEmail({ to, firstName, orderNumber, status }) {
  const resend = getResendClient();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const label = STATUS_LABELS[status];
  if (!label) return; // on n'envoie pas pour pending/paid

  const messages = {
    fabrication: 'Bonne nouvelle : votre sculpture est maintenant en cours de fabrication. Nous vous préviendrons dès qu\'elle sera expédiée.',
    shipped:     'Votre sculpture est en route ! Elle vous sera livrée dans les prochains jours.',
    delivered:   'Votre sculpture a été livrée. Nous espérons qu\'elle vous plaît !',
  };

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Commande ${orderNumber} - ${label}`,
    html: `
      <div style="font-family:sans-serif; max-width:480px; margin:auto; color:#12121a;">
        <h2 style="margin-bottom:4px;">Mise à jour de votre commande</h2>
        <p style="color:#555; margin-top:0;">Commande <strong>${orderNumber}</strong></p>
        <div style="background:#f5f5f5; border-radius:8px; padding:20px; margin:20px 0;">
          <p style="margin:0; font-size:18px; font-weight:600;">Statut : ${label}</p>
        </div>
        <p>${messages[status]}</p>
        <a href="${origin}/mes-commandes" style="display:inline-block;padding:12px 24px;background:#C9863A;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Voir ma commande
        </a>
        <p style="color:#888; font-size:12px; margin-top:32px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
      </div>
    `,
  });
}

module.exports = {
  sendResetPasswordEmail,
  sendContactEmail,
  sendContactConfirmationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};
