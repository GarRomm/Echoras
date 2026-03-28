import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <Link to="/" className="header__brand" onClick={closeMenu}>
        <span className="header__title">Echoras</span>
        <span className="header__subtitle">Le Souvenir Musical</span>
      </Link>

      <nav className={`header__nav${menuOpen ? ' header__nav--open' : ''}`} aria-label="Navigation principale">
        <NavLink to="/" end className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Accueil</NavLink>
        <NavLink to="/createur" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Créer</NavLink>
        <NavLink to="/galerie" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Galerie</NavLink>
        <NavLink to="/comment-ca-marche" className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`} onClick={closeMenu}>Comment ça marche</NavLink>
      </nav>

      <div className="header__actions">
        {/* Slot auth — fonctionnel en Phase 2 */}
        <button className="header__btn-account" aria-label="Mon compte" title="Mon compte (bientôt disponible)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>

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
