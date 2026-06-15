import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoEchoras from '../assets/echora_test2.svg';
import IconProfil from '../assets/icon-profil.svg?react';
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
        <img src={logoEchoras} alt="ECHORAS" className="header__logo" />
      </Link>

      <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`} aria-label="Navigation principale">
        <NavLink to="/" end className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Echoras</NavLink>
        <NavLink to="/comment-ca-marche" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Comment ça marche ?</NavLink>
        <NavLink to="/createur" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Studio 3D</NavLink>
        <NavLink to="/galerie" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Galerie</NavLink>
        <NavLink to="/faq" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>FAQ</NavLink>
        <NavLink to="/contact" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Contact</NavLink>
      </nav>

      <div className="header__actions">
        {user ? (
          <>
            <Link to="/panier" className="header__btn-cart" aria-label="Mon panier">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </Link>
            <div className="header__account" ref={accountRef}>
            <button
              className="header__btn-account header__btn-account--logged"
              aria-label="Mon compte"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((v) => !v)}
            >
              <IconProfil width="20" height="20" aria-hidden="true" fill="currentColor" />
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
          </>
        ) : (
          <Link to="/connexion" className="header__btn-account" aria-label="Se connecter">
            <IconProfil width="20" height="20" aria-hidden="true" fill="currentColor" />
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
