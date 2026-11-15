// Device-side key management.
// The journal key lives only in the phone's secure hardware-backed store (Keychain / Keystore).
// It never leaves the phone unless the person copies their recovery key themselves.
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidKey, newKey } from './cryptoCore';

// React Native has no built-in secure random source for TweetNaCl, so use the OS one.
nacl.setPRNG((x: Uint8Array, n: number) => {
  const bytes = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = bytes[i];
});

const JOURNAL_KEY = 'serenity.journalKey.v1';

// Web preview has no secure store; fall back to AsyncStorage there only.
export const secureGet = (k: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k));
export const secureSet = (k: string, v: string) => (Platform.OS === 'web' ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v));
export const secureDelete = (k: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k));

export async function getJournalKey(): Promise<string> {
  let k = await secureGet(JOURNAL_KEY);
  if (!k) {
    k = newKey();
    await secureSet(JOURNAL_KEY, k);
  }
  return k;
}

/** Restore a recovery key on a new phone. Returns false if the key is not valid. */
export async function setJournalKey(k: string): Promise<boolean> {
  if (!isValidKey(k)) return false;
  await secureSet(JOURNAL_KEY, k.trim());
  return true;
}

export async function clearJournalKey() {
  await secureDelete(JOURNAL_KEY);
}
