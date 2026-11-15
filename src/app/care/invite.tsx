// Invite a counsellor, or a family member or friend. The person chooses what they can see.
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { createInvite } from '../../lib/care';
import { defaultPermissions, type CareRole, type Permissions } from '../../lib/summary';
import type { CareLinkLocal } from '../../lib/store';
import { Txt, announce } from '../../components/ui';
import { Card, FieldBox, Page, Pill, SectionLabel, TopBar, useDS } from '../../components/ds';
import { CodeBox, PermissionToggles } from '../../components/care';

export default function Invite() {
  const { t, state, update } = useApp();
  const c = useDS();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: CareRole = params.role === 'supporter' ? 'supporter' : 'professional';
  const [label, setLabel] = useState('');
  const [myName, setMyName] = useState(state.profile.preferredName || '');
  const [perms, setPerms] = useState<Permissions>(defaultPermissions(role));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [made, setMade] = useState<CareLinkLocal | null>(null);

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const link = await createInvite(role, label.trim() || t(role === 'professional' ? 'care.team.pros' : 'care.team.sups'), myName.trim(), perms);
      update((s) => ({ ...s, care: { ...s.care, links: [...s.care.links, link] } }));
      setMade(link);
      announce(t('care.invite.codeTitle', { name: link.label }));
    } catch {
      setErr(t('care.invite.error'));
      announce(t('care.invite.error'));
    } finally {
      setBusy(false);
    }
  };

  if (made?.code) {
    const roleName = t(role === 'professional' ? 'care.role.professional.t' : 'care.role.supporter.t');
    const formatted = `${made.code.slice(0, 5)}-${made.code.slice(5)}`;
    return (
      <Page top={<TopBar close title={t('care.invite.codeTitle', { name: made.label })} />} footer={<Pill title={t('care.invite.done')} onPress={() => router.replace('/care/team')} />}>
        <CodeBox code={made.code} />
        <Txt color={c.title} center>{t('care.invite.codeBody')}</Txt>
        <Pill title={t('care.invite.share')} icon={{ name: 'share-social-outline' }} variant="green" onPress={() => Share.share({ message: t('care.invite.shareMsg', { name: made.label, role: roleName, code: formatted }) })} />
        <Pill
          title={t('care.invite.copy')}
          variant="outline"
          icon={{ name: 'copy-outline' }}
          onPress={async () => {
            await Clipboard.setStringAsync(formatted);
            announce(t('care.invite.copied'));
          }}
        />
        {made.demo ? (
          <Card cream>
            <Txt variant="small" color={c.body}>{t('care.invite.demoNote')}</Txt>
          </Card>
        ) : null}
      </Page>
    );
  }

  return (
    <Page
      top={<TopBar title={t(role === 'professional' ? 'care.invite.titlePro' : 'care.invite.titleSup')} />}
      footer={<Pill title={busy ? t('care.invite.creating') : t('care.invite.create')} disabled={busy} chevron onPress={create} />}
    >
      <FieldBox label={t('care.invite.name')} placeholder={t('care.invite.namePh')} value={label} onChangeText={setLabel} />
      <FieldBox label={t('care.invite.myName')} value={myName} onChangeText={setMyName} />
      <SectionLabel>{t('care.invite.whatSee')}</SectionLabel>
      <PermissionToggles role={role} value={perms} onChange={setPerms} />
      <Txt variant="small" color={c.body}>{t('care.team.never')}</Txt>
      {err ? <Txt color="#C62828">{err}</Txt> : null}
      <View style={{ height: 8 }} />
    </Page>
  );
}
