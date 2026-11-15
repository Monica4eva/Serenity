// On the web, React Native's Alert.alert does nothing, so confirmations like "Log out?" never
// appeared and their buttons could not be pressed. This makes Alert.alert use the browser's own
// dialogs on the web: one button (or none) shows a message; Cancel plus an action shows OK/Cancel.
// Phones keep their normal native pop-ups.
import { Alert, Platform, type AlertButton } from 'react-native';

export function installWebAlert() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  (Alert as unknown as { alert: typeof Alert.alert }).alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = [...buttons].reverse().find((b) => b.style !== 'cancel');
    if (window.confirm(text)) action?.onPress?.();
    else cancel?.onPress?.();
  };
}
