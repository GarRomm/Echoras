import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header__brand">
        <h1 className="header__title">Echoras</h1>
        <span className="header__subtitle">Le Souvenir Musical</span>
      </div>
    </header>
  );
}
