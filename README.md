# Echoras - Le Souvenir Musical

Transformez un fichier audio en sculpture 3D imprimable. Echoras analyse la forme d'onde de votre musique et génère un objet 3D unique, personnalisable et commandable en ligne.


---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Three.js |
| Backend | Node.js, Express |
| Base de données | MySQL 8, Sequelize |
| Service audio | Python, Flask, Librosa |
| Paiement | Stripe Checkout |
| Emails | Resend |
| Tests | Vitest - 125 tests (server + client) |

---

## Fonctionnalités

- **Créateur 3D** - import audio drag & drop, visualisation en temps réel, 10 paramètres de personnalisation, export STL/3MF
- **Compte utilisateur** - inscription, connexion JWT, reset mot de passe, historique sculptures et commandes
- **E-commerce** - panier, calcul de prix dynamique, paiement Stripe, emails de confirmation et suivi de commande
- **Backoffice admin** - gestion des commandes, téléchargement STL, mise à jour des statuts

---

## Lancer le projet

**Prérequis :** Node.js 18+, Python 3.10+, MySQL 8

```bash
# Installer toutes les dépendances
npm run setup

# Lancer le serveur et le client en parallèle
npm run dev
```

Copier `.env.example` en `.env` dans `server/` et renseigner les variables (DB, JWT, Stripe, Resend).

---

## Tests

```bash
# Tous les tests + rapport de couverture
npm run coverage
```

---

## Structure

```
client/        # React + Vite
server/        # Node.js + Express + Sequelize
python-service/ # Flask + Librosa
deploy/        # nginx, systemd, setup VPS
```
