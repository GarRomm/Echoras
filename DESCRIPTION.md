# Echoras — "Le Souvenir Musical"

## Concept
Application web full-stack qui transforme un fichier audio en objet 3D imprimable (fichier STL), avec visualisation 3D en temps réel, compte utilisateur, panier et commande en ligne.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Three.js, @react-three/fiber |
| Backend | Node.js, Express |
| Base de données | MySQL 8, Sequelize ORM |
| Service audio | Python, Flask, Librosa |
| Paiement | Stripe Checkout |
| Emails transactionnels | Resend (Nodemailer en fallback) |
| Tests | Vitest (server + client) |
| Export 3D | STL binaire (côté client), 3MF |

---

## Architecture globale

```
Navigateur (React + Three.js)
    ↕ REST /api/*
Serveur Node.js (port 4000)
    ↕ Sequelize
MySQL 8
    ↕ Flask HTTP
Service Python (Librosa)
```

---

## Fonctionnalités implémentées

### Créateur 3D

| # | Fonctionnalité | Détail |
|---|---|---|
| F1 | Import audio | Drag & drop — MP3, WAV, OGG, FLAC, M4A, 50 Mo max |
| F2 | Analyse de la forme d'onde | Web Audio API, 2048 points d'amplitude normalisés |
| F3 | Visualisation 3D temps réel | Sculpture hélicoïdale Three.js modulée par l'audio |
| F4 | Personnalisation | 10 paramètres via sliders (hauteur pics, lissage, rayon, segments, tours, couleurs…) |
| F5 | Choix du matériau | 5 options : PLA, PETG, résine, métal, bois |
| F6 | Export STL / 3MF | Téléchargement direct dans le navigateur |

### Authentification

| # | Fonctionnalité | Détail |
|---|---|---|
| A1 | Inscription | Email, mot de passe (bcrypt), prénom/nom |
| A2 | Connexion / déconnexion | JWT httpOnly cookie, expiration 24h |
| A3 | Reset mot de passe | Token temporaire 1h, email Resend |
| A4 | Page profil | Modifier email, mot de passe |
| A5 | Mes créations | Historique des sculptures sauvegardées |
| A6 | Mes commandes | Historique avec statuts |

### Parcours e-commerce

| # | Fonctionnalité | Détail |
|---|---|---|
| C1 | Panier | Ajout, modification, suppression d'articles |
| C2 | Calcul du prix | Basé sur le matériau et les dimensions |
| C3 | Formulaire livraison | Nom, adresse, mode (standard / express) |
| C4 | Paiement Stripe | Session Checkout côté serveur |
| C5 | Confirmation commande | Page récap + email automatique |
| C6 | Suivi commande | Statuts : reçue → fabrication → expédiée → livrée |

### Pages & navigation

| # | Page | Route |
|---|---|---|
| N1 | Landing page | `/` |
| N2 | Créateur 3D | `/createur` |
| N3 | Comment ça marche | `/comment-ca-marche` |
| N4 | Galerie | `/galerie` |
| N5 | FAQ + contact | `/faq` |
| N6 | Mentions légales / confidentialité | `/mentions-legales`, `/confidentialite` |

### Backend

| # | Fonctionnalité | Détail |
|---|---|---|
| B1 | Upload audio sécurisé | Multer, UUID, validation format/taille |
| B2 | Analyse audio Librosa | BPM, RMS, centroïde spectral, 5 bandes fréquences, beats |
| B3 | Stockage STL | POST /api/model/save, GET/DELETE /api/model/:id |
| B4 | Rate limiting | 100 req / 15 min par IP |
| B5 | Gestion commandes BDD | Sequelize Order, ShippingAddress |
| B6 | Email confirmation commande | Resend |

### Backoffice admin

| # | Fonctionnalité | Détail |
|---|---|---|
| AD1 | Dashboard commandes | Liste avec filtres par statut |
| AD2 | Téléchargement STL | Pour fabrication |
| AD3 | Mise à jour statut | Passage entre les étapes |

---

## Tests unitaires

| Fichier | Scope | Tests |
|---|---|---|
| `authController.test.js` | register, login, logout, me, forgotPassword, resetPassword | 19 |
| `cartController.test.js` | getCart, addToCart, removeFromCart | 13 |
| `sculpturesController.test.js` | createSculpture, getSculptures, deleteSculpture, getMaterials, getPublicGallery | 11 |
| `authJWT.test.js` | Middleware authJWT, requireRole | 9 |
| `emailService.test.js` | sendResetPasswordEmail, sendContactEmail, sendOrderConfirmationEmail, sendOrderStatusEmail | 7 |
| `checkoutController.test.js` | placeOrder | 5 |
| **Total server** | | **64** |
| Client (utils, composants, hooks) | | 61 |
| **Total global** | | **125** |

Commande : `npm run coverage` à la racine (server + client en parallèle).

---

## Structure du projet

```
package.json                    # Scripts racine (dev, test, coverage, build)
client/                         # Frontend React + Vite
  src/
    App.jsx                     # Router v7 — toutes les routes
    components/                 # AudioUploader, ControlPanel, ExportPanel, Visualizer, Header, Footer
    pages/                      # HomePage, CreatorPage, LoginPage, RegisterPage, CartPage,
    │                           # CheckoutPage, OrderConfirmationPage, ProfilePage,
    │                           # MyCreationsPage, MyOrdersPage, AdminPage,
    │                           # FaqPage, GaleriePage, CommentCaMarchePage, ContactPage…
    hooks/
      useAudioAnalysis.js       # Analyse audio via Web Audio API
    context/
      AuthContext.jsx           # Contexte d'authentification global
    services/
      api.js                    # Client Axios centralisé
      cartService.js
      sculptureService.js
    utils/
      waveformRing.js           # Génération géométries Three.js
      stlExporter.js            # Export STL binaire
      3mfExporter.js            # Export 3MF
      printCost.js              # Calcul du prix d'impression
server/                         # Backend Node.js / Express
  src/
    index.js                    # Point d'entrée, middleware, routes
    routes/                     # auth, upload, model, cart, checkout, sculptures, orders, admin, contact
    controllers/                # authController, cartController, checkoutController,
    │                           # sculpturesController, ordersController, adminController…
    services/
      emailService.js           # Resend (reset password, confirmation commande, contact)
    middleware/
      authJWT.js                # Vérification JWT + requireRole
    db/
      models/                   # User, Sculpture, SculptureParams, Material, Order,
                                # ShippingAddress, Cart, CartItem, AudioAnalysis
  storage/
    stl/                        # Modèles STL sauvegardés
python-service/                 # Service Flask + Librosa
  scripts/
    api.py                      # Endpoints Flask (/analyze, /health)
    analyze_audio.py            # Analyse Librosa
deploy/                         # nginx.conf, systemd, setup-vps.sh
```
