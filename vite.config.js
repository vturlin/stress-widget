import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Build produces a single artifact the hotelier embeds:
//   dist/widget.js — self-contained IIFE that auto-mounts a toast
//                    notification on top of the host page.
//
// React + ReactDOM are bundled in. No sibling stylesheet — every
// style lives inline (CSS-in-JS) plus a small <style> tag injected
// by the component itself for keyframes and media-query rules.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed.jsx'),
      name: 'StressWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    cssCodeSplit: false,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2018',
  },
  server: {
    port: 5175,
    open: '/demo.html',
  },
});
