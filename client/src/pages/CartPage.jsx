import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, removeFromCart } from '../services/cartService';
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

function formatConfig(params) {
  if (!params) return null;
  return `Relief ${Math.round((params.peakHeight / 3) * 100)} % · Lissage ${Math.round(params.smoothing * 100)} % · Tours ${params.helixTurns} · Épaisseur ${Math.round(params.ringThickness * 10)} mm`;
}

function CartCard({ item, onDelete, navigate }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sculpture = item.Sculpture;
  const config = formatConfig(sculpture?.params);
  const waveformColor = sculpture?.params?.waveformColor;

  return (
    <article className="cart__card">
      {sculpture?.id && !imgFailed ? (
        <img
          className="cart__card-img"
          src={`/renders/${sculpture.id}.png`}
          onError={() => setImgFailed(true)}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div
          className="cart__card-img"
          style={waveformColor ? { background: `linear-gradient(160deg, ${waveformColor}55 0%, #94949455 100%)` } : {}}
          aria-hidden="true"
        />
      )}
      <div className="cart__card-content">
        <div className="cart__card-top">
          <div className="cart__card-name-price">
            <h2 className="cart__card-name">{sculpture?.name || 'Ma sculpture'}</h2>
            <span className="cart__card-price">{parseFloat(item.price).toFixed(0)} €</span>
          </div>
          <div className="cart__card-details">
            {config && <p className="cart__card-config">Configuration : {config}</p>}
          </div>
        </div>
        <div className="cart__card-actions">
          <button className="cart__action-btn" onClick={() => navigate('/createur')}>
            <IconEdit />
            <span>MODIFIER</span>
          </button>
          <button
            className="cart__action-btn cart__action-btn--delete"
            onClick={() => onDelete(item.id)}
          >
            <IconTrash />
            <span>SUPPRIMER</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CartPage() {
  useEffect(() => { document.title = 'Mon panier - Echoras'; }, []);

  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleDelete = useCallback(async (itemId) => {
    try {
      await removeFromCart(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      alert(err.message);
    }
  }, []);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

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
          {loading ? (
            <div className="cart__empty"><p>Chargement…</p></div>
          ) : error ? (
            <div className="cart__empty"><p>Erreur : {error}</p></div>
          ) : items.length === 0 ? (
            <div className="cart__empty">
              <p>Votre panier est vide.</p>
              <Link to="/createur" className="cart__btn cart__btn--primary">
                Créer ma sculpture
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartCard key={item.id} item={item} onDelete={handleDelete} navigate={navigate} />
            ))
          )}
        </div>

        {/* Résumé */}
        <aside className="cart__summary">
          <h2 className="cart__summary-title">Résumé</h2>

          <div className="cart__summary-lines">
            <div className="cart__summary-line">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(0)} €</span>
            </div>
            <div className="cart__summary-line cart__summary-line--separator">
              <span>Livraison &amp; assurance</span>
              <span>Offerte</span>
            </div>
            <div className="cart__summary-total">
              <span>Total TTC</span>
              <span className="cart__summary-total-amount">{subtotal.toFixed(0)} €</span>
            </div>
          </div>

          <div className="cart__summary-buttons">
            <button className="cart__btn cart__btn--primary" disabled={items.length === 0} onClick={() => navigate('/checkout')}>
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
