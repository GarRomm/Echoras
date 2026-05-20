import React from 'react';
import './LegalPage.css';

export default function MentionsLegalesPage() {
  return (
    <main className="legal-page">
      <header className="legal-page__header">
        <div className="legal-page__header-content">
          <h1 className="legal-page__title">Mentions légales</h1>
          <p className="legal-page__subtitle">Dernière mise à jour : mai 2026</p>
        </div>
      </header>

      <div className="legal-page__body">

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">1. Éditeur du site</h2>
          <p>
            Le site Echoras (<strong>echoras.duckdns.org</strong>) est un projet étudiant réalisé dans le cadre
            du cursus <strong>MyDigitalSchool Paris</strong> — promotion 2026.
          </p>
          <p>Membres de l'équipe projet :</p>
          <ul>
            <li>VALLOT Carla</li>
            <li>ES-SABRY Hamza</li>
            <li>RODOMOND Nicolas</li>
            <li>FOLI Emma</li>
            <li>GARCIA Romain</li>
          </ul>
          <p>
            Contact : <a href="/contact">formulaire de contact</a> ou{' '}
            <a href="mailto:romainsics@gmail.com">romainsics@gmail.com</a>
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">2. Hébergement</h2>
          <p>
            Le site est hébergé sur un serveur privé virtuel (VPS) fourni par :
          </p>
          <p>
            <strong>Groupe LWS SARL</strong><br />
            2 rue Jules Ferry, 88190 Golbey, France<br />
            <a href="https://www.lws.fr" target="_blank" rel="noopener noreferrer">www.lws.fr</a>
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">3. Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur ce site (textes, images, logo, interface, code source)
            est la propriété exclusive de l'équipe Echoras. Toute reproduction, même partielle, est
            interdite sans autorisation préalable.
          </p>
          <p>
            Les fichiers audio importés par les utilisateurs restent leur propriété exclusive.
            Echoras n'en revendique aucun droit et ne les utilise qu'aux fins de génération de la
            sculpture commandée.
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">4. Limitation de responsabilité</h2>
          <p>
            Echoras est un projet à vocation pédagogique. L'équipe s'efforce de maintenir le site
            accessible et les informations à jour, mais ne peut garantir l'absence d'interruptions
            ou d'erreurs. L'utilisation du site se fait sous l'entière responsabilité de l'utilisateur.
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">5. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige,
            et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
          </p>
        </section>

      </div>
    </main>
  );
}
