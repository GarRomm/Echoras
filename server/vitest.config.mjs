import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/controllers/authController.js',
        'src/controllers/cartController.js',
        'src/controllers/checkoutController.js',
        'src/controllers/sculpturesController.js',
        'src/middleware/authJWT.js',
        'src/services/emailService.js',
      ],
      exclude: ['src/__tests__/**'],
    },
  },
});
