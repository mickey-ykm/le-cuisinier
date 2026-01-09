import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked correctly on GitHub Pages
  define: {
    // Polyfill process.env for the Google GenAI SDK usage in the code
    'process.env': {}
  }
});