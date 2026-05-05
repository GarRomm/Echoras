import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const API = import.meta.env.VITE_API_URL || '/api';

export default function CheckoutPage() {
  const navigate = useNavigate();

  // Cart items
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
    billingAddress: false,
  });

  // Code promo
  const [promoCode, setPromoCode] = useState('');

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cart`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
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

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const deliveryCost = delivery === 'express' ? 8 : 0;
  const total = subtotal + deliveryCost;

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleCardChange(e) {
    const { name, value, type, checked } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: intégrer la passerelle de paiement
    navigate('/mes-commandes');
  }

  return (
    <div className="checkout">
      <form className="checkout__layout" onSubmit={handleSubmit} noValidate>

        {/* ─── COLONNE GAUCHE ─── */}
        <div className="checkout__left">

          {/* Informations de livraison */}
          <section className="checkout__section">
            <h2 className="checkout__section-title">Informations de livraison</h2>
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

              <label className="checkout__checkbox-row">
                <input
                  type="checkbox"
                  name="saveInfo"
                  checked={form.saveInfo}
                  onChange={handleFormChange}
                />
                <span>Sauvegardez mes données pour effectuer des paiements rapidement</span>
              </label>
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
                  <div className="checkout__field checkout__field--full">
                    <input
                      className="checkout__input"
                      name="number"
                      placeholder="Numéro de carte"
                      value={cardForm.number}
                      onChange={handleCardChange}
                      maxLength={19}
                      autoComplete="cc-number"
                    />
                  </div>
                  <div className="checkout__row">
                    <div className="checkout__field">
                      <input
                        className="checkout__input"
                        name="expiry"
                        placeholder="MM/AA"
                        value={cardForm.expiry}
                        onChange={handleCardChange}
                        maxLength={5}
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div className="checkout__field">
                      <input
                        className="checkout__input"
                        name="cvv"
                        placeholder="CVV"
                        value={cardForm.cvv}
                        onChange={handleCardChange}
                        maxLength={4}
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                  <div className="checkout__field checkout__field--full">
                    <input
                      className="checkout__input"
                      name="holder"
                      placeholder="Nom du titulaire"
                      value={cardForm.holder}
                      onChange={handleCardChange}
                      autoComplete="cc-name"
                    />
                  </div>
                  <label className="checkout__checkbox-row checkout__checkbox-row--light">
                    <input
                      type="checkbox"
                      name="billingAddress"
                      checked={cardForm.billingAddress}
                      onChange={handleCardChange}
                    />
                    <span>Utiliser l'adresse d'expédition comme adresse de facturation</span>
                  </label>
                </div>
              )}

              {/* Apple Pay */}
              <div className={`checkout__payment-row${paymentMethod === 'apple' ? ' checkout__payment-row--selected' : ''}`}>
                <label className="checkout__payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="apple"
                    checked={paymentMethod === 'apple'}
                    onChange={() => setPaymentMethod('apple')}
                  />
                  <span className={`checkout__radio-indicator${paymentMethod === 'apple' ? ' checkout__radio-indicator--active' : ''}`} />
                  <span className="checkout__payment-label">Apple Pay</span>
                </label>
                <svg width="50" height="20" viewBox="0 0 50 20" fill="none" aria-label="Apple Pay">
                  <text x="0" y="15" fill="#fff" fontSize="13" fontFamily="-apple-system, sans-serif" fontWeight="600"> Pay</text>
                </svg>
              </div>

              {/* PayPal */}
              <div className={`checkout__payment-row checkout__payment-row--bottom${paymentMethod === 'paypal' ? ' checkout__payment-row--selected' : ''}`}>
                <label className="checkout__payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                  />
                  <span className={`checkout__radio-indicator${paymentMethod === 'paypal' ? ' checkout__radio-indicator--active' : ''}`} />
                  <span className="checkout__payment-label">PayPal</span>
                </label>
                <svg width="60" height="20" viewBox="0 0 60 20" fill="none" aria-label="PayPal">
                  <text x="0" y="15" fill="#009cde" fontSize="13" fontFamily="sans-serif" fontWeight="700">Pay</text>
                  <text x="24" y="15" fill="#012169" fontSize="13" fontFamily="sans-serif" fontWeight="700">Pal</text>
                </svg>
              </div>

            </div>
          </section>

          {/* CTA */}
          <button
            type="submit"
            className="checkout__cta"
            disabled={items.length === 0 || loading}
          >
            Payer maintenant
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
                <div key={item.id} className="checkout__article">
                  <div className="checkout__article-img" aria-hidden="true" />
                  <div className="checkout__article-info">
                    <div className="checkout__article-row">
                      <span className="checkout__article-name">
                        {item.Sculpture?.name || 'Ma sculpture'}
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
