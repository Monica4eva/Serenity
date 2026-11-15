// A counsellor's own details. Self-declared: shown as "not verified" until an administrator checks them.
import React, { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { saveCareProfile } from '../../lib/care';
import { Txt, announce } from '../../components/ui';
import { Card, FieldBox, Page, Pill, TopBar, useDS } from '../../components/ds';

export default function ProProfile() {
  const { t, state, update } = useApp();
  const c = useDS();
  const [f, setF] = useState({ name: state.profile.preferredName || state.account?.fullName || '', ...(state.care.proProfile ?? {}) });
  const save = async () => {
    update((s) => ({ ...s, profile: { ...s.profile, preferredName: f.name.trim() }, care: { ...s.care, proProfile: { profession: f.profession?.trim(), registration: f.registration?.trim(), organisation: f.organisation?.trim() } } }));
    await saveCareProfile('professional', f.name.trim(), f).catch(() => {});
    announce(t('common.saved'));
    router.back();
  };
  return (
    <Page top={<TopBar title={t('care.pro.profile')} />} footer={<Pill title={t('common.save')} onPress={save} />}>
      <FieldBox label={t('care.connect.name')} value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
      <FieldBox label={t('care.pro.profession')} placeholder={t('care.pro.professionPh')} value={f.profession ?? ''} onChangeText={(v) => setF({ ...f, profession: v })} />
      <FieldBox label={t('care.pro.registration')} placeholder={t('care.pro.registrationPh')} value={f.registration ?? ''} onChangeText={(v) => setF({ ...f, registration: v })} />
      <FieldBox label={t('care.pro.organisation')} value={f.organisation ?? ''} onChangeText={(v) => setF({ ...f, organisation: v })} />
      <Card cream>
        <Txt variant="small" color={c.body}>{t('care.pro.unverified')}</Txt>
      </Card>
    </Page>
  );
}
