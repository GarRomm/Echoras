import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import imgGallery1 from '../assets/disiz - melodrama feat. theodora (audio officiel).webp';
import imgGallery1Png from '../assets/disiz - melodrama feat. theodora (audio officiel).png';
import imgGallery2 from '../assets/Gazo, Tiakola - MAMI WATA (Clip Vidéo).webp';
import imgGallery2Png from '../assets/Gazo, Tiakola - MAMI WATA (Clip Vidéo).png';
import imgGallery3 from '../assets/Nada Surf - Always Love.webp';
import imgGallery3Png from '../assets/Nada Surf - Always Love.png';
import imgHero from '../assets/Image header.webp';
import imgHeroPng from '../assets/Image header.png';
import IconTeleverse from '../assets/icon-televerse.svg?react';
import IconPersonnalisez from '../assets/icon-personnalisez-sculpture.svg?react';
import IconRecevez from '../assets/icon-support-contact.svg?react';
import IconMateriaux from '../assets/icon-materiau.svg?react';
import IconPersonnalisationTotale from '../assets/icon-livraison.svg?react';
import IconPaiement from '../assets/icon-paiement.svg?react';

const STEPS = [
  {
    num: '1',
    title: 'Téléversez',
    desc: 'Importez un fichier audio depuis votre appareil et lancez la génération de votre sculpture.',
    icon: <IconTeleverse width="48" height="48" fill="#7B5EA7" aria-hidden="true" />,
  },
  {
    num: '2',
    title: 'Personnalisez',
    desc: "Ajustez la forme, le relief, les dimensions, les tours ou l'épaisseur pour créer un objet qui vous ressemble.",
    icon: <IconPersonnalisez width="48" height="48" fill="#7B5EA7" aria-hidden="true" />,
  },
  {
    num: '3',
    title: 'Recevez',
    desc: 'Choisissez votre matériau, validez votre création et recevez une sculpture imprimée en 3D, pensée comme une pièce unique.',
    icon: <IconRecevez width="48" height="48" fill="#7B5EA7" aria-hidden="true" />,
  },
];

const GALLERY_FALLBACK = [
  { id: 'fb1', renderUrl: imgGallery1, renderUrlPng: imgGallery1Png, name: 'Melodrama - Theodora', material: 'Résine violette translucide' },
  { id: 'fb2', renderUrl: imgGallery2, renderUrlPng: imgGallery2Png, name: 'Mami Wata - Gazo',     material: 'Métal noir satiné'         },
  { id: 'fb3', renderUrl: imgGallery3, renderUrlPng: imgGallery3Png, name: 'Always Love - Nada Surf', material: 'Céramique ivoire'       },
];

const TRUST = [
  {
    title: 'Matériaux de qualité',
    desc: 'Plastique mat, métal argenté ou doré, bois : chaque sculpture est fabriquée avec soin, comme un objet de collection.',
    icon: <IconMateriaux width="30" height="30" fill="white" aria-hidden="true" />,
  },
  {
    title: 'Personnalisation totale',
    desc: "Ajustez les paramètres clés de votre sculpture pour obtenir une forme fidèle à votre intention visuelle.",
    icon: <IconPersonnalisationTotale width="30" height="30" fill="white" aria-hidden="true" />,
  },
  {
    title: 'Paiement sécurisé',
    desc: "Commandez en toute confiance grâce à un parcours clair, un paiement sécurisé et un suivi de commande transparent.",
    icon: <IconPaiement width="30" height="30" fill="white" aria-hidden="true" />,
  },
];

export default function HomePage() {
  const [gallery, setGallery] = useState(GALLERY_FALLBACK);

  useEffect(() => { document.title = 'Echoras — Sculptures sonores 3D'; }, []);

  useEffect(() => {
    fetch('/api/sculptures/gallery')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setGallery(data.slice(0, 3));
        }
      })
      .catch(() => { /* garde le fallback */ });
  }, []);

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
          <picture>
            <source srcSet={imgHero} type="image/webp" />
            <img src={imgHeroPng} alt="Sculpture sonore Echoras" className="hero__img" fetchpriority="high" width="500" height="500" />
          </picture>
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
          {gallery.map((item) => (
            <article key={item.id} className="gallery__card">
              <div className="gallery__card-img-wrap">
                {item.renderUrlPng ? (
                  <picture>
                    <source srcSet={item.renderUrl} type="image/webp" />
                    <img src={item.renderUrlPng} alt={item.name} className="gallery__card-img" loading="lazy" width="900" height="507" />
                  </picture>
                ) : (
                  <img src={item.renderUrl} alt={item.name} className="gallery__card-img" loading="lazy" width="860" height="480" />
                )}
              </div>
              <div className="gallery__card-body">
                <h3 className="gallery__card-title">{item.name}</h3>
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
