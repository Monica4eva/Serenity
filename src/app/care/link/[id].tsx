// One person on the care team: change what they see, read their care plan, message, or stop sharing.
import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../../lib/useApp';
import { revokeLink, updatePermissions } from '../../../lib/care';
import type { Permissions } from '../../../lib/summary';
import { Txt, announce } from '../../../components/ui';
import { Card, Page, Pill, SectionLabel, TopBar, useDS } from '../../../components/ds';
import { CodeBox, MessageThread, PermissionToggles, SampleTag } from '../../../components/care';

export default function LinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, state, update } = useApp();
  const c = useDS();
  const link = state.care.links.find((l) => l.id === id);
  const [perms, setPerms] = useState<Permissions>(link?.permissions ?? {});
  const [busy, setBusy] = useState(false);
  if (!link) return <Page top={<TopBar />}>{null}</Page>;
  const name = link.viewerName || link.label;
  const plan = state.care.plans[link.id];
  const changed = JSON.stringify(perms) !== JSON.stringify(link.permissions);

  const save = async () => {
    setBusy(true);
    try {
      const p = await updatePermissions(link, perms);
      update((s) => ({ ...s, care: { ...s.care, links: s.care.links.map((l) => (l.id === link.id ? { ...l, permissions: p } : l)) } }));
      announce(t('care.link.saved'));
    } catch {
      announce(t('care.invite.error'));
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    const go = async () => {
      try {
        await revokeLink(link);
      } catch {}
      update((s) => ({
        ...s,
        care: {
          ...s.care,
          links: s.care.links.filter((l) => l.id !== link.id),
          shared: Object.fromEntries(Object.entries(s.care.shared).map(([k, v]) => [k, v.filter((x) => x !== link.id)])),
          messages: s.care.messages.filter((m) => m.linkId !== link.id),
        },
      }));
      announce(t('care.link.stopped', { name }));
      router.back();
    };
    if (Platform.OS === 'web') return go();
    Alert.alert(t('care.link.stopTitle'), t('care.link.stopBody', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('care.link.stopYes'), style: 'destructive', onPress: go },
    ]);
  };

  return (
    <Page top={<TopBar title={name} subtitle={t(link.status === 'pending' ? 'care.team.pending' : 'care.team.active')} />}>
      {link.demo ? <SampleTag /> : null}
      {link.status === 'pending' && link.code ? (
        <View style={{ gap: 8 }}>
          <SectionLabel>{t('care.link.code')}</SectionLabel>
          <CodeBox code={link.code} />
          <Txt variant="small" color={c.body}>{t('care.invite.codeBody')}</Txt>
        </View>
      ) : null}

      {link.role === 'professional' && link.status === 'active' ? (
        <>
          <SectionLabel>{t('care.link.plan', { name })}</SectionLabel>
          <Card style={{ gap: 8 }}>
            {!plan ? <Txt color={c.body}>{t('care.link.noPlan', { name })}</Txt> : null}
            {plan?.nextSession ? <Txt color={c.title}><Txt bold color={c.title}>{t('care.link.next')}: </Txt>{plan.nextSession}</Txt> : null}
            {plan?.goals?.length ? (
              <View style={{ gap: 4 }}>
                <Txt bold color={c.title}>{t('care.link.goals')}</Txt>
                {plan.goals.map((g, i) => <Txt key={i} color={c.title}>{`• ${g}`}</Txt>)}
              </View>
            ) : null}
            {plan?.homework ? <Txt color={c.title}><Txt bold color={c.title}>{t('care.link.homework')}: </Txt>{plan.homework}</Txt> : null}
            {plan?.shared ? <Txt color={c.title}><Txt bold color={c.title}>{t('care.link.note')}: </Txt>{plan.shared}</Txt> : null}
          </Card>
        </>
      ) : null}

      <SectionLabel>{t('care.link.whatSee', { name })}</SectionLabel>
      <PermissionToggles role={link.role} value={perms} onChange={setPerms} />
      {changed ? <Pill title={t('care.link.save')} disabled={busy} onPress={save} /> : null}

      {link.status === 'active' ? (
        <>
          <SectionLabel>{t('care.link.messages')}</SectionLabel>
          <MessageThread linkId={link.id} demo={link.demo} canSend otherName={name} />
        </>
      ) : null}

      <View style={{ height: 6 }} />
      <Pill title={link.status === 'pending' ? t('care.link.cancelInvite') : t('care.link.stop', { name })} variant="red" onPress={stop} />
    </Page>
  );
}
