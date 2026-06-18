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
const cartRoutes = require('./routes/cart');
const sculpturesRoutes = require('./routes/sculptures');
const adminRoutes      = require('./routes/admin');
const ordersRoutes     = require('./routes/orders');
const checkoutRoutes   = require('./routes/checkout');
const contactRoutes    = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 4000;

// Trust nginx reverse proxy (required for express-rate-limit and cookies behind proxy)
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
});
app.use('/api/', limiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/model', modelRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/sculptures', sculpturesRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/orders',    ordersRoutes);
app.use('/api/checkout',  checkoutRoutes);
app.use('/api/contact',   contactRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve sculpture renders (public - used by gallery)
app.use('/renders', express.static(path.join(__dirname, '..', 'storage', 'renders')));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
  });
}

const { Material } = require('./db/models/index');

const DEFAULT_MATERIALS = [
  { name: 'pla',  basePrice: 45 },
  { name: 'petg', basePrice: 59 },
];

app.listen(PORT, async () => {
  console.log(`Echoras server running on port ${PORT}`);

  // Synchronise le schéma Sequelize avec MySQL (alter uniquement en dev)
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('Database connected and schema synced');

    // Seed matériaux si la table est vide
    const count = await Material.count();
    if (count === 0) {
      await Material.bulkCreate(DEFAULT_MATERIALS);
      console.log('Materials seeded');
    }
  } catch (err) {
    console.warn('Database unavailable, running without DB:', err.message);
  }
});
