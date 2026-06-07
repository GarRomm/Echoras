import React from 'react';
import { Link } from 'react-router-dom';
import './CommentCaMarchePage.css';

// Icône Upload
function IconUpload() {
  return (
    <svg width="38" height="45" viewBox="0 0 38 45" fill="none" aria-hidden="true">
      <path d="M19 32V12M8 21l11-11 11 11" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 36v3a2 2 0 002 2h24a2 2 0 002-2v-3" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Icône Forme d'onde
function IconWaveform() {
  return (
    <svg width="37" height="40" viewBox="0 0 37 40" fill="none" aria-hidden="true">
      <rect x="2" y="14" width="4" height="12" rx="2" fill="#C9863A"/>
      <rect x="10" y="6" width="4" height="28" rx="2" fill="#C9863A"/>
      <rect x="18" y="10" width="4" height="20" rx="2" fill="#C9863A"/>
      <rect x="26" y="4" width="4" height="32" rx="2" fill="#C9863A"/>
      <rect x="34" y="12" width="3" height="16" rx="1.5" fill="#C9863A"/>
    </svg>
  );
}

// Icône Sliders
function IconSliders() {
  return (
    <svg width="44" height="42" viewBox="0 0 44 42" fill="none" aria-hidden="true">
      <path d="M4 10h36M4 21h36M4 32h36" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="14" cy="10" r="4" fill="#12121A" stroke="#C9863A" strokeWidth="2.5"/>
      <circle cx="28" cy="21" r="4" fill="#12121A" stroke="#C9863A" strokeWidth="2.5"/>
      <circle cx="18" cy="32" r="4" fill="#12121A" stroke="#C9863A" strokeWidth="2.5"/>
    </svg>
  );
}

// Icône Matériau
function IconMaterial() {
  return (
    <svg width="44" height="47" viewBox="0 0 44 47" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="36" height="30" rx="4" stroke="#C9863A" strokeWidth="2.5"/>
      <path d="M4 20h36" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 34v9M30 34v9" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8 43h28" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// Icône Aperçu / Photo
function IconPreview() {
  return (
    <svg width="44" height="41" viewBox="0 0 44 41" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="38" height="28" rx="4" stroke="#C9863A" strokeWidth="2.5"/>
      <circle cx="22" cy="22" r="7" stroke="#C9863A" strokeWidth="2.5"/>
      <path d="M15 8l3-5h8l3 5" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Icône Commande
function IconOrder() {
  return (
    <svg width="78" height="44" viewBox="0 0 78 44" fill="none" aria-hidden="true">
      <path d="M4 8h10l6 20h38l6-14H18" stroke="#C9863A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="30" cy="38" r="3.5" stroke="#C9863A" strokeWidth="2.5"/>
      <circle cx="56" cy="38" r="3.5" stroke="#C9863A" strokeWidth="2.5"/>
    </svg>
  );
}

// Ellipse décorative en haut à droite des cartes
function StepEllipse({ color }) {
  return <div className={`ccm__step-ellipse ccm__step-ellipse--${color}`} aria-hidden="true" />;
}

const STEPS = [
  {
    num: '1',
    title: '1.Téléversez votre musique',
    desc: "Importez un fichier audio depuis votre appareil. Echoras prend en charge plusieurs formats courants et prépare le son pour la génération de la sculpture.",
    icon: <IconUpload />,
    ellipseColor: 'violet',
  },
  {
    num: '2',
    title: '2.Générez une première forme',
    desc: "À partir des variations du son, de son rythme et de son intensité, Echoras crée une première interprétation sculptée de votre musique.",
    icon: <IconWaveform />,
    ellipseColor: 'amber',
  },
  {
    num: '3',
    title: '3.Personnalisez la sculpture',
    desc: "Ajustez les paramètres de forme pour faire évoluer le rendu selon votre intention visuelle. Relief, lissage, dimensions, tours ou épaisseur vous permettent d'affiner la pièce.",
    icon: <IconSliders />,
    ellipseColor: 'mixed',
  },
  {
    num: '4',
    title: '4.Choisissez un matériau',
    desc: "Sélectionnez le matériau qui correspond le mieux à votre projet. Chaque finition donne une présence différente à la sculpture, plus douce, plus brute, plus brillante ou plus contemporaine.",
    icon: <IconMaterial />,
    ellipseColor: 'mixed',
  },
  {
    num: '5',
    title: '5. Visualisez en 3D',
    desc: "Explorez votre sculpture en temps réel depuis tous les angles grâce à la vue 3D interactive. Tournez, zoomez et affinez jusqu'à ce que le résultat vous convienne.",
    icon: <IconPreview />,
    ellipseColor: 'violet',
  },
  {
    num: '6',
    title: '6.Commandez votre sculpture',
    desc: "Ajoutez votre création au panier, validez votre commande et suivez son avancement depuis votre espace personnel.",
    icon: <IconOrder />,
    ellipseColor: 'amber',
  },
];

const FREQ_BARS = [70, 140, 280, 200, 140, 90];

export default function CommentCaMarchePage() {
  return (
    <div className="ccm">
      {/* Section hero */}
      <section className="ccm__hero">
        <div className="ccm__hero-content">
          <h1 className="ccm__hero-title">De la fréquence à l'objet</h1>
          <p className="ccm__hero-desc">
            De la musique à la matière : Echoras transforme un fichier audio en sculpture 3D
            unique, pensée comme un objet à conserver, exposer ou offrir.
          </p>
        </div>
        <div className="ccm__freq-visual" aria-hidden="true">
          {FREQ_BARS.map((h, i) => (
            <div key={i} className="ccm__freq-bar" style={{ height: h }} />
          ))}
        </div>
      </section>

      {/* Section processus */}
      <section className="ccm__process">
        <p className="ccm__process-intro">
          La création d'une sculpture Echoras suit un parcours en six étapes, pensé pour rester
          lisible, progressif et personnalisable.
        </p>
        <div className="ccm__steps">
          {STEPS.map((step) => (
            <article key={step.num} className="ccm__step-card">
              <div className="ccm__step-icon">{step.icon}</div>
              <h2 className="ccm__step-title">{step.title}</h2>
              <p className="ccm__step-desc">{step.desc}</p>
              <StepEllipse color={step.ellipseColor} />
            </article>
          ))}
        </div>
      </section>

      {/* Section CTA */}
      <section className="ccm__cta">
        <h2 className="ccm__cta-title">
          Prêt·e à transformer une musique en souvenir&nbsp;?
        </h2>
        <div className="ccm__cta-buttons">
          <Link to="/createur" className="ccm__btn ccm__btn--primary">
            Créer ma sculpture&nbsp;→
          </Link>
          <Link to="/galerie" className="ccm__btn ccm__btn--secondary">
            Voir la galerie
          </Link>
        </div>
      </section>
    </div>
  );
}
