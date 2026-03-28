import React from 'react';
import { Link } from 'react-router-dom';
import './PlaceholderPage.css';

export default function PlaceholderPage({ title = 'Page en construction' }) {
  return (
    <div className="placeholder">
      <div className="placeholder__content">
        <span className="placeholder__icon">🎵</span>
        <h2 className="placeholder__title">{title}</h2>
        <p className="placeholder__text">
          Cette page arrive bientôt. En attendant, découvrez le configurateur.
        </p>
        <Link to="/createur" className="placeholder__cta">
          Créer ma sculpture
        </Link>
      </div>
    </div>
  );
}
