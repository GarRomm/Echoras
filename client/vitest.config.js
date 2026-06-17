import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/AudioUploader.jsx',
        'src/components/ProtectedRoute.jsx',
        'src/hooks/useAudioAnalysis.js',
        'src/utils/materialLabels.js',
        'src/utils/printCost.js',
        'src/utils/stlExporter.js',
      ],
      exclude: ['src/__tests__/**'],
    },
  },
});
