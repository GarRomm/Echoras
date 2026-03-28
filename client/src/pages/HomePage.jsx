import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <h2 className="hero__title">
            Transformez votre musique<br />
            <span className="hero__title--accent">en sculpture 3D</span>
          </h2>
          <p className="hero__subtitle">
            Importez un fichier audio, personnalisez la forme hélicoïdale générée
            depuis votre waveform, et recevez votre sculpture imprimée en 3D chez vous.
          </p>
          <div className="hero__actions">
            <Link to="/createur" className="hero__cta hero__cta--primary">
              Créer ma sculpture
            </Link>
            <Link to="/comment-ca-marche" className="hero__cta hero__cta--secondary">
              Comment ça marche
            </Link>
          </div>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__visual-ring" />
          <div className="hero__visual-ring hero__visual-ring--2" />
          <div className="hero__visual-ring hero__visual-ring--3" />
        </div>
      </section>
    </div>
  );
}
