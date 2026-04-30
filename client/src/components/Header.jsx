import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    await logout();
    setAccountOpen(false);
    navigate('/');
  }

  // Ferme le dropdown compte si clic extérieur
  useEffect(() => {
    function onClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="header">
      <Link to="/" className="header__brand" onClick={closeMenu}>
        <span className="header__logo-text">ECHORAS</span>
      </Link>

      <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`} aria-label="Navigation principale">
        <NavLink to="/" end className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Echoras</NavLink>
        <NavLink to="/comment-ca-marche" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Comment ça marche ?</NavLink>
        <NavLink to="/createur" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Studio 3D</NavLink>
        <NavLink to="/galerie" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Galerie</NavLink>
        <NavLink to="/faq" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>FAQ</NavLink>
      </nav>

      <div className="header__actions">
        {user ? (
          <div className="header__account" ref={accountRef}>
            <button
              className="header__btn-account header__btn-account--logged"
              aria-label="Mon compte"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span className="header__account-name">{user.firstName}</span>
            </button>

            {accountOpen && (
              <div className="header__account-dropdown">
                <div className="header__account-email">{user.email}</div>
                <Link to="/profil" className="header__account-item" onClick={() => setAccountOpen(false)}>Mon profil</Link>
                <Link to="/mes-creations" className="header__account-item" onClick={() => setAccountOpen(false)}>Mes créations</Link>
                <Link to="/mes-commandes" className="header__account-item" onClick={() => setAccountOpen(false)}>Mes commandes</Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="header__account-item" onClick={() => setAccountOpen(false)}>Administration</Link>
                )}
                <button className="header__account-item header__account-item--logout" onClick={handleLogout}>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/connexion" className="header__btn-account" aria-label="Se connecter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
        )}

        <button
          className={`header__hamburger${menuOpen ? ' header__hamburger--open' : ''}`}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
