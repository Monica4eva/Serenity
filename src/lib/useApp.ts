import { useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as Speech from 'expo-speech';
import { useStore } from './store';
import { makeTheme } from './theme';
import { translate } from './i18n';

/** One hook for theme, translations and text-to-speech. */
export function useApp() {
  const store = useStore();
  const { state } = store;
  const scheme = useColorScheme();
  const s = state.settings;
  const theme = useMemo(
    () =>
      makeTheme({
        dyslexia: s.dyslexia,
        highContrast: s.highContrast,
        dark: s.themeMode === 'dark' || (s.themeMode === 'system' && scheme === 'dark'),
        fontScale: s.fontScale,
      }),
    [s.dyslexia, s.highContrast, s.themeMode, s.fontScale, scheme],
  );
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(state.language, key, vars), [state.language]);
  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      // Few phones have a Setswana voice yet. We ask for one; the phone falls back to its default voice.
      Speech.speak(text, { language: state.language === 'tn' ? 'tn-ZA' : 'en-GB', rate: 0.95 });
    },
    [state.language],
  );
  const stopSpeaking = useCallback(() => Speech.stop(), []);
  return { ...store, theme, t, speak, stopSpeaking };
}
