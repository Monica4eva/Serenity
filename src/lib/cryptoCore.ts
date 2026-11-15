// Pure encryption helpers (no React Native imports, so they can be unit-tested in Node).
// XSalsa20-Poly1305 authenticated encryption from TweetNaCl: tampered data fails to open.
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

export const KEY_BYTES = nacl.secretbox.keyLength; // 32

export function newKey(): string {
  return util.encodeBase64(nacl.randomBytes(KEY_BYTES));
}

export function isValidKey(b64: string): boolean {
  try {
    return util.decodeBase64(b64.trim()).length === KEY_BYTES;
  } catch {
    return false;
  }
}

export function seal(keyB64: string, value: unknown): { ciphertext: string; nonce: string } {
  const key = util.decodeBase64(keyB64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(util.decodeUTF8(JSON.stringify(value)), nonce, key);
  return { ciphertext: util.encodeBase64(box), nonce: util.encodeBase64(nonce) };
}

/** Returns null if the key is wrong or the data was tampered with. */
export function open<T = unknown>(keyB64: string, ciphertext: string, nonce: string): T | null {
  try {
    const out = nacl.secretbox.open(util.decodeBase64(ciphertext), util.decodeBase64(nonce), util.decodeBase64(keyB64));
    return out ? (JSON.parse(util.encodeUTF8(out)) as T) : null;
  } catch {
    return null;
  }
}

/** Short, stable fingerprint of a record, used to detect what changed since the last sync. */
export function fingerprint(value: unknown): string {
  const s = JSON.stringify(value);
  let h1 = 0xdeadbeef ^ s.length;
  let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}

/** Rounds of SHA-512 used to slow down guessing of a PIN or local password. */
export const STRETCH_ROUNDS = 15000;

/** Salted, stretched hash of a short secret (PIN or local-only password). */
export function stretchSecret(secret: string, saltB64: string, rounds = STRETCH_ROUNDS): string {
  let h = nacl.hash(util.decodeUTF8(`${saltB64}:${secret}`));
  for (let i = 0; i < rounds; i++) h = nacl.hash(h);
  return util.encodeBase64(h.slice(0, 32));
}

/** Compares two strings without stopping at the first difference. */
export function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** After 5 wrong PIN tries: wait 30 s, then 60 s, 120 s... up to 15 minutes. */
export function lockoutSeconds(fails: number): number {
  if (fails < 5) return 0;
  return Math.min(900, 30 * 2 ** (fails - 5));
}
