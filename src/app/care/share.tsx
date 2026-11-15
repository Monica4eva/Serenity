// Share one journal entry with chosen people on the care team (only those allowed to read journal entries).
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { shareJournalEntry, unshareJournalEntry } from '../../lib/care';
import { Txt, announce } from '../../components/ui';
import { Card, OptionCard, Page, Pill, TopBar, useDS } from '../../components/ds';

export default function ShareEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, state, update } = useApp();
  const c = useDS();
  const entry = state.journal.find((j) => j.id === id);
  const targets = state.care.links.filter((l) => l.status !== 'revoked' && l.permissions.journal);
  const shared = state.care.shared[id ?? ''] ?? [];
  if (!entry) return <Page top={<TopBar close />}>{null}</Page>;

  const toggle = async (linkId: string) => {
    const link = targets.find((l) => l.id === linkId)!;
    const on = shared.includes(linkId);
    try {
      if (on) await unshareJournalEntry(link, entry.id);
      else await shareJournalEntry(link, entry);
      update((s) => ({ ...s, care: { ...s.care, shared: { ...s.care.shared, [entry.id]: on ? shared.filter((x) => x !== linkId) : [...shared, linkId] } } }));
      announce(on ? t('care.share.unshare') : t('care.share.shared'));
    } catch {
      announce(t('care.invite.error'));
    }
  };

  return (
    <Page top={<TopBar close title={t('care.share.title')} subtitle={t('care.share.sub')} />} footer={<Pill title={t('common.done')} onPress={() => router.back()} />}>
      <Card cream>
        <Txt color={c.title} numberOfLines={4}>{entry.text}</Txt>
      </Card>
      {!targets.length ? (
        <Card style={{ gap: 10 }}>
          <Txt color={c.title}>{t('care.share.none')}</Txt>
          <Pill title={t('care.today.team')} variant="outline" onPress={() => router.replace('/care/team')} />
        </Card>
      ) : null}
      {targets.map((l) => (
        <OptionCard key={l.id} title={l.viewerName || l.label} desc={shared.includes(l.id) ? t('care.share.shared') : undefined} selected={shared.includes(l.id)} onPress={() => toggle(l.id)} kind="check" />
      ))}
    </Page>
  );
}
