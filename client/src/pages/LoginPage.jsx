import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginPage() {
  useEffect(() => { document.title = 'Connexion - Echoras'; }, []);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Connexion</h1>
        <p className="auth-card__subtitle">Accédez à votre espace Echoras</p>

        {error && <p className="auth-card__error" role="alert">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
            <label className="auth-form__label" htmlFor="password">Mot de passe</label>
            <input
              className="auth-form__input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth-form__forgot">
            <Link to="/mot-de-passe-oublie" className="auth-form__link">Mot de passe oublié ?</Link>
          </div>

          <button className="auth-form__submit" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-card__switch">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="auth-form__link">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
