import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET = 'test-jwt-secret-echoras';

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  vi.resetModules();
});

async function loadMiddleware() {
  const mod = await import('../../middleware/authJWT.js');
  return mod;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe('authJWT', () => {
  it('calls next() and attaches req.user when token is valid', async () => {
    const { authJWT } = await loadMiddleware();
    const token = jwt.sign({ id: 1, email: 'a@b.com', role: 'USER' }, SECRET);
    const req = { cookies: { token } };
    const res = makeRes();
    const next = vi.fn();

    authJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 1, email: 'a@b.com', role: 'USER' });
  });

  it('returns 401 when no token cookie is present', async () => {
    const { authJWT } = await loadMiddleware();
    const req = { cookies: {} };
    const res = makeRes();
    const next = vi.fn();

    authJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Non authentifié' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is signed with a wrong secret', async () => {
    const { authJWT } = await loadMiddleware();
    const badToken = jwt.sign({ id: 1, role: 'USER' }, 'wrong-secret');
    const req = { cookies: { token: badToken } };
    const res = makeRes();
    const next = vi.fn();

    authJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session invalide ou expirée' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    const { authJWT } = await loadMiddleware();
    const expiredToken = jwt.sign({ id: 1, role: 'USER' }, SECRET, { expiresIn: -1 });
    const req = { cookies: { token: expiredToken } };
    const res = makeRes();
    const next = vi.fn();

    authJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a malformed token string', async () => {
    const { authJWT } = await loadMiddleware();
    const req = { cookies: { token: 'not.a.valid.jwt' } };
    const res = makeRes();
    const next = vi.fn();

    authJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  it('calls next() when req.user.role matches an allowed role', async () => {
    const { requireRole } = await loadMiddleware();
    const req = { user: { role: 'ADMIN' } };
    const res = makeRes();
    const next = vi.fn();

    requireRole('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when multiple roles are allowed and user has one of them', async () => {
    const { requireRole } = await loadMiddleware();
    const req = { user: { role: 'USER' } };
    const res = makeRes();
    const next = vi.fn();

    requireRole('USER', 'ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 when user role is not in the allowed list', async () => {
    const { requireRole } = await loadMiddleware();
    const req = { user: { role: 'USER' } };
    const res = makeRes();
    const next = vi.fn();

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accès refusé' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is undefined', async () => {
    const { requireRole } = await loadMiddleware();
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
