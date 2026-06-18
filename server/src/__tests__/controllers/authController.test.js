import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('bcryptjs', () => {
  const compare = vi.fn();
  const hash = vi.fn().mockResolvedValue('hashed_password');
  return {
    default: { hash, compare },
    hash,
    compare,
  };
});

vi.mock('jsonwebtoken', () => {
  const sign = vi.fn().mockReturnValue('mock.jwt.token');
  const verify = vi.fn();
  return {
    default: { sign, verify },
    sign,
    verify,
  };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({}) })) },
  createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({}) })),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'mock-id' }) },
  })),
}));

import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const { User } = _require('../../db/models/index');
const bcryptCJS = _require('bcryptjs');
const emailServiceCJS = _require('../../services/emailService');

import bcrypt from 'bcryptjs';
import { register, login, logout, me, forgotPassword, resetPassword } from '../../controllers/authController';

const BASE_USER = {
  id: 1,
  email: 'test@echoras.fr',
  firstName: 'Alice',
  lastName: 'Dupont',
  role: 'USER',
  passwordHash: 'hashed',
  resetToken: null,
  resetTokenExpiry: null,
};

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  vi.clearAllMocks();
  bcrypt.hash.mockResolvedValue('hashed_password');
});

describe('register', () => {
  it('returns 400 when a required field is missing', async () => {
    const req = { body: { email: 'a@b.com', password: 'pass1234' } };
    const res = makeRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tous les champs sont requis' });
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const req = { body: { email: 'a@b.com', password: 'short', firstName: 'A', lastName: 'B' } };
    const res = makeRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('8 caractères') }),
    );
  });

  it('returns 409 when email is already in use', async () => {
    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue({ ...BASE_USER });
    const req = { body: { email: 'taken@echoras.fr', password: 'password123', firstName: 'A', lastName: 'B' } };
    const res = makeRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email déjà utilisé' });
    findOneSpy.mockRestore();
  });

  it('creates user, sets cookie and returns 201 on success', async () => {
    const newUser = { ...BASE_USER, id: 42, email: 'new@echoras.fr' };
    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const createSpy = vi.spyOn(User, 'create').mockResolvedValue(newUser);

    const req = { body: { email: 'new@echoras.fr', password: 'securepass', firstName: 'Bob', lastName: 'Martin' } };
    const res = makeRes();
    await register(req, res);

    expect(createSpy).toHaveBeenCalledOnce();
    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@echoras.fr' }),
    );
    findOneSpy.mockRestore();
    createSpy.mockRestore();
  });
});

describe('login', () => {
  it('returns 400 when email or password is missing', async () => {
    const req = { body: { email: 'a@b.com' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when email is not found', async () => {
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const req = { body: { email: 'ghost@echoras.fr', password: 'whatever' } };
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Identifiants invalides' });
    spy.mockRestore();
  });

  it('returns 401 when password does not match', async () => {
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue({ ...BASE_USER });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: BASE_USER.email, password: 'wrong' } };
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Identifiants invalides' });
    spy.mockRestore();
  });

  it('sets cookie and returns user data on success', async () => {
    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue({ ...BASE_USER });
    const compareSpy = vi.spyOn(bcryptCJS, 'compare').mockResolvedValue(true);
    const req = { body: { email: BASE_USER.email, password: 'correct' } };
    const res = makeRes();

    await login(req, res);

    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: BASE_USER.id, email: BASE_USER.email, role: 'USER' }),
    );
    findOneSpy.mockRestore();
    compareSpy.mockRestore();
  });
});

describe('logout', () => {
  it('clears the token cookie and returns a success message', () => {
    const req = {};
    const res = makeRes();
    logout(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnecté' });
  });
});

describe('me', () => {
  it('returns 404 when user is not found in DB', async () => {
    const spy = vi.spyOn(User, 'findByPk').mockResolvedValue(null);
    const req = { user: { id: 99 } };
    const res = makeRes();

    await me(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    spy.mockRestore();
  });

  it('returns the user object on success', async () => {
    const spy = vi.spyOn(User, 'findByPk').mockResolvedValue({ ...BASE_USER });
    const req = { user: { id: 1 } };
    const res = makeRes();

    await me(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, email: BASE_USER.email }));
    spy.mockRestore();
  });
});

describe('forgotPassword', () => {
  it('returns 400 when no email is provided', async () => {
    const req = { body: {} };
    const res = makeRes();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns the same generic message whether email exists or not (anti-enumeration)', async () => {
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const req = { body: { email: 'ghost@echoras.fr' } };
    const res = makeRes();

    await forgotPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Si ce compte existe, un email a été envoyé.' });
    spy.mockRestore();
  });

  it('generates a reset token and calls update when user exists', async () => {
    const updateMock = vi.fn().mockResolvedValue(true);
    const userWithUpdate = { ...BASE_USER, update: updateMock };
    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue(userWithUpdate);
    const emailSpy = vi.spyOn(emailServiceCJS, 'sendResetPasswordEmail').mockResolvedValue(undefined);
    const req = { body: { email: BASE_USER.email } };
    const res = makeRes();

    await forgotPassword(req, res);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ resetToken: expect.any(String) }),
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Si ce compte existe, un email a été envoyé.' });
    findOneSpy.mockRestore();
    emailSpy.mockRestore();
  });
});

describe('resetPassword', () => {
  it('returns 400 when token or password is missing', async () => {
    const res = makeRes();
    await resetPassword({ body: { token: 'abc' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = makeRes();
    await resetPassword({ body: { token: 'abc', password: 'short' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when token is not found in the database', async () => {
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue(null);
    const res = makeRes();

    await resetPassword({ body: { token: 'invalid', password: 'newpassword' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Lien invalide ou expiré' });
    spy.mockRestore();
  });

  it('returns 400 when reset token has expired', async () => {
    const expiredUser = {
      ...BASE_USER,
      resetToken: 'some-token',
      resetTokenExpiry: new Date(Date.now() - 1000),
      update: vi.fn(),
    };
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue(expiredUser);
    const res = makeRes();

    await resetPassword({ body: { token: 'some-token', password: 'newpassword' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    spy.mockRestore();
  });

  it('updates password hash and clears reset token on success', async () => {
    const updateMock = vi.fn().mockResolvedValue(true);
    const validUser = {
      ...BASE_USER,
      resetToken: 'valid-token',
      resetTokenExpiry: new Date(Date.now() + 3_600_000),
      update: updateMock,
    };
    const spy = vi.spyOn(User, 'findOne').mockResolvedValue(validUser);
    const res = makeRes();

    await resetPassword({ body: { token: 'valid-token', password: 'newpassword' } }, res);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ resetToken: null, resetTokenExpiry: null }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Mot de passe mis à jour') }),
    );
    spy.mockRestore();
  });
});
