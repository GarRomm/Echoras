const ADMIN_SECRET = process.env.ADMIN_SECRET;

// Temporary guard for admin-only routes until Phase-2 JWT auth is in place.
// Expects: Authorization: Bearer <ADMIN_SECRET>
module.exports = function requireAdminKey(req, res, next) {
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_SECRET not set' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
