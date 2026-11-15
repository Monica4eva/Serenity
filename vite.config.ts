import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin site reuses the app's built-in content (../src/content) so editors start from what
// the app already shows. Those files sit next to the app's tsconfig.json, which extends Expo's
// settings; Expo is not installed when only the admin site is built (for example on Vercel or
// Netlify). Giving esbuild its TypeScript settings directly stops it looking for that file.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { fs: { allow: ['..'] } },
  esbuild: {
    tsconfigRaw: JSON.stringify({ compilerOptions: { target: 'ES2022', jsx: 'react-jsx', useDefineForClassFields: true, verbatimModuleSyntax: false } }),
  },
});
