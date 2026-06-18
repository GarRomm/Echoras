import React from 'react';
import './LegalPage.css';

export default function ConfidentialitePage() {
  return (
    <main className="legal-page">
      <header className="legal-page__header">
        <div className="legal-page__header-content">
          <h1 className="legal-page__title">Politique de confidentialité</h1>
          <p className="legal-page__subtitle">Dernière mise à jour : mai 2026</p>
        </div>
      </header>

      <div className="legal-page__body">

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données collectées sur ce site est l'équipe Echoras,
            projet étudiant réalisé à <strong>MyDigitalSchool Paris</strong> (promotion 2026).
          </p>
          <p>
            Contact : <a href="/contact">formulaire de contact</a> ou{' '}
            <a href="mailto:romainsics@gmail.com">romainsics@gmail.com</a>
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">2. Données collectées</h2>
          <table className="legal-page__table">
            <thead>
              <tr>
                <th>Donnée</th>
                <th>Finalité</th>
                <th>Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Adresse e-mail</strong></td>
                <td>Création et gestion du compte, envoi d'e-mails transactionnels</td>
                <td>Durée de vie du compte</td>
              </tr>
              <tr>
                <td><strong>Mot de passe</strong></td>
                <td>Authentification (stocké chiffré via bcrypt, jamais en clair)</td>
                <td>Durée de vie du compte</td>
              </tr>
              <tr>
                <td><strong>Adresse de livraison</strong></td>
                <td>Traitement et livraison des commandes</td>
                <td>Durée de vie du compte</td>
              </tr>
              <tr>
                <td><strong>Fichiers audio</strong></td>
                <td>Génération de la sculpture 3D (analyse locale dans le navigateur)</td>
                <td>Supprimés après livraison de la commande</td>
              </tr>
              <tr>
                <td><strong>Sculptures et paramètres</strong></td>
                <td>Sauvegarde des créations, fabrication à la commande</td>
                <td>Durée de vie du compte</td>
              </tr>
              <tr>
                <td><strong>Historique de commandes</strong></td>
                <td>Suivi des commandes, service client</td>
                <td>5 ans (obligation légale comptable)</td>
              </tr>
              <tr>
                <td><strong>Messages de contact</strong></td>
                <td>Traitement des demandes d'assistance</td>
                <td>1 an</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">3. Base légale des traitements</h2>
          <ul>
            <li><strong>Exécution du contrat</strong> : compte utilisateur, commandes, livraison</li>
            <li><strong>Intérêt légitime</strong> : sécurité du site, prévention des abus</li>
            <li><strong>Consentement</strong> : cookies non essentiels (recueilli via tarteaucitron)</li>
            <li><strong>Obligation légale</strong> : conservation des données de commande (5 ans)</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">4. Destinataires des données</h2>
          <p>
            Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.
            Elles peuvent être transmises aux sous-traitants techniques suivants, dans le strict
            cadre du fonctionnement du service :
          </p>
          <ul>
            <li>
              <strong>LWS (Groupe LWS SARL)</strong> - hébergement du serveur (données stockées en France)
            </li>
            <li>
              <strong>Resend</strong> - envoi des e-mails transactionnels (reset de mot de passe,
              confirmation de contact). Les e-mails ne sont pas stockés sur nos serveurs.
            </li>
            <li>
              <strong>Partenaire imprimeur</strong> - transmission du fichier STL de la sculpture
              uniquement (aucune donnée personnelle identifiante n'est transmise)
            </li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">5. Sécurité des données</h2>
          <ul>
            <li>Mots de passe chiffrés via <strong>bcrypt</strong> (algorithme de hachage irréversible)</li>
            <li>Sessions gérées par des tokens <strong>JWT</strong> stockés dans des cookies <strong>HttpOnly</strong> (inaccessibles depuis le navigateur, résistants au vol)</li>
            <li>Toutes les communications chiffrées en <strong>HTTPS</strong></li>
            <li>Limiteur de requêtes actif (100 requêtes max par 15 minutes par adresse IP)</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">6. Cookies</h2>
          <p>
            Le site utilise deux catégories de cookies :
          </p>
          <ul>
            <li>
              <strong>Cookies techniques obligatoires</strong> (exemptés de consentement, art. 82 de
              la loi Informatique et Libertés) : cookie de session JWT, nécessaire au maintien de
              votre connexion.
            </li>
            <li>
              <strong>Cookies de paiement</strong> : lors du processus de paiement, Stripe dépose
              des cookies techniques nécessaires à la sécurisation de la transaction (détection de
              fraude). Ces cookies sont considérés comme techniquement nécessaires à l'exécution
              du contrat et sont exemptés de consentement au même titre que les cookies de session.
            </li>
          </ul>
          <p>
            Vous pouvez à tout moment modifier vos préférences cookies en cliquant sur l'icône
            de gestion des cookies en bas à droite de l'écran.
          </p>
        </section>

        <section className="legal-page__section">
          <h2 className="legal-page__section-title">7. Vos droits</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
            Informatique et Libertés, vous disposez des droits suivants :
          </p>
          <ul>
            <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes (via la page Profil)</li>
            <li><strong>Droit à l'effacement</strong> : demander la suppression de votre compte et de vos données</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous via le{' '}
            <a href="/contact">formulaire de contact</a> ou à l'adresse{' '}
            <a href="mailto:romainsics@gmail.com">romainsics@gmail.com</a>.
            Nous répondrons dans un délai de 30 jours.
          </p>
          <p>
            Vous avez également le droit d'introduire une réclamation auprès de la{' '}
            <strong>CNIL</strong> (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
          </p>
        </section>

      </div>
    </main>
  );
}
