import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__brand">Echoras</span>
        <nav className="footer__nav" aria-label="Liens légaux">
          <Link to="/mentions-legales" className="footer__nav-link">Mentions légales</Link>
          <Link to="/confidentialite" className="footer__nav-link">Confidentialité</Link>
          <Link to="/faq" className="footer__nav-link">Contact</Link>
        </nav>
        <span className="footer__copy">© {year} Echoras — Le Souvenir Musical</span>
      </div>
    </footer>
  );
}
