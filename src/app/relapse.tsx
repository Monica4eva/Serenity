// Relapse never feels punishing (Section 5.3 and 8.4): safety first, history kept,
// the person chooses whether to reset the counter. No red failure screens.
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { daysBetween } from '../lib/dates';
import { Button, Card, Screen, Txt } from '../components/ui';
import { ContactRow } from '../components/ContactList';

export default function Relapse() {
  const { t, state, update } = useApp();
  const days = daysBetween(state.recoveryStart);
  const [step, setStep] = useState<'safe' | 'count' | 'done'>('safe');

  const log = () =>
    update((s) => ({
      ...s,
      checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { relapse: true }, level: 'amber', reasons: ['relapse'], at: new Date().toISOString() }],
    }));

  if (step === 'safe')
    return (
      <Screen title={t('relapse.title')}>
        <Txt variant="h3">{t('relapse.body', { n: days })}</Txt>
        <Button variant="success" title={t('relapse.safe')} onPress={() => { log(); setStep('count'); }} />
        <Button variant="danger" title={t('relapse.notSafe')} onPress={() => { log(); router.replace('/crisis?mode=emergency'); }} />
      </Screen>
    );

  if (step === 'count')
    return (
      <Screen title={t('relapse.title')}>
        <Txt variant="h3">{t('today.experience', { n: days })}</Txt>
        <Button
          title={t('relapse.reset')}
          onPress={() => {
            update((s) => ({ ...s, relapses: [...s.relapses, { at: new Date().toISOString(), priorDays: days }], recoveryStart: new Date().toISOString() }));
            setStep('done');
          }}
        />
        <Button variant="secondary" title={t('relapse.keep')} onPress={() => setStep('done')} />
      </Screen>
    );

  return (
    <Screen title={t('relapse.title')} footer={<Button title={t('common.done')} onPress={() => router.replace('/(tabs)')} />}>
      <Card>
        <Txt variant="h3">{t('relapse.done')}</Txt>
      </Card>
      <Card>
        <Txt bold>{t('comeback.relapseTitle')}</Txt>
        <Txt>{t('comeback.relapseBody')}</Txt>
        <Button variant="success" title={t('comeback.relapseBtn')} onPress={() => router.replace('/comeback?reason=slip' as any)} />
      </Card>
      <Txt>{t('relapse.supportBody')}</Txt>
      {state.contacts.map((c) => (
        <ContactRow key={c.id} c={c} actions />
      ))}
      <Button variant="secondary" title={t('support.facilities')} onPress={() => router.push('/(tabs)/support')} />
    </Screen>
  );
}
