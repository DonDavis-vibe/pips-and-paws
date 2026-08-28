import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' -> laeuft aus jedem Unterverzeichnis (GitHub Pages) und per file://
// viteSingleFile buendelt JS+CSS in die eine index.html fuer den portablen Release.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});
