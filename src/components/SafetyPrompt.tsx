// Gentle, optional follow-up after journal or mood text (Section 8.6 and 8.9).
// Low mood: offer support, never an automatic alert.
// Possible crisis language: ask the safety question directly and calmly.
// The person can always say "This doesn't apply to me", which is recorded as feedback.
import React from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import type { TextSignal } from '../lib/engine';
import { Button, Card, Txt } from './ui';

export default function SafetyPrompt({ signal, onClose, context }: { signal: TextSignal; onClose: () => void; context: string }) {
  const { t, update, theme } = useApp();
  if (signal === 'none') return null;

  const dismiss = () => {
    update((s) => ({ ...s, dismissals: [...s.dismissals, { at: new Date().toISOString(), context: `${context}:${signal}` }] }));
    onClose();
  };
  const red = () => {
    update((s) => ({
      ...s,
      safetyEvents: [...s.safetyEvents, { at: new Date().toISOString(), kind: 'disclosure' }],
      checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { disclosure: true }, level: 'red', reasons: ['disclosure'], at: new Date().toISOString() }],
    }));
    router.replace('/crisis?mode=emergency');
  };

  if (signal === 'crisis')
    return (
      <Card style={{ borderWidth: 2, borderColor: theme.colors.primary }}>
        <Txt variant="h3" accessibilityLiveRegion="assertive">
          {t('balance.safetyQ')}
        </Txt>
        <Button title={t('balance.safetyYes')} variant="danger" onPress={red} />
        <Button title={t('balance.safetyUnsure')} variant="secondary" onPress={red} />
        <Button title={t('balance.safetyNo')} variant="ghost" onPress={dismiss} />
      </Card>
    );

  return (
    <Card style={{ backgroundColor: theme.colors.selected }}>
      <Txt accessibilityLiveRegion="polite">
        {t('mood.heavy')}
      </Txt>
      <Button title={t('mood.talk')} onPress={() => router.replace('/(tabs)/support')} />
      <Button title={t('mood.calm')} variant="secondary" onPress={() => router.replace('/activities')} />
      <Button title={t('mood.notNow')} variant="ghost" onPress={onClose} />
      <Button title={t('mood.notApply')} variant="ghost" onPress={dismiss} />
    </Card>
  );
}
