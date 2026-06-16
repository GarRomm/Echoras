import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MyOrdersPage.css';
import IconProfilSvg from '../assets/icon-personnalisez.svg?react'

const STATUS_CONFIG = {
  pending:     { label: 'En attente',     color: '#a98fd1' },
  paid:        { label: 'Commandée',      color: '#573a81' },
  fabrication: { label: 'En fabrication', color: '#c9863a' },
  shipped:     { label: 'Expédiée',       color: '#4a90d9' },
  delivered:   { label: 'Livrée',         color: '#5ea76a' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ── Sidebar icons ── */
function IconDashboard() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconPencilRuler() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 7l4 4L7 21H3v-4L13 7z" />
      <path d="M14 6l4 4" />
      <path d="M3 21l4-4" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconUserCircle() {
  return <IconProfilSvg className="sidebar__icon" fill="currentColor" aria-hidden="true" />;
}

function IconQuestion() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ── Toolbar icons ── */
function IconChevronDown() {
  return (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}

function IconFilterLines() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="0" y1="1" x2="14" y2="1" />
      <line x1="2" y1="5" x2="12" y2="5" />
      <line x1="4" y1="9" x2="10" y2="9" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="0" x2="6" y2="12" />
      <line x1="0" y1="6" x2="12" y2="6" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#a98fd1' };
  return (
    <span className="order-card__badge" style={{ backgroundColor: cfg.color }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="5" r="4" />
      </svg>
      {cfg.label}
    </span>
  );
}

/* ── Order card ── */
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const waveformColor = order.sculpture?.waveformColor;
  const placeholderStyle = waveformColor
    ? { background: `linear-gradient(160deg, ${waveformColor}55 0%, #94949455 100%)` }
    : {};

  return (
    <article className="order-card">
      {order.sculpture?.id && !imgFailed ? (
        <img
          className="order-card__preview"
          src={`/renders/${order.sculpture.id}.png`}
          onError={() => setImgFailed(true)}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div className="order-card__preview" style={placeholderStyle} aria-hidden="true" />
      )}
      <div className="order-card__main">
        <div className="order-card__info">
          <p className="order-card__number">{order.orderNumber}</p>
          <h2 className="order-card__name">{order.sculpture?.name || 'Sans titre'}</h2>
          <StatusBadge status={order.status} />
          {(order.sculpture?.artistName || order.sculpture?.songTitle) && (
            <p className="order-card__subtitle">
              {[order.sculpture.artistName, order.sculpture.songTitle].filter(Boolean).join(' — ')}
            </p>
          )}
        </div>
        <div className="order-card__meta">
          <div className="order-card__date">
            <span className="order-card__date-label">Date d'achat</span>
            <span className="order-card__date-value">{formatDate(order.createdAt)}</span>
          </div>
          <button
            className="order-card__eye"
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
            aria-expanded={expanded}
          >
            <IconEye />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="order-card__details">
          <div className="order-card__detail-row">
            <span className="order-card__detail-label">Total</span>
            <span className="order-card__detail-value">{order.totalPrice.toFixed(2)} €</span>
          </div>
          {order.trackingNumber && (
            <div className="order-card__detail-row">
              <span className="order-card__detail-label">Numéro de suivi</span>
              <span className="order-card__detail-value">{order.trackingNumber}</span>
            </div>
          )}
          {order.estimatedDeliveryDate && (
            <div className="order-card__detail-row">
              <span className="order-card__detail-label">Livraison estimée</span>
              <span className="order-card__detail-value">{formatDate(order.estimatedDeliveryDate)}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ── Page ── */
export default function MyOrdersPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [sortDir, setSortDir]         = useState('desc');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterOpen, setFilterOpen]   = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    document.title = 'Mes commandes | Echoras';
    return () => { document.title = 'Echoras'; };
  }, []);

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setOrders(data.orders || []); setLoading(false); })
      .catch(() => { setError('Impossible de charger vos commandes.'); setLoading(false); });
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const displayed = [...orders]
    .filter(o => !filterStatus || o.status === filterStatus)
    .sort((a, b) => sortDir === 'desc'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
    );

  const activeFilterLabel = filterStatus ? (STATUS_CONFIG[filterStatus]?.label ?? filterStatus) : null;

  return (
    <div className="orders">
      <div className="orders__layout">

        {/* ── Sidebar ── */}
        <aside className="orders__sidebar" aria-label="Navigation du compte">
          <div className="sidebar__top">
            <div className="sidebar__logo-area">
              <svg className="sidebar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="3" x2="21" y2="21" />
                <line x1="21" y1="3" x2="3" y2="21" />
              </svg>
              <div className="sidebar__logo-text">
                <span className="sidebar__logo-name">Echoras</span>
                <span className="sidebar__logo-slogan">L'Atelier Phygital</span>
              </div>
            </div>

            <nav className="sidebar__nav" aria-label="Sections du compte">
              <Link to="/profil" className="sidebar__link">
                <IconDashboard />
                Tableau de bord
              </Link>
              <NavLink
                to="/mes-creations"
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <IconPencilRuler />
                Mes créations
              </NavLink>
              <Link to="/mes-commandes" className="sidebar__link sidebar__link--active">
                <IconShoppingBag />
                Mes commandes
              </Link>
              <Link to="/profil" className="sidebar__link">
                <IconUserCircle />
                Mon compte
              </Link>
            </nav>
          </div>

          <div className="sidebar__bottom">
            <Link to="/faq" className="sidebar__link sidebar__link--light">
              <IconQuestion />
              Aide
            </Link>
            <button className="sidebar__link sidebar__link--light" onClick={handleLogout}>
              <IconSignOut />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <section className="orders__content" aria-labelledby="orders-heading">
          <div className="orders__header">
            <h1 className="orders__title" id="orders-heading">Mes commandes</h1>
            <p className="orders__desc">
              Accédez à l'historique de vos commandes et suivez l'état de vos sculptures en cours de fabrication.
            </p>
          </div>

          {/* Toolbar */}
          <div className="orders__toolbar">
            <div className="orders__toolbar-left">
              <button
                className="orders__sort-btn"
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                aria-label="Changer le tri"
              >
                <span className="orders__sort-label">Trier par</span>
                <span className="orders__sort-value">
                  {sortDir === 'desc' ? 'Récent' : 'Ancien'}
                  <IconChevronDown />
                </span>
              </button>

              <div className="orders__filter-wrap" ref={filterRef}>
                <button
                  className={`orders__filter-btn${filterOpen ? ' orders__filter-btn--open' : ''}`}
                  onClick={() => setFilterOpen(o => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                >
                  <IconFilterLines />
                  {activeFilterLabel || 'Filtres'}
                </button>
                {filterOpen && (
                  <div className="orders__filter-dropdown" role="listbox" aria-label="Filtrer par statut">
                    <button
                      role="option"
                      aria-selected={!filterStatus}
                      className={`orders__filter-option${!filterStatus ? ' orders__filter-option--active' : ''}`}
                      onClick={() => { setFilterStatus(null); setFilterOpen(false); }}
                    >
                      Tous
                    </button>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        role="option"
                        aria-selected={filterStatus === key}
                        className={`orders__filter-option${filterStatus === key ? ' orders__filter-option--active' : ''}`}
                        onClick={() => { setFilterStatus(key); setFilterOpen(false); }}
                      >
                        <span className="orders__filter-dot" style={{ backgroundColor: cfg.color }} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link to="/createur" className="orders__new-btn">
              <IconPlus />
              Nouvelle sculpture
            </Link>
          </div>

          {/* List */}
          {loading && <p className="orders__state">Chargement…</p>}
          {error   && <p className="orders__state orders__state--error">{error}</p>}

          {!loading && !error && displayed.length === 0 && (
            <div className="orders__empty">
              <p>
                {filterStatus
                  ? 'Aucune commande avec ce statut.'
                  : "Vous n'avez pas encore passé de commande."}
              </p>
              {!filterStatus && (
                <Link to="/createur" className="orders__empty-cta">
                  Créer ma première sculpture
                </Link>
              )}
            </div>
          )}

          {!loading && !error && displayed.length > 0 && (
            <div className="orders__list">
              {displayed.map(o => <OrderCard key={o.id} order={o} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
