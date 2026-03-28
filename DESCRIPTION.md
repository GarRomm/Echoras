# Echoras — "Le Souvenir Musical"

## Concept
Application web full-stack qui transforme un fichier audio en objet 3D imprimable (fichier STL), avec visualisation 3D en temps réel et rendu photoréaliste via Blender.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Three.js |
| Backend | Node.js, Express |
| Service IA / rendu | Python, Flask, Librosa, Blender (headless) |
| Export 3D | STL (généré côté client et serveur) |

---

## Architecture globale

```
Navigateur (React + Three.js)
    ↕ REST /api/*
Serveur Node.js (port 4000)
    ↕ subprocess / Flask HTTP
Service Python (Blender + Librosa)
```

---

## Fonctionnalités FRONTEND

| # | Fonctionnalité | Détail |
|---|---|---|
| F1 | Import audio | Drag & drop ou clic — MP3, WAV, OGG, FLAC, M4A |
| F2 | Analyse de la forme d'onde | Web Audio API, extraction de 2048 points d'amplitude normalisés côté client |
| F3 | Visualisation 3D temps réel | Three.js — sculpture hélicoïdale générée et modulée par les données audio |
| F4 | Personnalisation du modèle | 10 paramètres via sliders : hauteur des pics, lissage, rayon/hauteur du cylindre, épaisseur, segments, tours d'hélice, largeur du ruban, couleurs, base |
| F5 | Choix du matériau | Plastique blanc, plastique noir, métal argent, métal or, bois |
| F6 | Export STL local | Génération et téléchargement direct du `.stl` dans le navigateur (sans serveur) |
| F7 | Rendu photoréaliste | Envoi du STL au serveur → Blender → retour image PNG affichée dans l'interface |

---

## Fonctionnalités BACKEND (Node.js / Express)

| # | Fonctionnalité | Détail |
|---|---|---|
| B1 | Upload audio sécurisé | Multer, UUID, validation d'extension, limite configurable (défaut 50 MB) |
| B2 | Sauvegarde des modèles STL | Stockage dans `server/storage/stl/` |
| B3 | Déclenchement du rendu Blender | `POST /api/render/:id` — appel Blender en mode headless |
| B4 | Vérification du statut de rendu | `GET /api/render/:id` |
| B5 | Serveur statique des images rendues | Route `/renders/` — PNG servis directement |
| B6 | Rate limiting | 100 requêtes / 15 min par IP |
| B7 | Health check | `GET /api/health` |

---

## Service Python (Flask + Librosa + Blender)

| # | Fonctionnalité | Détail |
|---|---|---|
| P1 | Analyse audio avancée | Librosa : tempo/BPM, enveloppe RMS (2048 pts), centroïde spectral, 5 bandes de fréquences (sub-bass → presence), positions des beats, chroma (harmoniques) |
| P2 | Rendu 3D photoréaliste | Blender headless via xvfb-run, matériaux et résolution configurables, timeout 240s |

---

## Géométrie 3D générée

La sculpture est composée de 3 éléments assemblés en un seul STL :

1. **Cylindre central** — colonne vertébrale de la sculpture
2. **Ruban hélicoïdal** — spirale autour du cylindre dont le rayon est modulé par l'amplitude audio
3. **Base** — socle plat optionnel (activable/désactivable)

---

## Paramètres de personnalisation disponibles

| Paramètre | Plage | Rôle |
|---|---|---|
| `peakHeight` | 0.1 – 3.0 | Amplitude des pics audio sur le ruban |
| `smoothing` | 0 – 1 | Lissage de la forme d'onde |
| `cylinderRadius` | 0.3 – 3.0 | Rayon du cylindre central |
| `cylinderHeight` | 1 – 10 | Hauteur du cylindre |
| `ringThickness` | 0.1 – 1.5 | Épaisseur du ruban hélicoïdal |
| `segments` | 64 – 512 | Résolution géométrique |
| `helixTurns` | 1 – 12 | Nombre de tours de la spirale |
| `ribbonWidth` | — | Largeur du ruban |
| `waveformColor` | hex | Couleur du ruban (visualisation) |
| `cylinderColor` | hex | Couleur du cylindre (visualisation) |
| `showBase` | bool | Afficher/masquer la base |

---

## Structure du projet

```
package.json                  # Scripts racine (dev, build, setup)
client/                       # Frontend React + Vite
  src/
    App.jsx                   # Composant racine
    components/               # AudioUploader, ControlPanel, ExportPanel, Visualizer, Header
    hooks/
      useAudioAnalysis.js     # Analyse audio via Web Audio API
    utils/
      waveformRing.js         # Génération des géométries Three.js
      stlExporter.js          # Export STL binaire
server/                       # Backend Node.js / Express
  src/
    index.js                  # Point d'entrée, middleware, routes
    routes/
      upload.js               # POST /api/upload
      model.js                # POST /api/model/save
      render.js               # POST|GET /api/render/:id
  storage/
    stl/                      # Modèles STL sauvegardés
    renders/                  # Images PNG rendues par Blender
python-service/               # Service Flask + Blender
  scripts/
    api.py                    # Endpoints Flask (/render, /analyze, /health)
    analyze_audio.py          # Analyse Librosa
    render_stl.py             # Script Blender de rendu STL → PNG
deploy/                       # Scripts de déploiement VPS (nginx, systemd, setup)
```

---

## Pistes d'évolution / fonctionnalités premium

- Utilisation des données harmoniques avancées (chroma, bandes de fréquences) pour enrichir la géométrie 3D
- Tableau de commandes pour l'impression 3D (commande en ligne)
- Galerie personnelle des sculptures créées
- Preview multi-matériaux côté client avant rendu Blender
- Authentification utilisateur et historique des modèles
