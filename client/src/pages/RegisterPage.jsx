import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Les mots de passe ne correspondent pas');
    }
    if (form.password.length < 8) {
      return setError('Le mot de passe doit faire au moins 8 caractères');
    }

    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Créer un compte</h1>
        <p className="auth-card__subtitle">Sauvegardez vos créations et suivez vos commandes</p>

        {error && <p className="auth-card__error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__row">
            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="firstName">Prénom</label>
              <input
                className="auth-form__input"
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="lastName">Nom</label>
              <input
                className="auth-form__input"
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="email">Email</label>
            <input
              className="auth-form__input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="password">Mot de passe <span className="auth-form__hint">(8 caractères min.)</span></label>
            <input
              className="auth-form__input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="confirm">Confirmer le mot de passe</label>
            <input
              className="auth-form__input"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button className="auth-form__submit" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-card__switch">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="auth-form__link">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
