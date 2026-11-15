// Web app (PWA) support: lets people install Project Serenity from the browser on iPhone and
// Android ("Add to Home Screen" / "Install app") without an app store. Does nothing in the phone apps.
import { Platform } from 'react-native';

let done = false;

export function setupWebApp() {
  if (Platform.OS !== 'web' || done || typeof document === 'undefined') return;
  done = true;
  const head = document.head;
  const add = (tag: string, attrs: Record<string, string>) => {
    const sel = Object.entries(attrs).map(([k, v]) => `[${k}="${v}"]`).join('');
    if (head.querySelector(`${tag}${sel}`)) return;
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  };
  add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
  add('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#4E649D' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Serenity' });
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
  document.title = 'Project Serenity';
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

/** True when the web app was opened from the home screen icon. */
export function isInstalledWebApp(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}
