// "AI assist" tab for counsellors: Serenity Session Assistant.
// The counsellor asks for a draft; it is clearly marked as AI, checked by them, and only reaches
// the client if they copy it into the care plan, edit it and save it themselves.
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { AssistantFailure, prepareSession, type AssistantResult } from '../lib/assistant';
import type { LinkedPerson } from '../lib/store';
import { formatDateTime } from '../lib/dates';
import { Txt, announce } from './ui';
import { Card, DS, Pill, SectionLabel, useDS } from './ds';

export function SessionAssistant({ person, onUseInPlan }: { person: LinkedPerson; onUseInPlan: (goals: string[], homework: string) => void }) {
  const { t, state } = useApp();
  const c = useDS();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<AssistantResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canSee = person.demo || person.permissions.trends;

  const run = async () => {
    setBusy(true);
    setErr(null);
    announce(t('care.ai.working'));
    try {
      const r = await prepareSession(person, state.language);
      setRes(r);
      announce(t('care.ai.ready'));
    } catch (e) {
      setErr(t(`care.ai.err.${e instanceof AssistantFailure ? e.code : 'unknown'}`));
    } finally {
      setBusy(false);
    }
  };

  const section = (title: string, items: string[], icon: keyof typeof Ionicons.glyphMap) =>
    items.length ? (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon} size={18} color={c.navy} />
          <Txt bold color={c.title}>{title}</Txt>
        </View>
        {items.map((x, i) => (
          <Txt key={i} color={c.body}>{`• ${x}`}</Txt>
        ))}
      </View>
    ) : null;

  return (
    <>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="sparkles-outline" size={22} color={c.navy} />
          <Txt bold color={c.title} style={{ fontSize: 17, flex: 1 }}>{t('care.ai.title')}</Txt>
        </View>
        <Txt color={c.body}>{t('care.ai.intro')}</Txt>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="shield-checkmark-outline" size={16} color={c.green} style={{ marginTop: 2 }} />
          <Txt variant="small" color={c.green} style={{ flex: 1 }}>{t('care.ai.privacy')}</Txt>
        </View>
      </Card>

      {!canSee ? (
        <Card>
          <Txt color={c.body}>{t('care.pro.notAllowed', { name: person.memberName })}</Txt>
        </Card>
      ) : (
        <Pill title={res ? t('care.ai.again') : t('care.ai.run')} icon={{ name: 'sparkles-outline' }} onPress={run} disabled={busy} />
      )}

      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', padding: 12 }}>
          <ActivityIndicator color={c.navy} />
          <Txt color={c.body}>{t('care.ai.working')}</Txt>
        </View>
      ) : null}

      {err ? (
        <Card cream>
          <Txt color={c.title}>{err}</Txt>
        </Card>
      ) : null}

      {res && !busy ? (
        <>
          {res.safety ? (
            <View style={{ backgroundColor: DS.helpRed, borderRadius: 16, padding: 14 }} accessibilityRole="alert">
              <Txt bold color="#FFFFFF">{res.safety}</Txt>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.tint('lavender'), borderRadius: 12, padding: 10 }}>
            <Ionicons name="alert-circle-outline" size={18} color={c.navy} />
            <Txt variant="small" color={c.title} style={{ flex: 1 }}>{res.source === 'ai' ? t('care.ai.draftBadge') : t('care.ai.builtinBadge')}</Txt>
          </View>
          <Card style={{ gap: 14 }}>
            {section(t('care.ai.changes'), res.draft.changes, 'trending-up-outline')}
            {section(t('care.ai.watch'), res.draft.watch, 'eye-outline')}
            {section(t('care.ai.talk'), res.draft.talkingPoints, 'chatbubbles-outline')}
            {section(t('care.ai.goals'), res.draft.planGoals, 'flag-outline')}
            {res.draft.homework ? section(t('care.ai.homework'), [res.draft.homework], 'clipboard-outline') : null}
          </Card>
          <Pill title={t('care.ai.usePlan')} variant="outline" icon={{ name: 'create-outline' }} onPress={() => onUseInPlan(res.draft.planGoals, res.draft.homework)} />
          <SectionLabel>{t('care.ai.about')}</SectionLabel>
          <Txt variant="small" color={c.body}>
            {res.source === 'ai'
              ? t('care.ai.meta', { model: res.model ?? 'AI', when: formatDateTime(new Date(res.at), state.language) })
              : t('care.ai.metaBuiltin', { when: formatDateTime(new Date(res.at), state.language), code: res.note ?? 'unknown' })}
          </Txt>
          {state.language === 'tn' ? <Txt variant="small" color={c.body}>{t('care.ai.tnNote')}</Txt> : null}
        </>
      ) : null}
    </>
  );
}
