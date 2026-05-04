require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const sequelize = require('./db/index');
require('./db/models/index'); // enregistre les modèles et leurs associations

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const modelRoutes = require('./routes/model');
const renderRoutes = require('./routes/render');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust nginx reverse proxy (required for express-rate-limit and cookies behind proxy)
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
});
app.use('/api/', limiter);

// Serve rendered images statically
app.use('/renders', express.static(path.join(__dirname, '..', 'storage', 'renders')));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/render', renderRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`Echoras server running on port ${PORT}`);

  // Synchronise le schéma Sequelize avec MySQL (alter uniquement en dev)
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('Database connected and schema synced');
  } catch (err) {
    console.warn('Database unavailable, running without DB:', err.message);
  }
});
