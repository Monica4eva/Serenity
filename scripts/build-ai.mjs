// Copies supabase/functions/session-assistant/core.ts into index.ts between the CORE markers,
// so the Edge Function deploys as one self-contained file. Run: npm run build:ai
import fs from 'node:fs';
const dir = new URL('../supabase/functions/session-assistant/', import.meta.url);
const core = fs.readFileSync(new URL('core.ts', dir), 'utf8');
const idx = fs.readFileSync(new URL('index.ts', dir), 'utf8');
const a = '// ---- BEGIN CORE (generated from core.ts) ----\n';
const b = '// ---- END CORE ----\n';
const out = idx.slice(0, idx.indexOf(a) + a.length) + core + idx.slice(idx.indexOf(b));
fs.writeFileSync(new URL('index.ts', dir), out);
console.log('session-assistant/index.ts updated from core.ts');
