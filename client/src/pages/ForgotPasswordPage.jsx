import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

function ForgotForm({ forgotPassword }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="auth-card__success">
        <p>{message}</p>
        <Link to="/connexion" className="auth-form__link">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="auth-card__error" role="alert">{error}</p>}
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="email">Votre adresse email</label>
        <input
          className="auth-form__input"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button className="auth-form__submit" type="submit" disabled={loading}>
        {loading ? 'Envoi…' : 'Envoyer le lien'}
      </button>
    </form>
  );
}

function ResetForm({ resetPassword, token }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 8) return setError('Au moins 8 caractères');
    setLoading(true);
    try {
      const res = await resetPassword(token, form.password);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="auth-card__success">
        <p>{message}</p>
        <Link to="/connexion" className="auth-form__link">Se connecter</Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="auth-card__error" role="alert">{error}</p>}
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="password">Nouveau mot de passe <span className="auth-form__hint">(8 min.)</span></label>
        <input
          className="auth-form__input"
          id="password"
          name="password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
      </div>
      <div className="auth-form__group">
        <label className="auth-form__label" htmlFor="confirm">Confirmer</label>
        <input
          className="auth-form__input"
          id="confirm"
          name="confirm"
          type="password"
          required
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
        />
      </div>
      <button className="auth-form__submit" type="submit" disabled={loading}>
        {loading ? 'Mise à jour…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">
          {token ? 'Nouveau mot de passe' : 'Mot de passe oublié'}
        </h1>
        <p className="auth-card__subtitle">
          {token
            ? 'Choisissez un nouveau mot de passe pour votre compte.'
            : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
        </p>

        {token
          ? <ResetForm resetPassword={resetPassword} token={token} />
          : <ForgotForm forgotPassword={forgotPassword} />}

        <p className="auth-card__switch">
          <Link to="/connexion" className="auth-form__link">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
