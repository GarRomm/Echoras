import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL, apiFetch } from '../services/api';
import './ContactPage.css';

const SUBJECTS = [
  'Commande en cours',
  'Sculpture & personnalisation',
  'Paiement',
  'Autre',
];

function IconMail() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="var(--accent)" strokeWidth="2"/>
      <path d="M14 24l8 8 12-14" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact — Echoras'; }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await apiFetch(`${BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-page">
        <div className="contact-page__success">
          <IconCheck />
          <h1 className="contact-page__success-title">Message envoyé !</h1>
          <p className="contact-page__success-desc">
            Merci de nous avoir contactés. Nous vous répondrons sous 24–48h ouvrées.<br />
            Un email de confirmation vous a été envoyé.
          </p>
          <Link to="/" className="contact-page__back-btn">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <section className="contact-page__header">
        <div className="contact-page__header-content">
          <h1 className="contact-page__title">Une question ?</h1>
          <p className="contact-page__subtitle">
            L'équipe Echoras vous répond sous 24–48h ouvrées. Pour les questions courantes,
            consultez d'abord notre <Link to="/faq" className="contact-page__faq-link">FAQ</Link>.
          </p>
        </div>
      </section>

      <div className="contact-page__body">
        <div className="contact-page__card">
          <div className="contact-page__card-header">
            <IconMail />
            <span>Formulaire de contact</span>
          </div>

          {status === 'error' && (
            <p className="contact-page__error" role="alert">{errorMsg}</p>
          )}

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form__row">
              <div className="contact-form__group">
                <label className="contact-form__label" htmlFor="name">Nom</label>
                <input
                  className="contact-form__input"
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                />
              </div>
              <div className="contact-form__group">
                <label className="contact-form__label" htmlFor="email">Email</label>
                <input
                  className="contact-form__input"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="contact-form__group">
              <label className="contact-form__label" htmlFor="subject">Sujet</label>
              <select
                className="contact-form__input contact-form__select"
                id="subject"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
              >
                <option value="">Sélectionnez un sujet</option>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="contact-form__group">
              <label className="contact-form__label" htmlFor="message">Message</label>
              <textarea
                className="contact-form__input contact-form__textarea"
                id="message"
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Décrivez votre question ou votre problème…"
              />
            </div>

            <button
              className="contact-form__submit"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Envoi en cours…' : 'Envoyer le message'}
            </button>
          </form>
        </div>

        <div className="contact-page__info">
          <div className="contact-page__info-block">
            <h3 className="contact-page__info-title">Délai de réponse</h3>
            <p className="contact-page__info-text">24–48h ouvrées</p>
          </div>
          <div className="contact-page__info-block">
            <h3 className="contact-page__info-title">Questions fréquentes</h3>
            <p className="contact-page__info-text">
              Consultez notre <Link to="/faq" className="contact-page__faq-link">FAQ</Link> pour les questions sur les matériaux, délais de livraison et personnalisation.
            </p>
          </div>
          <div className="contact-page__info-block">
            <h3 className="contact-page__info-title">Suivi de commande</h3>
            <p className="contact-page__info-text">
              Connectez-vous à votre espace et consultez <Link to="/mes-commandes" className="contact-page__faq-link">Mes commandes</Link> pour le statut en temps réel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
