import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CartPage.css';

// Icônes inline SVG
function IconEdit() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path d="M13.5 2.5l3 3L5 17H2v-3L13.5 2.5z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path d="M1 5h16M6 5V3h6v2M7 9v6M11 9v6M2 5l1 13h12l1-13" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="21" viewBox="0 0 18 21" fill="none" aria-hidden="true">
      <rect x="2" y="9" width="14" height="11" rx="2" stroke="#F0EDE6" strokeWidth="1.5"/>
      <path d="M5 9V6a4 4 0 018 0v3" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="15" r="1.5" fill="#F0EDE6"/>
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="23" height="16" viewBox="0 0 23 16" fill="none" aria-hidden="true">
      <path d="M1 1h13v10H1zM14 5h4l3 3v4h-7V5z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="5" cy="14" r="2" stroke="#F0EDE6" strokeWidth="1.5"/>
      <circle cx="18" cy="14" r="2" stroke="#F0EDE6" strokeWidth="1.5"/>
    </svg>
  );
}

function IconDiamond() {
  return (
    <svg width="23" height="19" viewBox="0 0 23 19" fill="none" aria-hidden="true">
      <path d="M1 6l4-5h13l4 5-11 12L1 6z" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 6h21M8 1l-3 5M15 1l3 5" stroke="#F0EDE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconMaterial() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="17" stroke="#F0EDE6" strokeWidth="1.5"/>
      <circle cx="18" cy="18" r="10" fill="rgba(240,237,230,0.15)" stroke="#F0EDE6" strokeWidth="1"/>
    </svg>
  );
}

// Données exemple (plus tard connecté à l'API)
const CART_ITEMS = [
  {
    id: '1',
    name: 'Danse du mariage',
    price: 89,
    material: 'Céramique ivoire',
    config: 'Relief 75 % · Lissage 40 % · Tours 12 · Épaisseur 6 mm',
  },
];

export default function CartPage() {
  const navigate = useNavigate();

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="cart">
      {/* Titre */}
      <div className="cart__header">
        <h1 className="cart__title">Panier</h1>
        <div className="cart__divider" />
      </div>

      <div className="cart__body">
        {/* Articles */}
        <div className="cart__items">
          {CART_ITEMS.length === 0 ? (
            <div className="cart__empty">
              <p>Votre panier est vide.</p>
              <Link to="/createur" className="cart__btn cart__btn--primary">
                Créer ma sculpture
              </Link>
            </div>
          ) : (
            CART_ITEMS.map((item) => (
              <article key={item.id} className="cart__card">
                <div className="cart__card-img" aria-hidden="true" />
                <div className="cart__card-content">
                  <div className="cart__card-top">
                    <div className="cart__card-name-price">
                      <h2 className="cart__card-name">{item.name}</h2>
                      <span className="cart__card-price">{item.price} €</span>
                    </div>
                    <div className="cart__card-details">
                      <div className="cart__card-material">
                        <IconMaterial />
                        <span>Matériau : <strong>{item.material}</strong></span>
                      </div>
                      <p className="cart__card-config">Configuration : {item.config}</p>
                    </div>
                  </div>
                  <div className="cart__card-actions">
                    <button className="cart__action-btn" onClick={() => navigate('/createur')}>
                      <IconEdit />
                      <span>MODIFIER</span>
                    </button>
                    <button className="cart__action-btn cart__action-btn--delete">
                      <IconTrash />
                      <span>SUPPRIMER</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Résumé */}
        <aside className="cart__summary">
          <h2 className="cart__summary-title">Résumé</h2>

          <div className="cart__summary-lines">
            <div className="cart__summary-line">
              <span>Sous-total</span>
              <span>{subtotal} €</span>
            </div>
            <div className="cart__summary-line cart__summary-line--separator">
              <span>Livraison &amp; assurance</span>
              <span>Offerte</span>
            </div>
            <div className="cart__summary-total">
              <span>Total TTC</span>
              <span className="cart__summary-total-amount">{subtotal} €</span>
            </div>
          </div>

          <div className="cart__summary-buttons">
            <button className="cart__btn cart__btn--primary">
              Passer à la commande
            </button>
            <button className="cart__btn cart__btn--secondary" onClick={() => navigate('/createur')}>
              Retour au studio
            </button>
          </div>

          <div className="cart__reassurance">
            <div className="cart__reassurance-item">
              <IconLock />
              <span>Paiement sécurisé chiffré</span>
            </div>
            <div className="cart__reassurance-item">
              <IconTruck />
              <span>Livraison assurée avec suivi</span>
            </div>
            <div className="cart__reassurance-item">
              <IconDiamond />
              <span>Fabrication artisanale sur commande</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
