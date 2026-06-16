import React from 'react';
import { Link } from 'react-router-dom';
import './CommentCaMarchePage.css';
import IconTeleverse from '../assets/icon-televerse.svg?react';
import IconCreation from '../assets/icon-creation.svg?react';
import IconPersonnalisezSculpture from '../assets/icon-personnalisez-sculpture.svg?react';
import IconMateriau from '../assets/icon-materiau.svg?react';
import IconVisualisez3D from '../assets/icon-tarif.svg?react';
import IconRecevez from '../assets/icon-recevez.svg?react';

// Ellipse décorative en haut à droite des cartes
function StepEllipse({ color }) {
  return <div className={`ccm__step-ellipse ccm__step-ellipse--${color}`} aria-hidden="true" />;
}

const STEPS = [
  {
    num: '1',
    title: '1.Téléversez votre musique',
    desc: "Importez un fichier audio depuis votre appareil. Echoras prend en charge plusieurs formats courants et prépare le son pour la génération de la sculpture.",
    icon: <IconTeleverse width="44" height="44" fill="#C9863A" aria-hidden="true" />,
    ellipseColor: 'violet',
  },
  {
    num: '2',
    title: '2.Générez une première forme',
    desc: "À partir des variations du son, de son rythme et de son intensité, Echoras crée une première interprétation sculptée de votre musique.",
    icon: <IconCreation width="44" height="44" fill="#C9863A" aria-hidden="true" />,
    ellipseColor: 'amber',
  },
  {
    num: '3',
    title: '3.Personnalisez la sculpture',
    desc: "Ajustez les paramètres de forme pour faire évoluer le rendu selon votre intention visuelle. Relief, lissage, dimensions, tours ou épaisseur vous permettent d'affiner la pièce.",
    icon: <IconPersonnalisezSculpture width="44" height="44" fill="#C9863A" aria-hidden="true" />,
    ellipseColor: 'mixed',
  },
  {
    num: '4',
    title: '4.Choisissez un matériau',
    desc: "Sélectionnez le matériau qui correspond le mieux à votre projet. Chaque finition donne une présence différente à la sculpture, plus douce, plus brute, plus brillante ou plus contemporaine.",
    icon: <IconMateriau width="44" height="44" fill="#C9863A" aria-hidden="true" />,
    ellipseColor: 'mixed',
  },
  {
    num: '5',
    title: '5. Visualisez en 3D',
    desc: "Explorez votre sculpture en temps réel depuis tous les angles grâce à la vue 3D interactive. Tournez, zoomez et affinez jusqu'à ce que le résultat vous convienne.",
    icon: <IconVisualisez3D width="44" height="44" fill="#C9863A" aria-hidden="true" />,
    ellipseColor: 'violet',
  },
  {
    num: '6',
    title: '6.Commandez votre sculpture',
    desc: "Ajoutez votre création au panier, validez votre commande et suivez son avancement depuis votre espace personnel.",
    icon: <IconRecevez width="44" height="44" fill="#C9863A" aria-hidden="true" />,
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
