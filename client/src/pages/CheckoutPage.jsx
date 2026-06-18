import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getCart } from '../services/cartService';
import './CheckoutPage.css';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Manrope", sans-serif',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#888888' },
    },
    invalid: { color: '#ff6b6b', iconColor: '#ff6b6b' },
  },
};

function CheckoutArticle({ item }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sculpture = item.Sculpture;
  const waveformColor = sculpture?.params?.waveformColor;
  return (
    <div className="checkout__article">
      {sculpture?.id && !imgFailed ? (
        <img
          className="checkout__article-img"
          src={`/renders/${sculpture.id}.png`}
          onError={() => setImgFailed(true)}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div
          className="checkout__article-img"
          style={waveformColor ? { background: `linear-gradient(160deg, ${waveformColor}55 0%, #94949455 100%)` } : {}}
          aria-hidden="true"
        />
      )}
      <div className="checkout__article-info">
        <div className="checkout__article-row">
          <span className="checkout__article-name">
            {sculpture?.name || 'Ma sculpture'}
          </span>
        </div>
        <div className="checkout__article-row">
          <span className="checkout__article-qty">Quantité : 1</span>
          <span className="checkout__article-price">
            {parseFloat(item.price).toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  useEffect(() => { document.title = 'Commande - Echoras'; }, []);

  const navigate = useNavigate();

  // Cart items
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profil utilisateur (pré-remplissage)
  const [profileData, setProfileData]         = useState(null);
  const [differentAddress, setDifferentAddress] = useState(false);

  // Infos livraison
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    saveInfo: false,
  });

  // Mode de livraison
  const [delivery, setDelivery] = useState('standard');

  // Paiement
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardError, setCardError] = useState(null);

  // Code promo
  const [promoCode, setPromoCode] = useState('');

  // Soumission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setItems(data.items || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setProfileData(data);
        setForm(prev => ({
          ...prev,
          firstName:  data.firstName || '',
          lastName:   data.lastName  || '',
          email:      data.email     || '',
          phone:      data.phone     || '',
          address:    data.address   || '',
          postalCode: data.zipCode   || '',
          city:       data.city      || '',
          country:    data.country   || 'France',
        }));
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const deliveryCost = delivery === 'express' ? 8 : 0;
  const total = subtotal + deliveryCost;

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleDifferentAddress(checked) {
    setDifferentAddress(checked);
    if (checked) {
      setForm(prev => ({
        ...prev,
        firstName: '', lastName: '', phone: '',
        address: '', postalCode: '', city: '', country: 'France',
      }));
    } else if (profileData) {
      setForm(prev => ({
        ...prev,
        firstName:  profileData.firstName || '',
        lastName:   profileData.lastName  || '',
        phone:      profileData.phone     || '',
        address:    profileData.address   || '',
        postalCode: profileData.zipCode   || '',
        city:       profileData.city      || '',
        country:    profileData.country   || 'France',
      }));
    }
  }

  function getDeliveryDate(mode) {
    const days = mode === 'express' ? { min: 2, max: 4 } : { min: 5, max: 7 };
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() + days.min);
    const to = new Date(now);
    to.setDate(to.getDate() + days.max);
    const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `Entre le ${fmt(from)} et le ${fmt(to)}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setCardError(null);

    try {
      let paymentIntentId = null;

      // Paiement par carte avec Stripe
      if (paymentMethod === 'card' && stripe && elements) {
        // 1. Créer le PaymentIntent côté serveur
        const piRes = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ deliveryType: delivery }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) throw new Error(piData.error || 'Erreur de paiement');

        // 2. Confirmer le paiement avec la carte Stripe
        const cardElement = elements.getElement(CardElement);
        const { error, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${form.firstName} ${form.lastName}`.trim(),
              email: form.email,
            },
          },
        });

        if (error) {
          setCardError(error.message);
          setSubmitting(false);
          return;
        }
        paymentIntentId = paymentIntent.id;
      }

      // 3. Créer la commande en base
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, deliveryType: delivery, paymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande');

      navigate('/confirmation', {
        state: {
          orderNumber:   data.orderNumber,
          sculptureName: data.sculptureName,
          total,
          address:       [form.address, form.postalCode, form.city, form.country].filter(Boolean).join(', '),
          deliveryDate:  getDeliveryDate(delivery),
        },
      });
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout">
      <form className="checkout__layout" onSubmit={handleSubmit} noValidate>

        {/* ─── COLONNE GAUCHE ─── */}
        <div className="checkout__left">

          {/* Informations de livraison */}
          <section className="checkout__section">
            <div className="checkout__section-head">
              <h2 className="checkout__section-title">Informations de livraison</h2>
              {profileData && (
                <label className="checkout__toggle-row">
                  <input
                    type="checkbox"
                    checked={differentAddress}
                    onChange={e => handleDifferentAddress(e.target.checked)}
                  />
                  <span>Envoyer à une adresse différente</span>
                </label>
              )}
            </div>
            <div className="checkout__form">
              <div className="checkout__row">
                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="firstName">Prénom</label>
                  <input
                    id="firstName"
                    className="checkout__input"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="lastName">Nom</label>
                  <input
                    id="lastName"
                    className="checkout__input"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="checkout__field checkout__field--full">
                <label className="checkout__label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="checkout__input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="checkout__field checkout__field--full">
                <label className="checkout__label" htmlFor="phone">Téléphone</label>
                <input
                  id="phone"
                  className="checkout__input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  autoComplete="tel"
                />
              </div>

              <div className="checkout__field checkout__field--full">
                <label className="checkout__label" htmlFor="address">Adresse</label>
                <input
                  id="address"
                  className="checkout__input"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  autoComplete="street-address"
                  required
                />
              </div>

              <div className="checkout__row">
                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="postalCode">Code postal</label>
                  <input
                    id="postalCode"
                    className="checkout__input"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleFormChange}
                    autoComplete="postal-code"
                    required
                  />
                </div>
                <div className="checkout__field">
                  <label className="checkout__label" htmlFor="city">Ville</label>
                  <input
                    id="city"
                    className="checkout__input"
                    name="city"
                    value={form.city}
                    onChange={handleFormChange}
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>

              <div className="checkout__field checkout__field--full">
                <label className="checkout__label" htmlFor="country">Pays</label>
                <input
                  id="country"
                  className="checkout__input"
                  name="country"
                  value={form.country}
                  onChange={handleFormChange}
                  autoComplete="country-name"
                />
              </div>

              {!profileData && (
                <label className="checkout__checkbox-row">
                  <input
                    type="checkbox"
                    name="saveInfo"
                    checked={form.saveInfo}
                    onChange={handleFormChange}
                  />
                  <span>Sauvegardez mes données pour effectuer des paiements rapidement</span>
                </label>
              )}
            </div>
          </section>

          {/* Mode de livraison */}
          <section className="checkout__section">
            <h2 className="checkout__section-title">Mode de livraison</h2>
            <div className="checkout__delivery-options">

              <label className={`checkout__delivery-card${delivery === 'standard' ? ' checkout__delivery-card--selected' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="standard"
                  checked={delivery === 'standard'}
                  onChange={() => setDelivery('standard')}
                />
                <div className="checkout__delivery-header">
                  <span className="checkout__delivery-radio">
                    <span className={`checkout__radio-dot${delivery === 'standard' ? ' checkout__radio-dot--active' : ''}`} />
                  </span>
                  <span className="checkout__delivery-name">Livraison standard</span>
                  <span className="checkout__delivery-price">Offert</span>
                </div>
                <p className="checkout__delivery-desc">Livraison estimée sous 5 à 7 jours ouvrés.</p>
              </label>

              <label className={`checkout__delivery-card${delivery === 'express' ? ' checkout__delivery-card--selected' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="express"
                  checked={delivery === 'express'}
                  onChange={() => setDelivery('express')}
                />
                <div className="checkout__delivery-header">
                  <span className="checkout__delivery-radio">
                    <span className={`checkout__radio-dot${delivery === 'express' ? ' checkout__radio-dot--active' : ''}`} />
                  </span>
                  <span className="checkout__delivery-name">Livraison express</span>
                  <span className="checkout__delivery-price">8 €</span>
                </div>
                <p className="checkout__delivery-desc">Livraison estimée sous 2 à 4 jours ouvrés.</p>
              </label>

            </div>
          </section>

          {/* Moyens de paiement */}
          <section className="checkout__section checkout__payment">
            <div className="checkout__payment-header">
              <h2 className="checkout__section-title">Moyens de paiement</h2>
              <p className="checkout__payment-subtitle">
                Toutes les transactions sont sécurisées et chiffrées.
              </p>
            </div>

            <div className="checkout__payment-block">

              {/* Carte bancaire */}
              <div className={`checkout__payment-row checkout__payment-row--top${paymentMethod === 'card' ? ' checkout__payment-row--selected' : ''}`}>
                <label className="checkout__payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <span className={`checkout__radio-indicator${paymentMethod === 'card' ? ' checkout__radio-indicator--active' : ''}`} />
                  <span className="checkout__payment-label">Carte bancaire</span>
                </label>
                <div className="checkout__card-icons" aria-hidden="true">
                  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                    <rect width="38" height="24" rx="4" fill="#1A1F71" />
                    <text x="5" y="16" fill="#fff" fontSize="10" fontWeight="bold">VISA</text>
                  </svg>
                  <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                    <rect width="38" height="24" rx="4" fill="#252525" />
                    <circle cx="15" cy="12" r="7" fill="#EB001B" />
                    <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                    <path d="M19 6.5a7 7 0 010 11A7 7 0 0119 6.5z" fill="#FF5F00" />
                  </svg>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="checkout__card-form">
                  <div className="checkout__stripe-element">
                    <CardElement
                      options={CARD_ELEMENT_OPTIONS}
                      onChange={() => setCardError(null)}
                    />
                  </div>
                  {cardError && (
                    <p className="checkout__card-error" role="alert">{cardError}</p>
                  )}
                  {!stripe && (
                    <p className="checkout__card-error">
                      Stripe non configuré - ajoutez VITE_STRIPE_PUBLIC_KEY dans client/.env
                    </p>
                  )}
                </div>
              )}

              {/* Badge Stripe */}
              <div className="checkout__stripe-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4z" fill="#6772e5" />
                </svg>
                <span>Paiement 100% sécurisé - traité par <strong>Stripe</strong></span>
              </div>

            </div>
          </section>

          {/* CTA */}
          {submitError && (
            <p className="checkout__error" role="alert">{submitError}</p>
          )}
          <button
            type="submit"
            className="checkout__cta"
            disabled={items.length === 0 || loading || submitting}
          >
            {submitting ? 'Traitement en cours…' : 'Payer maintenant'}
          </button>

        </div>

        {/* ─── COLONNE DROITE ─── */}
        <aside className="checkout__right">

          <div className="checkout__articles">
            {loading ? (
              <p className="checkout__articles-loading">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="checkout__articles-loading">Votre panier est vide.</p>
            ) : (
              items.map((item) => (
                <CheckoutArticle key={item.id} item={item} />
              ))
            )}
          </div>

          <div className="checkout__promo">
            <input
              className="checkout__promo-input"
              placeholder="Code de réduction ou carte-cadeau"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              aria-label="Code de réduction"
            />
            <button type="button" className="checkout__promo-btn">
              Valider
            </button>
          </div>

          <div className="checkout__totals">
            <div className="checkout__totals-line">
              <span>Sous-total · {items.length} article{items.length > 1 ? 's' : ''}</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="checkout__totals-line">
              <span>Expédition</span>
              <span>{delivery === 'standard' ? 'GRATUIT' : `${deliveryCost} €`}</span>
            </div>
          </div>

          <div className="checkout__total">
            <span>Total</span>
            <strong>{total.toFixed(2)} €</strong>
          </div>

        </aside>

      </form>
    </div>
  );
}

export default function CheckoutPageWrapper() {
  return (
    <Elements stripe={stripePromise} options={{ locale: 'fr' }}>
      <CheckoutPage />
    </Elements>
  );
}
