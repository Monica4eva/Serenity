import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { biometricAvailable, biometricUnlock, getLockState, hashSecretStrong, isLegacyHash, recordPinResult, verifySecret } from '../lib/security';
import Logo from './Logo';
import { Button, Field, Screen, Txt, announce } from './ui';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { state, update, t, theme } = useApp();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [bio, setBio] = useState(false);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getLockState().then((l) => setUntil(l.until));
    biometricAvailable().then((ok) => {
      setBio(ok);
      if (ok) biometricUnlock(t('lock.title')).then((s) => { if (s) unlock(); });
    });
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const unlock = async () => {
    await recordPinResult(true);
    onUnlock();
  };

  const wait = Math.max(0, Math.ceil((until - now) / 1000));

  const tryPin = async () => {
    if (wait > 0) return;
    const ok = await verifySecret(pin, state.settings.pinHash);
    if (ok) {
      if (isLegacyHash(state.settings.pinHash)) {
        const pinHash = await hashSecretStrong(pin);
        update((s) => ({ ...s, settings: { ...s.settings, pinHash } }));
      }
      return unlock();
    }
    const l = await recordPinResult(false);
    setUntil(l.until);
    setPin('');
    const msg = l.until > Date.now() ? t('lock.tooMany', { s: Math.ceil((l.until - Date.now()) / 1000) }) : t('lock.wrong');
    setErr(msg);
    announce(msg);
  };

  return (
    <Screen back={false}>
      <View style={{ alignItems: 'center', gap: 12, marginTop: 40 }}>
        <Logo size={88} />
        <Txt variant="h1" center>
          {t('lock.title')}
        </Txt>
      </View>
      <Field label={t('lock.enterPin')} value={pin} onChangeText={setPin} secure keyboardType="number-pad" error={wait > 0 ? t('lock.tooMany', { s: wait }) : err} />
      <Button title={t('lock.unlock')} onPress={tryPin} disabled={pin.length < 4 || wait > 0} />
      {bio ? <Button variant="secondary" title={t('lock.biometric')} onPress={() => biometricUnlock(t('lock.title')).then((s) => { if (s) unlock(); })} /> : null}
      {/* Crisis access is always available, even when locked (Section 8.1). */}
      <Button variant="danger" title={t('today.getSupport')} icon="heart" onPress={() => router.push('/help')} />
      <Txt variant="small" center color={theme.colors.body}>
        {t('welcome.needHelpNow')}
      </Txt>
    </Screen>
  );
}
