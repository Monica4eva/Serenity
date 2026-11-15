import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin site reuses the app's built-in content (../src/content) so editors start from what
// the app already shows.
export default defineConfig({ plugins: [react()], base: './', server: { fs: { allow: ['..'] } } });
