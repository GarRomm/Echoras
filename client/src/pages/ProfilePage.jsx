import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

function IconDashboard() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPencilRuler() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 7l4 4L7 21H3v-4L13 7z" />
      <path d="M14 6l4 4" />
      <path d="M3 21l4-4" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconUserCircle() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.168 18.849A4 4 0 0110 16h4a4 4 0 013.834 2.855" />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    city: '',
    country: '',
    currentPassword: '',
    newPassword: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Mon compte | Echoras';
    return () => { document.title = 'Echoras'; };
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        zipCode: user.zipCode || '',
        city: user.city || '',
        country: user.country || '',
      }));
    }
  }, [user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFeedback(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');
      setFeedback({ type: 'success', message: 'Informations mises à jour avec succès.' });
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="profile">
      <div className="profile__layout">
        {/* Sidebar */}
        <aside className="profile__sidebar" aria-label="Navigation du compte">
          <div className="sidebar__top">
            <div className="sidebar__logo-area">
              <svg className="sidebar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="3" x2="21" y2="21" />
                <line x1="21" y1="3" x2="3" y2="21" />
              </svg>
              <div className="sidebar__logo-text">
                <span className="sidebar__logo-name">Echoras</span>
                <span className="sidebar__logo-slogan">L'Atelier Phygital</span>
              </div>
            </div>

            <nav className="sidebar__nav" aria-label="Sections du compte">
              <Link to="/profil" className="sidebar__link">
                <IconDashboard />
                Tableau de bord
              </Link>
              <NavLink
                to="/mes-creations"
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <IconPencilRuler />
                Mes créations
              </NavLink>
              <NavLink
                to="/mes-commandes"
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <IconShoppingBag />
                Mes commandes
              </NavLink>
              <Link to="/profil" className="sidebar__link sidebar__link--active">
                <IconUserCircle />
                Mon compte
              </Link>
            </nav>
          </div>

          <div className="sidebar__bottom">
            <Link to="/faq" className="sidebar__link sidebar__link--light">
              <IconQuestion />
              Aide
            </Link>
            <button className="sidebar__link sidebar__link--light" onClick={handleLogout}>
              <IconSignOut />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal */}
        <section className="profile__content" aria-labelledby="profile-heading">
          <h1 className="profile__title" id="profile-heading">Informations personnelles</h1>

          <form className="profile__form" onSubmit={handleSubmit} noValidate>
            {/* Prénom + Nom */}
            <div className="form__row">
              <div className="form__field form__field--half">
                <label className="form__label" htmlFor="firstName">Prénom</label>
                <input
                  className="form__input"
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
              </div>
              <div className="form__field form__field--half">
                <label className="form__label" htmlFor="lastName">Nom</label>
                <input
                  className="form__input"
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form__field">
              <label className="form__label" htmlFor="email">Email</label>
              <input
                className="form__input"
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            {/* Téléphone */}
            <div className="form__field">
              <label className="form__label" htmlFor="phone">Téléphone</label>
              <input
                className="form__input"
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            {/* Adresse */}
            <div className="form__field">
              <label className="form__label" htmlFor="address">Adresse</label>
              <input
                className="form__input"
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                autoComplete="street-address"
              />
            </div>

            {/* Code postal + Ville */}
            <div className="form__row">
              <div className="form__field form__field--half">
                <label className="form__label" htmlFor="zipCode">Code postal</label>
                <input
                  className="form__input"
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={form.zipCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                />
              </div>
              <div className="form__field form__field--half">
                <label className="form__label" htmlFor="city">Ville</label>
                <input
                  className="form__input"
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                />
              </div>
            </div>

            {/* Pays */}
            <div className="form__field">
              <label className="form__label" htmlFor="country">Pays</label>
              <input
                className="form__input"
                id="country"
                name="country"
                type="text"
                value={form.country}
                onChange={handleChange}
                autoComplete="country-name"
              />
            </div>

            {/* Mot de passe */}
            <div className="form__row form__row--password">
              <div className="form__field form__field--half">
                <p className="form__section-title">Modifier le mot de passe</p>
                <label className="form__label" htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  className="form__input"
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <div className="form__field form__field--half">
                <label className="form__label" htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  className="form__input"
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {feedback && (
              <div
                className={`profile__feedback profile__feedback--${feedback.type}`}
                role="alert"
                aria-live="polite"
              >
                {feedback.message}
              </div>
            )}

            <button className="form__submit" type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
