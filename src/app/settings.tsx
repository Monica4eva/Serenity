import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Share, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useApp } from '../lib/useApp';
import { addConsent, ConsentType, latestConsent, Settings as S } from '../lib/store';
import { hashSecretStrong } from '../lib/security';
import { Button, Card, Field, Radio, Screen, Txt, announce } from '../components/ui';
import * as Clipboard from 'expo-clipboard';
import { formatDateTime } from '../lib/dates';
import { backendEnabled } from '../lib/supabase';
import { deleteAccountOnline, signOut } from '../lib/auth';
import { getJournalKey, setJournalKey } from '../lib/crypto';
import { useSync } from '../components/SyncProvider';

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <Txt color={theme.colors.heading}>{label}</Txt>
        {desc ? <Txt variant="small">{desc}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        accessibilityHint={desc}
        trackColor={{ true: theme.colors.success, false: '#B7BEC9' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function Settings() {
  const { t, state, update, reset, theme } = useApp();
  const s = state.settings;
  const set = (patch: Partial<S>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const [pin, setPin] = useState('');
  const sync = useSync();
  const [key, setKey] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreVal, setRestoreVal] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  const restore = async () => {
    if (!(await setJournalKey(restoreVal))) return setRestoreMsg(t('settings.restoreBad'));
    setRestoreMsg(t('settings.restoreOk'));
    setRestoreVal('');
    await sync.pullNow();
  };

  const logOut = () =>
    Alert.alert(t('settings.logOut'), t('settings.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        onPress: async () => {
          await sync.syncNow();
          await signOut();
          update((x) => ({ ...x, loggedIn: false }));
          router.replace('/onboarding/login');
        },
      },
    ]);

  useEffect(() => {
    if (s.blockScreenshots) ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    else ScreenCapture.allowScreenCaptureAsync().catch(() => {});
  }, [s.blockScreenshots]);

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return;
    const pinHash = await hashSecretStrong(pin);
    set({ pinHash, appLock: true });
    setPin('');
    announce(t('common.saved'));
  };

  const exportData = () => {
    // Journal text is included only in the user's own full export.
    const { account, ...rest } = state;
    Share.share({ message: JSON.stringify({ ...rest, account: account ? { ...account, passwordHash: undefined } : undefined }, null, 2) });
  };

  const del = () =>
    Alert.alert(t('settings.deleteAll'), t('settings.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const r = await deleteAccountOnline();
          if (!r.ok) return Alert.alert(t('settings.deleteAll'), r.message);
          await reset();
          router.replace('/');
        },
      },
    ]);

  const quickExit = () => {
    // Close to a neutral screen; on Android also leave the app.
    router.replace('/neutral');
    BackHandler.exitApp();
  };

  const consentRows: { type: ConsentType; label: string }[] = [
    { type: 'data', label: t('settings.cData') },
    { type: 'health', label: t('settings.cHealth') },
    { type: 'analytics', label: t('settings.cAnalytics') },
    { type: 'research', label: t('settings.cResearch') },
  ];

  const q = useLocalSearchParams<{ section?: string }>();
  const sec = q.section; // 'app' | 'privacy' | 'language' | undefined (all)
  const show = (...names: string[]) => !sec || names.includes(sec);
  const titleKey = sec === 'app' ? 'ui.appNotif' : sec === 'privacy' ? 'ui.privacyData' : sec === 'language' ? 'settings.language' : 'settings.title';

  return (
    <Screen title={t(titleKey)}>
      {show('privacy') ? <Button variant="danger" icon="exit-outline" title={t('settings.quickExit')} onPress={quickExit} /> : null}

      {show('privacy') ? (
      <Card>
        <Txt variant="h3">{t('settings.backup')}</Txt>
        {backendEnabled ? (
          <>
            <Txt accessibilityLiveRegion="polite">{t(`settings.status.${sync.status}`)}</Txt>
            {sync.lastAt ? <Txt variant="small">{t('settings.lastBackup', { when: formatDateTime(new Date(sync.lastAt), state.language) })}</Txt> : null}
            {sync.status === 'signedOut' ? (
              <Button variant="secondary" title={t('settings.logIn')} onPress={() => router.push('/onboarding/login')} />
            ) : (
              <>
                <Button variant="secondary" icon="cloud-upload-outline" title={t('settings.syncNow')} onPress={sync.syncNow} disabled={sync.status === 'syncing'} />
                <Button variant="ghost" title={t('settings.logOut')} onPress={logOut} />
              </>
            )}
          </>
        ) : (
          <Txt>{t('settings.backupOff')}</Txt>
        )}
      </Card>
      ) : null}

      {show('privacy') ? (
      <Card>
        <Txt variant="h3">{t('settings.journalKey')}</Txt>
        <Txt variant="small">{t('settings.journalKeyBody')}</Txt>
        {key ? (
          <>
            <Txt bold selectable accessibilityLabel={t('settings.journalKey')}>
              {key}
            </Txt>
            <Button variant="secondary" icon="copy-outline" title={t('settings.copyKey')} onPress={async () => { await Clipboard.setStringAsync(key); announce(t('settings.copied')); }} />
          </>
        ) : (
          <Button variant="secondary" icon="key-outline" title={t('settings.showKey')} onPress={async () => setKey(await getJournalKey())} />
        )}
        {restoring ? (
          <>
            <Field label={t('settings.restoreLabel')} value={restoreVal} onChangeText={setRestoreVal} autoCapitalize="none" />
            <Button title={t('common.save')} onPress={restore} disabled={!restoreVal.trim()} />
          </>
        ) : (
          <Button variant="ghost" title={t('settings.restoreKey')} onPress={() => setRestoring(true)} />
        )}
        {restoreMsg ? <Txt accessibilityLiveRegion="polite">{restoreMsg}</Txt> : null}
      </Card>
      ) : null}

      {show('app', 'language') ? (
      <Card>
        <Txt variant="h3">{t('settings.language')}</Txt>
        <Radio label={`🇬🇧  ${t('language.english')}`} selected={state.language === 'en'} onPress={() => update((x) => ({ ...x, language: 'en' }))} />
        <Radio label={`🇧🇼  ${t('language.setswana')}`} selected={state.language === 'tn'} onPress={() => update((x) => ({ ...x, language: 'tn' }))} />
      </Card>
      ) : null}

      {show('app') ? (
      <Card>
        <Txt variant="h3">{t('settings.appearance')}</Txt>
        <Radio label={`☀️  ${t('settings.light')}`} selected={s.themeMode === 'light'} onPress={() => set({ themeMode: 'light', dark: false })} />
        <Radio label={`🌙  ${t('settings.dark')}`} selected={s.themeMode === 'dark'} onPress={() => set({ themeMode: 'dark', dark: true })} />
        <Radio label={`📱  ${t('settings.system')}`} desc={t('settings.systemDesc')} selected={s.themeMode === 'system'} onPress={() => set({ themeMode: 'system', dark: false })} />
      </Card>
      ) : null}

      {show('app') ? (
      <Card>
        <Txt variant="h3">{t('settings.accessibility')}</Txt>
        <Txt color={theme.colors.heading}>
          {t('settings.textSize')}: {Math.round(s.fontScale * 100)}%
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 1.25, 1.5, 2].map((v) => (
            <View key={v} style={{ flex: 1 }}>
              <Button variant={s.fontScale === v ? 'primary' : 'secondary'} title={`${v * 100}%`} onPress={() => set({ fontScale: v })} />
            </View>
          ))}
        </View>
        <Toggle label={t('settings.dyslexia')} desc={t('settings.dyslexiaDesc')} value={s.dyslexia} onChange={(v) => set({ dyslexia: v })} />
        <Toggle label={t('settings.highContrast')} value={s.highContrast} onChange={(v) => set({ highContrast: v })} />
        <Toggle label={t('settings.voiceFirst')} desc={t('settings.voiceFirstDesc')} value={s.voiceFirst} onChange={(v) => set({ voiceFirst: v })} />
        <Toggle label={t('ui.dailyReminders')} value={s.reminders} onChange={(v) => set({ reminders: v })} />
        <Toggle label={t('settings.simple')} desc={t('settings.simpleDesc')} value={s.simplePrompts} onChange={(v) => set({ simplePrompts: v })} />
      </Card>
      ) : null}

      {show('privacy') ? (
      <Card>
        <Txt variant="h3">{t('settings.privacy')}</Txt>
        <Toggle label={t('settings.appLock')} value={s.appLock && !!s.pinHash} onChange={(v) => set({ appLock: v && !!s.pinHash })} />
        <Field label={t('settings.setPin')} value={pin} onChangeText={setPin} secure keyboardType="number-pad" />
        <Button variant="secondary" title={t('common.save')} onPress={savePin} disabled={!/^\d{4,6}$/.test(pin)} />
        <Toggle label={t('settings.discreet')} desc={t('settings.discreetDesc')} value={s.discreet} onChange={(v) => set({ discreet: v })} />
        <Toggle label={t('settings.screenshot')} value={s.blockScreenshots} onChange={(v) => set({ blockScreenshots: v })} />
      </Card>
      ) : null}

      {show('privacy') ? (
      <Card>
        <Txt variant="h3">{t('settings.consents')}</Txt>
        <Txt variant="small">
          {t('settings.cTerms')}: {state.termsVersionAccepted ? `v${state.termsVersionAccepted}` : t('settings.revoked')}
        </Txt>
        {consentRows.map((c) => (
          <Toggle key={c.type} label={c.label} value={latestConsent(state, c.type)} onChange={(v) => update((x) => addConsent(x, c.type, v))} />
        ))}
        <Button variant="ghost" title={t('consent.readTerms')} onPress={() => router.push('/onboarding/terms')} />
      </Card>
      ) : null}

      {show('app') ? (
      <Card>
        <Txt variant="h3">{t('settings.approach')}</Txt>
        <Button variant="secondary" title={t('approach.title')} onPress={() => router.push('/onboarding/approach')} />
        <Button variant="secondary" title={t('goals.title')} onPress={() => router.push('/onboarding/goals')} />
        <Button variant="secondary" title={t('extended.title')} onPress={() => router.push('/onboarding/extended')} />
      </Card>
      ) : null}

      {show('privacy') ? (
      <Card>
        <Button variant="secondary" icon="download-outline" title={t('settings.export')} onPress={exportData} />
        <Button variant="danger" icon="trash-outline" title={t('settings.deleteAll')} onPress={del} />
        <Txt variant="small" center>
          {t('settings.version')}
        </Txt>
      </Card>
      ) : null}
    </Screen>
  );
}
