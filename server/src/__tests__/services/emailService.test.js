import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const resendCJS      = _require('resend');
const emailServiceCJS = _require('../../services/emailService');

function mockResend() {
  const send = vi.fn().mockResolvedValue({ id: 'mock-email-id' });
  vi.spyOn(resendCJS, 'Resend').mockImplementation(() => ({ emails: { send } }));
  return send;
}

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.RESEND_API_KEY = 'test-resend-key';
});

// ---------------------------------------------------------------------------
// sendResetPasswordEmail
// ---------------------------------------------------------------------------

describe('sendResetPasswordEmail', () => {
  it('throws when RESEND_API_KEY is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      emailServiceCJS.sendResetPasswordEmail('user@echoras.fr', 'http://reset'),
    ).rejects.toThrow('RESEND_API_KEY is not configured');
  });

  it('calls resend.emails.send with correct to and subject', async () => {
    const send = mockResend();
    await emailServiceCJS.sendResetPasswordEmail('user@echoras.fr', 'http://reset?token=abc');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to:      'user@echoras.fr',
        subject: expect.stringContaining('Réinitialisation'),
        html:    expect.stringContaining('http://reset?token=abc'),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// sendContactEmail
// ---------------------------------------------------------------------------

describe('sendContactEmail', () => {
  it('calls resend.emails.send with the contact message', async () => {
    const send = mockResend();
    await emailServiceCJS.sendContactEmail({
      name:    'Bob',
      email:   'bob@example.com',
      subject: 'Question',
      message: 'Bonjour !',
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Question'),
        html:    expect.stringContaining('Bob'),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// sendContactConfirmationEmail
// ---------------------------------------------------------------------------

describe('sendContactConfirmationEmail', () => {
  it('sends confirmation to the user email', async () => {
    const send = mockResend();
    await emailServiceCJS.sendContactConfirmationEmail({ name: 'Alice', email: 'alice@example.com' });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to:   'alice@example.com',
        html: expect.stringContaining('Alice'),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// sendOrderConfirmationEmail
// ---------------------------------------------------------------------------

describe('sendOrderConfirmationEmail', () => {
  it('includes order rows and total in the email body', async () => {
    const send = mockResend();
    await emailServiceCJS.sendOrderConfirmationEmail({
      to:        'client@echoras.fr',
      firstName: 'Alice',
      orders:    [{ orderNumber: '#ECH-0001', sculptureName: 'Onde', price: 45 }],
      total:     45,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to:   'client@echoras.fr',
        html: expect.stringContaining('#ECH-0001'),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// sendOrderStatusEmail
// ---------------------------------------------------------------------------

describe('sendOrderStatusEmail', () => {
  it('sends email for "fabrication" status', async () => {
    const send = mockResend();
    await emailServiceCJS.sendOrderStatusEmail({
      to:          'client@echoras.fr',
      firstName:   'Alice',
      orderNumber: '#ECH-0001',
      status:      'fabrication',
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('fabrication') }),
    );
  });

  it('does not send email for unknown status', async () => {
    const send = mockResend();
    await emailServiceCJS.sendOrderStatusEmail({
      to: 'client@echoras.fr', firstName: 'Alice', orderNumber: '#ECH-0001', status: 'pending',
    });
    expect(send).not.toHaveBeenCalled();
  });
});
