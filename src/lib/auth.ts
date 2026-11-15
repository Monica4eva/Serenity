// Account actions. When Supabase is configured these use Supabase Auth;
// otherwise the app keeps its local-only account (password hash on the phone).
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { forgetSyncState } from './sync';

// Lets the sign-in browser window close itself on the web preview.
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple' | 'facebook';

/** Providers switched on in `.env` (EXPO_PUBLIC_AUTH_PROVIDERS=google,apple,facebook). */
export const enabledProviders: OAuthProvider[] = (process.env.EXPO_PUBLIC_AUTH_PROVIDERS ?? 'google,apple,facebook')
  .split(',')
  .map((x: string) => x.trim().toLowerCase())
  .filter((x: string): x is OAuthProvider => x === 'google' || x === 'apple' || x === 'facebook');

/** Where the provider sends the person back: serenity://auth-callback in the app, exp://... in Expo Go. */
export const oauthRedirect = () => Linking.createURL('auth-callback');

export type OAuthResult =
  | { ok: true; userId: string; email: string; fullName: string; isNew: boolean }
  | { ok: false; cancelled?: boolean; message: string };

function param(url: string, name: string): string | undefined {
  const m = url.match(new RegExp(`[?&#]${name}=([^&#]*)`));
  return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : undefined;
}

/**
 * Sign in (or sign up) with Google, Apple or Facebook through Supabase Auth.
 * Opens the provider's own page in a secure browser window; the app never sees the
 * person's Google, Apple or Facebook password. Uses PKCE.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<OAuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  const redirectTo = oauthRedirect();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: provider === 'facebook' ? 'email public_profile' : provider === 'apple' ? 'name email' : undefined,
      queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    },
  });
  if (error || !data?.url) return { ok: false, message: error?.message ?? 'Could not start sign-in' };
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return { ok: false, cancelled: true, message: 'cancelled' };
  const err = param(res.url, 'error_description') ?? param(res.url, 'error');
  if (err) return { ok: false, message: err };
  const code = param(res.url, 'code');
  if (!code) return { ok: false, message: 'No sign-in code returned' };
  const { data: s, error: e2 } = await supabase.auth.exchangeCodeForSession(code);
  if (e2 || !s.user) return { ok: false, message: e2?.message ?? 'Sign-in failed' };
  const meta = s.user.user_metadata ?? {};
  const created = new Date(s.user.created_at).getTime();
  return {
    ok: true,
    userId: s.user.id,
    email: s.user.email ?? meta.email ?? '',
    fullName: meta.full_name ?? meta.name ?? '',
    // A brand-new account was created in the last few minutes.
    isNew: Date.now() - created < 5 * 60 * 1000,
  };
}

export type AuthResult = { ok: true; needsConfirm?: boolean; userId?: string } | { ok: false; message: string };

export async function signUp(email: string, password: string, fullName: string, preferredName: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, preferred_name: preferredName } },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, needsConfirm: !data.session, userId: data.user?.id };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  return { ok: true, userId: data.user.id };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  // The email link brings the person back to the "Set a new password" screen
  // (https://<app>/reset-password on the web, serenity://reset-password on phones).
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: Linking.createURL('reset-password') });
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** True while a password reset is in progress: the short reset session must not download anyone's data. */
export let resettingPassword = false;

/** Step 2 of a reset: turn the one-time code from the email link into a short session. */
export async function openResetLink(code: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  resettingPassword = true;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return error || !data.session ? { ok: false, message: error?.message ?? 'expired' } : { ok: true, userId: data.session.user.id };
}

/** Step 3: save the new password, then sign out so the person logs in fresh. */
export async function setNewPassword(password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, message: 'Backend not configured' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };
  await supabase.auth.signOut();
  resettingPassword = false;
  return { ok: true };
}

export async function signOut() {
  if (!supabase) return;
  await forgetSyncState();
  await supabase.auth.signOut();
}

/** Permanently deletes the account and every row of data (via the delete-account Edge Function). */
export async function deleteAccountOnline(): Promise<AuthResult> {
  if (!supabase) return { ok: true };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: true };
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) return { ok: false, message: error.message };
  await forgetSyncState();
  await supabase.auth.signOut();
  return { ok: true };
}
