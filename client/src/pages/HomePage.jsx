import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import imgGallery1 from '../assets/disiz - melodrama feat. theodora (audio officiel).png';
import imgGallery2 from '../assets/Gazo, Tiakola - MAMI WATA (Clip Vidéo).png';
import imgGallery3 from '../assets/Nada Surf - Always Love.png';
import imgHero from '../assets/Image header.png';

const STEPS = [
  {
    num: '1',
    title: 'Téléversez',
    desc: 'Importez un fichier audio depuis votre appareil et lancez la génération de votre sculpture.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M8 32v8h32v-8M24 8v24M14 18l10-10 10 10" stroke="#7B5EA7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '2',
    title: 'Personnalisez',
    desc: "Ajustez la forme, le relief, les dimensions, les tours ou l'épaisseur pour créer un objet qui vous ressemble.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="#7B5EA7" strokeWidth="2.5"/>
        <path d="M16 24h16M24 16v16" stroke="#7B5EA7" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '3',
    title: 'Recevez',
    desc: 'Choisissez votre matériau, validez votre création et recevez une sculpture imprimée en 3D, pensée comme une pièce unique.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M8 16l16-8 16 8v16l-16 8L8 32V16z" stroke="#7B5EA7" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M24 8v32M8 16l16 8 16-8" stroke="#7B5EA7" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const GALLERY = [
  { img: imgGallery1, title: 'Melodrama - Theodora', material: 'Résine violette translucide' },
  { img: imgGallery2, title: 'Mami Wata - Gazo', material: 'Métal noir satiné' },
  { img: imgGallery3, title: 'Always Love - Nada Surf', material: 'Céramique ivoire' },
];

const TRUST = [
  {
    title: 'Matériaux de qualité',
    desc: 'Bronze, résine, céramique ou finitions texturées : chaque sculpture est fabriquée avec soin, comme un objet de collection.',
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <polygon points="15,3 18.5,11 27,11.5 21,17.5 23,26 15,21.5 7,26 9,17.5 3,11.5 11.5,11" stroke="white" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Personnalisation totale',
    desc: "Ajustez les paramètres clés de votre sculpture pour obtenir une forme fidèle à votre intention visuelle.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path d="M5 15h20M5 8h20M5 22h20" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="8" r="2.5" fill="white"/>
        <circle cx="20" cy="15" r="2.5" fill="white"/>
        <circle cx="12" cy="22" r="2.5" fill="white"/>
      </svg>
    ),
  },
  {
    title: 'Paiement sécurisé',
    desc: "Commandez en toute confiance grâce à un parcours clair, un paiement sécurisé et un suivi de commande transparent.",
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="22" height="16" rx="3" stroke="white" strokeWidth="1.8"/>
        <path d="M10 10V7a5 5 0 0110 0v3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="15" cy="18" r="2.5" fill="white"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="home">

      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Sculpter la musique, conserver l'émotion</h1>
          <p className="hero__subtitle">
            Echoras transforme une musique en objet. Une sculpture 3D conçue à partir du son,
            pour faire exister autrement ce qui se vivait jusque-là dans l'écoute.
          </p>
          <div className="hero__actions">
            <Link to="/createur" className="hero__cta hero__cta--primary">Créer ma sculpture</Link>
            <Link to="/comment-ca-marche" className="hero__cta hero__cta--secondary">Comment ça marche</Link>
          </div>
        </div>
        <div className="hero__visual">
          <img src={imgHero} alt="Sculpture sonore Echoras" className="hero__img" />
        </div>
      </section>

      <section className="concept">
        <div className="concept__header">
          <h2 className="concept__title">L'union du son et de la matière</h2>
          <p className="concept__subtitle">
            Une musique ne se vit pas seulement dans le temps. Avec Echoras, elle prend volume,
            relief et matière pour devenir un objet à contempler, conserver ou offrir.
          </p>
        </div>
        <div className="concept__steps">
          {STEPS.map((step) => (
            <div key={step.num} className="concept__step">
              <div className="concept__step-icon">{step.icon}</div>
              <div className="concept__step-body">
                <h3 className="concept__step-title">{step.num}. {step.title}</h3>
                <p className="concept__step-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery">
        <div className="gallery__header">
          <h2 className="gallery__title">Galerie d'Échos</h2>
          <Link to="/galerie" className="gallery__link">Explorer tout</Link>
        </div>
        <div className="gallery__grid">
          {GALLERY.map((item) => (
            <article key={item.title} className="gallery__card">
              <div className="gallery__card-img-wrap">
                <img src={item.img} alt={item.title} className="gallery__card-img" />
              </div>
              <div className="gallery__card-body">
                <h3 className="gallery__card-title">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="trust">
        {TRUST.map((item) => (
          <div key={item.title} className="trust__item">
            <div className="trust__icon">{item.icon}</div>
            <div className="trust__body">
              <h3 className="trust__label">{item.title}</h3>
              <p className="trust__desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

    </div>
  );
}
