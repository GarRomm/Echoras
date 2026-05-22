import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminOrderDetailPage.css';

const STATUS_CONFIG = {
  pending:     { label: 'En attente',     color: '#888888' },
  paid:        { label: 'Payée',          color: '#4a7fc1' },
  fabrication: { label: 'En fabrication', color: '#c9863a' },
  shipped:     { label: 'Expédiée',       color: '#5ea7a3' },
  delivered:   { label: 'Livrée',         color: '#5ea76a' },
};

const VALID_STATUSES = Object.keys(STATUS_CONFIG);

// Steps completed per status
const STATUS_STEP = { pending: 1, paid: 2, fabrication: 2, shipped: 3, delivered: 4 };

const TIMELINE_STEPS = [
  { label: 'Commande enregistrée',  desc: "La commande a bien été enregistrée et transmise à l'atelier." },
  { label: 'Fabrication lancée',    desc: 'La sculpture est entrée en phase de production à partir des paramètres validés.' },
  { label: 'Expédition préparée',   desc: "L'emballage et les documents d'expédition ont été finalisés avant remise au transporteur." },
  { label: 'Commande livrée',       desc: "La livraison a été confirmée à l'adresse du client." },
];

function formatDateLong(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Sidebar icons ── */
function IconDashboard() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconShoppingBag() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconSignOut() {
  return (
    <svg className="admin-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Status update
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus]         = useState('');
  const [savingStatus, setSavingStatus]   = useState(false);

  // Tracking input
  const [editingTracking, setEditingTracking] = useState(false);
  const [trackingInput, setTrackingInput]     = useState('');
  const [savingTracking, setSavingTracking]   = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // Toast
  const [sculptureImgFailed, setSculptureImgFailed] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = `Commande — Admin | Echoras`;
    return () => { document.title = 'Echoras'; };
  }, []);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setOrder(data); setNewStatus(data.status); setLoading(false); })
      .catch(() => { setError('Commande introuvable ou erreur serveur.'); setLoading(false); });
  }, [id]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStatusSave() {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrder(o => ({ ...o, status: newStatus }));
      setEditingStatus(false);
      showToast('Statut mis à jour.');
    } catch {
      showToast('Erreur lors de la mise à jour.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleTrackingSave() {
    setSavingTracking(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: order.status, trackingNumber: trackingInput }),
      });
      if (!res.ok) throw new Error();
      setOrder(o => ({ ...o, trackingNumber: trackingInput }));
      setEditingTracking(false);
      showToast('Numéro de suivi enregistré.');
    } catch {
      showToast('Erreur lors de l\'enregistrement.');
    } finally {
      setSavingTracking(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      navigate('/admin');
    } catch {
      showToast('Erreur lors de la suppression.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const stepsCompleted = STATUS_STEP[order?.status] ?? 1;
  const statusCfg = STATUS_CONFIG[order?.status] || { label: order?.status, color: '#888' };

  return (
    <div className="aod">
      <div className="aod__layout">

        {/* ── Sidebar ── */}
        <aside className="aod__sidebar" aria-label="Navigation admin">
          <div className="admin-sidebar__top">
            <div className="admin-sidebar__logo-area">
              <svg className="admin-sidebar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="3" x2="21" y2="21" /><line x1="21" y1="3" x2="3" y2="21" />
              </svg>
              <div className="admin-sidebar__logo-text">
                <span className="admin-sidebar__logo-name">Echoras</span>
                <span className="admin-sidebar__logo-slogan">Admin</span>
              </div>
            </div>
            <nav className="admin-sidebar__nav" aria-label="Navigation">
              <Link to="/admin" className="admin-sidebar__link">
                <IconDashboard />
                Tableau de bord
              </Link>
              <Link to="/admin" className="admin-sidebar__link admin-sidebar__link--active">
                <IconShoppingBag />
                Commandes
              </Link>
            </nav>
          </div>
          <div className="admin-sidebar__bottom">
            <button className="admin-sidebar__link admin-sidebar__link--light" onClick={handleLogout}>
              <IconSignOut />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="aod__content">

          {loading && <p className="aod__state">Chargement…</p>}
          {error   && <p className="aod__state aod__state--error">{error}</p>}

          {order && (
            <>
              {/* Header */}
              <div className="aod__header">
                <div className="aod__header-left">
                  <Link to="/admin" className="aod__back">
                    <IconArrowLeft />
                    Retour
                  </Link>
                  <div className="aod__header-title-row">
                    <span className="aod__header-label">Détail de commande</span>
                    <span
                      className="aod__status-badge"
                      style={{ backgroundColor: statusCfg.color }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                        <circle cx="5" cy="5" r="4" />
                      </svg>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="aod__header-meta">
                    <span className="aod__header-meta-muted">ID : </span>
                    <strong className="aod__header-meta-id">{order.orderNumber}</strong>
                    <span className="aod__header-meta-muted"> • Reçue le {formatDateLong(order.createdAt)}</span>
                  </p>
                </div>

                <div className="aod__header-actions">
                  <button className="aod__header-btn" onClick={() => window.print()}>
                    Générer un PDF
                  </button>
                  {editingStatus ? (
                    <div className="aod__status-edit">
                      <select
                        className="aod__status-select"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                      >
                        {VALID_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                      <button className="aod__status-save" onClick={handleStatusSave} disabled={savingStatus}>
                        {savingStatus ? '…' : 'OK'}
                      </button>
                      <button className="aod__status-cancel" onClick={() => setEditingStatus(false)}>✕</button>
                    </div>
                  ) : (
                    <button className="aod__header-btn" onClick={() => setEditingStatus(true)}>
                      Mettre à jour le statut
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="aod__body">

                {/* ── Left column ── */}
                <div className="aod__left">

                  {/* Sculpture summary */}
                  <div className="aod__sculpture-card">
                    {order.sculpture?.id && !sculptureImgFailed ? (
                      <img
                        className="aod__sculpture-img"
                        src={`/renders/${order.sculpture.id}.png`}
                        onError={() => setSculptureImgFailed(true)}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : (
                      <div
                        className="aod__sculpture-img"
                        style={order.sculpture?.params?.waveformColor
                          ? { background: `linear-gradient(160deg, ${order.sculpture.params.waveformColor}55 0%, #94949455 100%)` }
                          : {}}
                        aria-hidden="true"
                      />
                    )}
                    <div className="aod__sculpture-info">
                      <div className="aod__sculpture-name-area">
                        <h2 className="aod__sculpture-name">{order.sculpture?.name || 'Sans titre'}</h2>
                        {(order.sculpture?.params?.artistName || order.sculpture?.params?.songTitle) && (
                          <p className="aod__sculpture-artist">
                            {[order.sculpture.params.artistName, order.sculpture.params.songTitle].filter(Boolean).join(' — ')}
                          </p>
                        )}
                      </div>
                      <div className="aod__params-grid">
                        <div className="aod__param">
                          <span className="aod__param-label">Matériau</span>
                          <span className="aod__param-value">{order.sculpture?.material || '—'}</span>
                        </div>
                        <div className="aod__param">
                          <span className="aod__param-label">Hauteur</span>
                          <span className="aod__param-value">
                            {order.sculpture?.params?.cylinderHeight != null
                              ? `${order.sculpture.params.cylinderHeight.toFixed(1)} cm` : '—'}
                          </span>
                        </div>
                        <div className="aod__param">
                          <span className="aod__param-label">Hauteur pics</span>
                          <span className="aod__param-value">
                            {order.sculpture?.params?.peakHeight != null
                              ? order.sculpture.params.peakHeight.toFixed(2) : '—'}
                          </span>
                        </div>
                        <div className="aod__param">
                          <span className="aod__param-label">Tours hélice</span>
                          <span className="aod__param-value">{order.sculpture?.params?.helixTurns ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fabrication timeline */}
                  <div className="aod__timeline-card">
                    <h3 className="aod__timeline-title">Suivi de Fabrication</h3>
                    <ol className="aod__timeline">
                      {TIMELINE_STEPS.map((step, i) => {
                        const done = i < stepsCompleted;
                        return (
                          <li key={i} className={`aod__timeline-step${done ? ' aod__timeline-step--done' : ''}`}>
                            <div className="aod__timeline-dot" aria-hidden="true" />
                            <div className="aod__timeline-body">
                              <span className="aod__timeline-label">{step.label}</span>
                              {done && (
                                <span className="aod__timeline-date">
                                  {i === 0
                                    ? formatDateLong(order.createdAt)
                                    : i === stepsCompleted - 1
                                      ? formatDateLong(order.updatedAt)
                                      : null}
                                </span>
                              )}
                              <p className="aod__timeline-desc">{step.desc}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>

                {/* ── Right column ── */}
                <div className="aod__right">

                  {/* Client */}
                  <div className="aod__panel">
                    <h3 className="aod__panel-title">Client</h3>
                    <div className="aod__panel-fields">
                      <div className="aod__field">
                        <span className="aod__field-label">Nom complet</span>
                        <span className="aod__field-value">
                          {order.client ? `${order.client.firstName} ${order.client.lastName}` : '—'}
                        </span>
                      </div>
                      <div className="aod__field">
                        <span className="aod__field-label">Email</span>
                        <span className="aod__field-value">{order.client?.email || '—'}</span>
                      </div>
                      {order.client?.phone && (
                        <div className="aod__field">
                          <span className="aod__field-label">Téléphone</span>
                          <span className="aod__field-value">{order.client.phone}</span>
                        </div>
                      )}
                      <div className="aod__field">
                        <span className="aod__field-label">Montant total</span>
                        <span className="aod__field-value">{order.totalPrice.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Expédition */}
                  <div className="aod__panel">
                    <h3 className="aod__panel-title">Expédition</h3>
                    <div className="aod__panel-fields">
                      {order.shipping ? (
                        <>
                          <div className="aod__field">
                            <span className="aod__field-label">Destinataire</span>
                            <span className="aod__field-value">{order.shipping.name}</span>
                          </div>
                          <div className="aod__field">
                            <span className="aod__field-label">Adresse</span>
                            <span className="aod__field-value">{order.shipping.street}</span>
                          </div>
                          <div className="aod__field">
                            <span className="aod__field-label">Ville</span>
                            <span className="aod__field-value">{order.shipping.postalCode} {order.shipping.city}</span>
                          </div>
                          <div className="aod__field">
                            <span className="aod__field-label">Pays</span>
                            <span className="aod__field-value">{order.shipping.country}</span>
                          </div>
                          {order.trackingNumber && (
                            <div className="aod__field">
                              <span className="aod__field-label">Tracking</span>
                              <span className="aod__field-value">{order.trackingNumber}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="aod__field-value" style={{ opacity: 0.6 }}>Adresse non renseignée</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="aod__panel">
                    <h3 className="aod__panel-title">Actions</h3>
                    <div className="aod__actions">
                      {order.sculpture?.hasStl ? (
                        <>
                          <a href={`/api/admin/orders/${id}/stl/waveform`} className="aod__action-btn" download>
                            <IconDownload /> STL Waveform
                          </a>
                          <a href={`/api/admin/orders/${id}/stl/corps`} className="aod__action-btn" download>
                            <IconDownload /> STL Corps
                          </a>
                          <a href={`/api/admin/orders/${id}/stl/plaque`} className="aod__action-btn" download>
                            <IconDownload /> STL Plaque
                          </a>
                          <a href={`/api/admin/orders/${id}/3mf`} className="aod__action-btn" download>
                            <IconDownload /> 3MF (multi-couleur)
                          </a>
                        </>
                      ) : (
                        <button className="aod__action-btn" disabled title="Fichiers non disponibles">
                          <IconDownload />
                          Fichiers non disponibles
                        </button>
                      )}

                      <button className="aod__action-btn" onClick={() => showToast('Fonctionnalité à venir.')}>
                        <IconDownload />
                        Générer l'étiquette
                      </button>

                      {editingTracking ? (
                        <div className="aod__tracking-edit">
                          <input
                            className="aod__tracking-input"
                            placeholder="Ex : 1Z999AA1234567890"
                            value={trackingInput}
                            onChange={e => setTrackingInput(e.target.value)}
                            autoFocus
                          />
                          <div className="aod__tracking-btns">
                            <button className="aod__tracking-save" onClick={handleTrackingSave} disabled={savingTracking}>
                              {savingTracking ? '…' : 'Enregistrer'}
                            </button>
                            <button className="aod__tracking-cancel" onClick={() => setEditingTracking(false)}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="aod__action-btn"
                          onClick={() => { setTrackingInput(order.trackingNumber || ''); setEditingTracking(true); }}
                        >
                          <IconDownload />
                          Enregistrer le tracking
                        </button>
                      )}

                      <button className="aod__action-btn" onClick={() => showToast('Notification envoyée au client.')}>
                        <IconDownload />
                        Notifier le client
                      </button>

                      <button className="aod__action-btn aod__action-btn--danger" onClick={() => setConfirmDelete(true)}>
                        <IconTrash />
                        Supprimer la commande
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="aod__toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="aod__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="aod__modal">
            <h2 className="aod__modal-title" id="delete-modal-title">Supprimer la commande ?</h2>
            <p className="aod__modal-body">
              Cette action est irréversible. La commande <strong>{order?.orderNumber}</strong> sera définitivement supprimée.
            </p>
            <div className="aod__modal-actions">
              <button className="aod__modal-btn aod__modal-btn--cancel" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Annuler
              </button>
              <button className="aod__modal-btn aod__modal-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
