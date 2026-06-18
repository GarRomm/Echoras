import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// Makes the main CSS non-render-blocking: the browser discovers it via <link rel="preload">
// and swaps it to a stylesheet once downloaded, so it no longer stalls the first paint.
// A <noscript> fallback preserves behaviour when JS is disabled.
function deferCss() {
  return {
    name: 'defer-css',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*)href="([^"]+)">/g,
          (_, attrs, href) =>
            `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet"${attrs}href="${href}"></noscript>`,
        );
      },
    },
  };
}

// Adds <link rel="preload" as="font"> for critical woff2 files in the bundle,
// so the browser starts fetching fonts in parallel with the CSS instead of after.
function preloadCriticalFonts() {
  const CRITICAL = ['epilogue', 'poppins'];
  return {
    name: 'preload-critical-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const tags = Object.keys(ctx.bundle)
          .filter(k => k.endsWith('.woff2') && CRITICAL.some(f => k.includes(f)))
          .slice(0, 4)
          .map(k => `    <link rel="preload" as="font" type="font/woff2" crossorigin href="/${k}">`)
          .join('\n');
        if (!tags) return html;
        return html.replace('</head>', `${tags}\n  </head>`);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), svgr(), deferCss(), preloadCriticalFonts()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three'],
        },
      },
    },
  },
});
