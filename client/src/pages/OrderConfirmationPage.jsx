import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderNumber = state?.orderNumber || 'ZOD-00000';
  const sculptureName = state?.sculptureName || 'Ma sculpture';
  const total = state?.total ?? 0;
  const address = state?.address || '';
  const deliveryDate = state?.deliveryDate || '';

  return (
    <div className="confirm">
      <div className="confirm__container">

        {/* ─── COLONNE GAUCHE ─── */}
        <div className="confirm__left">

          {/* Badge + Titre */}
          <div className="confirm__header">
            <div className="confirm__badge">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="#C9863A" strokeWidth="1.5" />
                <path d="M6 10l3 3 5-5" stroke="#C9863A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Commande validée</span>
            </div>

            <h1 className="confirm__title">Commande<br />confirmée</h1>

            <p className="confirm__desc">
              Votre commande a bien été enregistrée. Votre sculpture va désormais passer en préparation, puis en fabrication.
            </p>

            <div className="confirm__order-tag">
              Numéro de commande&nbsp;: <strong>#{orderNumber}</strong>
            </div>

            <p className="confirm__email-notice">
              Un e-mail de confirmation vous a été envoyé avec le récapitulatif de votre commande.
            </p>
          </div>

          {/* Prochaines étapes */}
          <div className="confirm__steps">
            <h2 className="confirm__steps-title">Prochaines étapes</h2>

            <ol className="confirm__steps-list">
              <li className="confirm__step confirm__step--active">
                <div className="confirm__step-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="14" fill="rgba(18,18,26,0.15)" />
                    <path d="M8 14l4 4 8-8" stroke="#12121A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="confirm__step-body">
                  <span className="confirm__step-label">Fabrication</span>
                  <p className="confirm__step-desc">
                    Nos équipes préparent votre sculpture à partir des réglages et du matériau sélectionnés.
                  </p>
                  <span className="confirm__step-status">
                    <span className="confirm__step-dot confirm__step-dot--active" />
                    En cours
                  </span>
                </div>
              </li>

              <li className="confirm__step">
                <div className="confirm__step-icon confirm__step-icon--muted" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="14" fill="rgba(18,18,26,0.08)" />
                    <path d="M6 14h10M12 10l4 4-4 4" stroke="rgba(18,18,26,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="confirm__step-body confirm__step-body--muted">
                  <span className="confirm__step-label">Expédition</span>
                  <p className="confirm__step-desc">
                    Une fois la fabrication terminée, votre commande sera emballée et remise au transporteur.
                  </p>
                </div>
              </li>

              <li className="confirm__step">
                <div className="confirm__step-icon confirm__step-icon--muted" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="14" fill="rgba(18,18,26,0.08)" />
                    <circle cx="14" cy="14" r="5" stroke="rgba(18,18,26,0.4)" strokeWidth="1.6" />
                    <path d="M14 11v3l2 2" stroke="rgba(18,18,26,0.4)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="confirm__step-body confirm__step-body--muted">
                  <span className="confirm__step-label">Suivi</span>
                  <p className="confirm__step-desc">
                    Vous pourrez suivre l'avancement de votre commande depuis votre espace personnel dès qu'elle sera expédiée.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Boutons d'action */}
          <div className="confirm__actions">
            <button
              className="confirm__btn confirm__btn--primary"
              onClick={() => navigate('/mes-commandes')}
            >
              Suivre ma commande
            </button>
            <button
              className="confirm__btn confirm__btn--outline"
              onClick={() => navigate('/mes-commandes')}
            >
              Voir mes commandes
            </button>
          </div>

          <button
            className="confirm__back"
            onClick={() => navigate('/')}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M17 7H1M1 7l6-6M1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour à l'accueil
          </button>
        </div>

        {/* ─── COLONNE DROITE ─── */}
        <aside className="confirm__card">
          <div className="confirm__card-preview">
            <span className="confirm__card-tag">Aperçu de la création</span>
          </div>

          <div className="confirm__card-info">
            <div className="confirm__card-row">
              <span className="confirm__card-name">{sculptureName}</span>
              <span className="confirm__card-price">{parseFloat(total).toFixed(0)} €</span>
            </div>

            <div className="confirm__card-details">
              {address && (
                <div className="confirm__card-detail">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
                    <path d="M8 1C4.686 1 2 3.686 2 7c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z" stroke="#12121A" strokeWidth="1.4" />
                    <circle cx="8" cy="7" r="2" stroke="#12121A" strokeWidth="1.4" />
                  </svg>
                  <div>
                    <span className="confirm__card-detail-label">Adresse de livraison</span>
                    <span className="confirm__card-detail-value">{address}</span>
                  </div>
                </div>
              )}

              {deliveryDate && (
                <div className="confirm__card-detail">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="2" y="3" width="16" height="15" rx="2" stroke="#12121A" strokeWidth="1.4" />
                    <path d="M2 8h16" stroke="#12121A" strokeWidth="1.4" />
                    <path d="M6 1v3M14 1v3" stroke="#12121A" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <div>
                    <span className="confirm__card-detail-label">Livraison estimée</span>
                    <span className="confirm__card-detail-value">{deliveryDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
