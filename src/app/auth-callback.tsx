// Return address for Google, Apple and Facebook sign-in (serenity://auth-callback).
// The sign-in code is handled in src/lib/auth.ts; this screen only closes the browser
// window on the web and steps back if the phone opened it as a link.
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  useEffect(() => {
    const id = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/')), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
