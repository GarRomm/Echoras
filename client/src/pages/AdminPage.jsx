import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const STATUS_CONFIG = {
  pending:     { label: 'En attente',     bg: '#888888' },
  paid:        { label: 'Payée',          bg: '#4a7fc1' },
  fabrication: { label: 'En fabrication', bg: '#c9863a' },
  shipped:     { label: 'Expédiée',       bg: '#5ea7a3' },
  delivered:   { label: 'Livrée',         bg: '#5ea76a' },
};

const PAGE_SIZE = 10;

function IconDashboard() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="admin__kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="admin__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg className="admin__filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="admin__status-badge" style={{ backgroundColor: cfg.bg }}>
      <IconCheck />
      {cfg.label}
    </span>
  );
}

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const filterRef = useRef(null);

  const [stats, setStats] = useState({ total: 0, inProgress: 0, pendingShipment: 0, revenue: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard Admin | Echoras';
    return () => { document.title = 'Echoras'; };
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/orders', { credentials: 'include' }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (err) {
      console.error('Admin fetch:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusSave(orderId) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: editStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: editStatus } : o));
        // Refresh KPI stats
        const sRes = await fetch('/api/admin/stats', { credentials: 'include' });
        if (sRes.ok) setStats(await sRes.json());
      }
    } catch (err) {
      console.error('Status update:', err);
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.client.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatDate(iso) {
    if (!iso) return '–';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const KPI_CARDS = [
    { label: 'Commandes totales',    value: loading ? '–' : stats.total },
    { label: 'Commandes en cours',   value: loading ? '–' : stats.inProgress },
    { label: 'Expéditions en attente', value: loading ? '–' : stats.pendingShipment },
    {
      label: "Chiffre d'affaires",
      value: loading ? '–' : `${Math.round(stats.revenue).toLocaleString('fr-FR')} €`,
    },
  ];

  return (
    <div className="admin">
      <div className="admin__layout">

        {/* ── Sidebar ── */}
        <aside className="admin__sidebar" aria-label="Navigation admin">
          <div className="admin-sidebar__top">
            <div className="admin-sidebar__logo">
              <svg className="admin-sidebar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="3" x2="21" y2="21" />
                <line x1="21" y1="3" x2="3" y2="21" />
              </svg>
              <div className="admin-sidebar__logo-text">
                <span className="admin-sidebar__logo-name">Echoras</span>
                <span className="admin-sidebar__logo-slogan">L'Atelier Phygital</span>
              </div>
            </div>

            <nav className="admin-sidebar__nav" aria-label="Sections admin">
              <Link to="/admin" className="admin-sidebar__link admin-sidebar__link--active">
                <IconDashboard />
                Tableau de bord
              </Link>
              <Link to="/admin" className="admin-sidebar__link">
                <IconShoppingBag />
                Commandes
              </Link>
            </nav>
          </div>

          <div className="admin-sidebar__bottom">
            <button className="admin-sidebar__link" onClick={handleLogout}>
              <IconSignOut />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <div className="admin__content">

          {/* KPI Cards */}
          <div className="admin__kpi-grid" role="region" aria-label="Statistiques">
            {KPI_CARDS.map(card => (
              <div key={card.label} className="admin__kpi-card">
                <div className="admin__kpi-header">
                  <span className="admin__kpi-label">{card.label}</span>
                  <IconClipboard />
                </div>
                <strong className="admin__kpi-value">{card.value}</strong>
              </div>
            ))}
          </div>

          {/* Orders table */}
          <div className="admin__orders">

            {/* Toolbar */}
            <div className="admin__orders-toolbar">
              <span className="admin__orders-title">Liste des commandes</span>
              <div className="admin__orders-controls">
                <label className="admin__search-wrap" aria-label="Rechercher une commande">
                  <IconSearch />
                  <input
                    type="search"
                    className="admin__search-input"
                    placeholder="Rechercher une commande"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </label>
                <div className="admin__filter-wrap" ref={filterRef}>
                  <button
                    className="admin__filter-btn"
                    onClick={() => setFilterOpen(v => !v)}
                    aria-expanded={filterOpen}
                    aria-haspopup="listbox"
                  >
                    <IconFilter />
                    {statusFilter ? STATUS_CONFIG[statusFilter]?.label : 'Filtres'}
                  </button>
                  {filterOpen && (
                    <div className="admin__filter-dropdown" role="listbox">
                      <button role="option" onClick={() => { setStatusFilter(''); setPage(1); setFilterOpen(false); }}>
                        Tous les statuts
                      </button>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          role="option"
                          aria-selected={statusFilter === key}
                          onClick={() => { setStatusFilter(key); setPage(1); setFilterOpen(false); }}
                        >
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Numéro de commande</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(order => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.client}</td>
                      <td>{formatDate(order.date)}</td>
                      <td className="admin__table-amount">{Math.round(order.amount)} €</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        {editingId === order.id ? (
                          <div className="admin__status-edit">
                            <select
                              value={editStatus}
                              onChange={e => setEditStatus(e.target.value)}
                              className="admin__status-select"
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                                <option key={k} value={k}>{c.label}</option>
                              ))}
                            </select>
                            <button
                              className="admin__status-save"
                              onClick={() => handleStatusSave(order.id)}
                              disabled={saving}
                            >
                              OK
                            </button>
                            <button className="admin__status-cancel" onClick={() => setEditingId(null)}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="admin__action-btn"
                            onClick={() => { setEditingId(order.id); setEditStatus(order.status); }}
                          >
                            Voir la commande
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin__empty">
                        {loading ? 'Chargement…' : 'Aucune commande trouvée'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin__pagination">
              <span className="admin__pagination-info">
                {filtered.length > 0
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length} commande${filtered.length > 1 ? 's' : ''}`
                  : '0 commande'}
              </span>
              <div className="admin__pagination-btns">
                <button
                  className="admin__pagination-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Page précédente"
                >
                  <IconChevronLeft />
                </button>
                <button
                  className="admin__pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Page suivante"
                >
                  <IconChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
