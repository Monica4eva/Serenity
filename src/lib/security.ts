import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import { lockoutSeconds, sameString, stretchSecret } from './cryptoCore';
import { secureGet, secureSet } from './crypto'; // also sets up the secure random source

// Passwords and PINs are never stored in plain text. When the Supabase backend is
// connected, passwords live in Supabase Auth and no password hash is kept on the phone.

/** Old format (v1): one SHA-256 with a fixed salt. Only used to check and upgrade old PINs. */
export async function hashSecret(secret: string, salt = 'serenity-local-v1') {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${secret}`);
}

/** New format (v2): random salt per secret, 15,000 rounds of SHA-512. */
export async function hashSecretStrong(secret: string): Promise<string> {
  const salt = util.encodeBase64(nacl.randomBytes(16));
  return `v2$${salt}$${stretchSecret(secret, salt)}`;
}

export async function verifySecret(secret: string, stored?: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith('v2$')) {
    const [, salt, hash] = stored.split('$');
    return sameString(stretchSecret(secret, salt), hash);
  }
  return sameString(await hashSecret(secret), stored);
}

export const isLegacyHash = (stored?: string) => !!stored && !stored.startsWith('v2$');

// ---------- wrong-PIN limit ----------
const FAILS = 'serenity.lock.fails.v1';
export async function getLockState(): Promise<{ fails: number; until: number }> {
  try {
    const raw = await secureGet(FAILS);
    return raw ? JSON.parse(raw) : { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}
export async function recordPinResult(ok: boolean): Promise<{ fails: number; until: number }> {
  const cur = await getLockState();
  const next = ok ? { fails: 0, until: 0 } : { fails: cur.fails + 1, until: Date.now() + lockoutSeconds(cur.fails + 1) * 1000 };
  await secureSet(FAILS, JSON.stringify(next));
  return next;
}

export async function biometricAvailable() {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function biometricUnlock(prompt: string) {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}
