// One client, seen by their counsellor: alerts and reasons, 14-day trends, shared journal,
// care plan (the client can read it), private session notes (only the counsellor), messages.
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../../lib/useApp';
import { deleteNote, fetchNotes, leaveLink, savePlan, saveNote } from '../../../lib/care';
import { uid, type CarePlan, type ProNote } from '../../../lib/store';
import { formatDateTime, dayKey } from '../../../lib/dates';
import { Txt, announce } from '../../../components/ui';
import { Card, DS, FieldBox, Page, Pill, SectionLabel, TopBar, useDS } from '../../../components/ds';
import { ColourDot, LOGO_COLOURS, MessageThread, MiniBars, SampleTag, Tabs } from '../../../components/care';
import { SessionAssistant } from '../../../components/SessionAssistant';

type Tab = 'overview' | 'assistant' | 'journal' | 'plan' | 'notes' | 'messages';

export default function Client() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, state, update } = useApp();
  const c = useDS();
  const person = state.care.people.find((p) => p.linkId === id);
  const [tab, setTab] = useState<Tab>('overview');
  const [plan, setPlan] = useState<CarePlan>(person?.plan ?? { goals: [] });
  const [goal, setGoal] = useState('');
  const [note, setNote] = useState<{ date: string; body: string; id?: string }>({ date: dayKey(), body: '' });

  useEffect(() => {
    if (!person || person.demo) return;
    fetchNotes(person.linkId).then((n) => n && update((s) => ({ ...s, care: { ...s.care, notes: [...s.care.notes.filter((x) => x.linkId !== person.linkId), ...n] } })));
  }, [id]);

  if (!person) return <Page top={<TopBar />}>{null}</Page>;
  const name = person.memberName;
  const s = person.summary;
  const notes = state.care.notes.filter((n) => n.linkId === person.linkId).sort((a, b) => b.date.localeCompare(a.date));
  const unread = state.care.messages.filter((m) => m.linkId === person.linkId && !m.mine && !m.read).length;
  const notShared = <Txt color={c.body}>{t('care.pro.notAllowed', { name })}</Txt>;

  const doSavePlan = async () => {
    try {
      const p = await savePlan(person.linkId, plan, person.demo);
      update((st) => ({ ...st, care: { ...st.care, people: st.care.people.map((x) => (x.linkId === person.linkId ? { ...x, plan: p } : x)) } }));
      announce(t('care.pro.planSaved'));
    } catch {
      announce(t('care.invite.error'));
    }
  };

  const doSaveNote = async () => {
    if (!note.body.trim()) return;
    try {
      const n = await saveNote({ id: note.id ?? uid(), linkId: person.linkId, date: note.date, body: note.body.trim(), at: new Date().toISOString() }, person.demo);
      update((st) => ({ ...st, care: { ...st.care, notes: [...st.care.notes.filter((x) => x.id !== note.id), n] } }));
      setNote({ date: dayKey(), body: '' });
      announce(t('common.saved'));
    } catch {
      announce(t('care.invite.error'));
    }
  };

  const removeNote = async (n: ProNote) => {
    await deleteNote(n.id, person.demo).catch(() => {});
    update((st) => ({ ...st, care: { ...st.care, notes: st.care.notes.filter((x) => x.id !== n.id) } }));
  };

  const leave = () => {
    const go = async () => {
      if (!person.demo) await leaveLink(person.linkId).catch(() => {});
      update((st) => ({ ...st, care: { ...st.care, people: st.care.people.filter((x) => x.linkId !== person.linkId), notes: st.care.notes.filter((x) => x.linkId !== person.linkId) } }));
      router.back();
    };
    if (Platform.OS === 'web') return go();
    Alert.alert(t('care.pro.leave'), t('care.pro.leaveBody', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('care.pro.leave'), style: 'destructive', onPress: go },
    ]);
  };

  const trends = s?.trends ?? [];
  const checkins = trends.filter((d) => d.checkedIn).length;

  return (
    <Page top={<TopBar title={name} subtitle={s?.days !== undefined ? t('care.pro.days', { n: s.days }) : undefined} />}>
      {person.demo ? <SampleTag /> : null}
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'overview', label: t('care.pro.tabs.overview') },
          { key: 'assistant', label: t('care.ai.tab') },
          { key: 'journal', label: t('care.pro.tabs.journal'), badge: person.journal.length || undefined },
          { key: 'plan', label: t('care.pro.tabs.plan') },
          { key: 'notes', label: t('care.pro.tabs.notes') },
          { key: 'messages', label: t('care.pro.tabs.messages'), badge: unread || undefined },
        ]}
      />

      {tab === 'overview' ? (
        <>
          {s?.logo ? (
            <View style={{ backgroundColor: s.logo === 'red' ? DS.helpRed : c.card, borderRadius: 18, padding: 16, gap: 10, borderLeftWidth: 6, borderLeftColor: LOGO_COLOURS[s.logo] }} accessibilityRole={s.logo === 'red' ? 'alert' : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ColourDot colour={s.logo} />
                <Txt bold color={s.logo === 'red' ? '#FFFFFF' : c.title} style={{ fontSize: 18 }}>{t(`care.colour.${s.logo}`)}</Txt>
              </View>
              <Txt color={s.logo === 'red' ? '#FFFFFF' : c.title}>{t(`care.pro.act.${s.logo}`, { name })}</Txt>
              {s.reasons?.length ? (
                <View style={{ gap: 4 }}>
                  <Txt bold color={s.logo === 'red' ? '#FFFFFF' : c.title}>{t('care.pro.why')}</Txt>
                  {s.reasons.map((r) => (
                    <Txt key={r} color={s.logo === 'red' ? '#FFFFFF' : c.body}>{`• ${t(`care.reasons.${r}`)}`}</Txt>
                  ))}
                </View>
              ) : null}
              {s.logo === 'red' || s.logo === 'pink' ? (
                <Pill title={t('care.pro.tabs.messages')} variant={s.logo === 'red' ? 'outline' : 'navy'} icon={{ name: 'chatbubble-outline' }} onPress={() => setTab('messages')} />
              ) : null}
              {s.logo === 'red' ? (
                <Pressable onPress={() => Linking.openURL('tel:997')} accessibilityRole="button" style={{ backgroundColor: '#FFFFFF', borderRadius: 999, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="call" size={18} color={DS.helpRed} />
                  <Txt bold color={DS.helpRed}>997</Txt>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Card>{s ? notShared : <Txt color={c.body}>{t('care.pro.waiting')}</Txt>}</Card>
          )}

          <SectionLabel>{t('care.pro.trends')}</SectionLabel>
          {s?.trends ? (
            <Card style={{ gap: 14 }}>
              <MiniBars label={t('care.pro.mood')} days={trends} pick={(d) => (d.mood === undefined ? undefined : d.mood + 1)} max={5} colour="#4E649D" fmt={(v) => `${v.toFixed(1)} / 5`} />
              <MiniBars label={t('care.pro.craving')} days={trends} pick={(d) => (d.craving === undefined ? undefined : d.craving + 0.15)} max={2.15} colour="#F28C28" fmt={(v) => `${Math.max(0, v - 0.15).toFixed(1)} / 2`} />
              <MiniBars label={t('care.pro.sleep')} days={trends} pick={(d) => d.sleep} max={10} colour="#0C6434" fmt={(v) => v.toFixed(1)} />
              <MiniBars label={t('care.pro.score')} days={trends} pick={(d) => d.score ?? undefined} max={100} colour="#8E6BC9" fmt={(v) => `${Math.round(v)}%`} />
              <Txt variant="small" color={c.body}>{t('care.pro.checkins', { n: checkins })}</Txt>
              {s.relapses30 !== undefined ? <Txt variant="small" color={c.body}>{t('care.pro.slips', { n: s.relapses30 })}</Txt> : null}
              {s.lastCheckinAt ? <Txt variant="small" color={c.body}>{t('care.pro.lastCheckin', { when: formatDateTime(new Date(s.lastCheckinAt), state.language) })}</Txt> : null}
              {s.nextAppointment ? <Txt variant="small" color={c.body}>{t('care.pro.nextAppt', { when: s.nextAppointment })}</Txt> : null}
            </Card>
          ) : (
            <Card>{notShared}</Card>
          )}

          {s?.goals?.length ? (
            <>
              <SectionLabel>{t('care.pro.goals')}</SectionLabel>
              <Card style={{ gap: 10 }}>
                {s.goals.map((g) => (
                  <View key={g.id} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Txt color={c.title}>{t(`goals.${g.id}`)}</Txt>
                      <Txt bold color={c.green}>{`${g.progress}%`}</Txt>
                    </View>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.border }}>
                      <View style={{ width: `${Math.min(100, g.progress)}%`, height: 8, borderRadius: 4, backgroundColor: c.green }} />
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}
          <View style={{ height: 6 }} />
          <Pill title={t('care.pro.leave')} variant="outline" onPress={leave} />
        </>
      ) : null}

      {tab === 'assistant' ? (
        <SessionAssistant
          person={person}
          onUseInPlan={(goals, homework) => {
            // Copies the draft into the plan editor only. The counsellor edits it and decides whether to save.
            setPlan((p) => ({ ...p, goals: [...p.goals, ...goals.filter((g) => !p.goals.includes(g))], homework: homework || p.homework }));
            setTab('plan');
            announce(t('care.ai.copied'));
          }}
        />
      ) : null}

      {tab === 'journal' ? (
        <>
          {!person.permissions.journal && !person.demo && !person.journal.length ? notShared : <Txt variant="small" color={c.body}>{t('care.pro.journalSub', { name })}</Txt>}
          {person.journal.length === 0 ? <Txt color={c.body}>{t('care.pro.journalEmpty')}</Txt> : null}
          {person.journal.map((j) => (
            <Card key={j.id} style={{ gap: 6 }}>
              <Txt bold color={c.body} style={{ fontSize: 13 }}>{formatDateTime(new Date(j.at), state.language)}</Txt>
              <Txt color={c.title}>{j.text}</Txt>
            </Card>
          ))}
        </>
      ) : null}

      {tab === 'plan' ? (
        <>
          <Txt variant="small" color={c.body}>{t('care.pro.planSub', { name })}</Txt>
          <Card style={{ gap: 10 }}>
            <Txt bold color={c.title}>{t('care.link.goals')}</Txt>
            {plan.goals.map((g, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt color={c.title} style={{ flex: 1 }}>{`• ${g}`}</Txt>
                <Pressable onPress={() => setPlan({ ...plan, goals: plan.goals.filter((_, x) => x !== i) })} accessibilityRole="button" accessibilityLabel={`${t('common.delete')}: ${g}`} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={22} color={c.body} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput value={goal} onChangeText={setGoal} placeholder={t('care.pro.goalPh')} placeholderTextColor="#8A94A6" accessibilityLabel={t('care.pro.addGoal')} style={{ flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, color: c.title }} />
              <Pressable
                onPress={() => {
                  if (!goal.trim()) return;
                  setPlan({ ...plan, goals: [...plan.goals, goal.trim()] });
                  setGoal('');
                }}
                accessibilityRole="button"
                accessibilityLabel={t('care.pro.addGoal')}
                style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={24} color={c.onNavy} />
              </Pressable>
            </View>
          </Card>
          <FieldBox label={t('care.link.next')} placeholder={t('care.pro.nextPh')} value={plan.nextSession ?? ''} onChangeText={(v) => setPlan({ ...plan, nextSession: v })} />
          <FieldBox label={t('care.link.homework')} placeholder={t('care.pro.homeworkPh')} value={plan.homework ?? ''} onChangeText={(v) => setPlan({ ...plan, homework: v })} multiline />
          <FieldBox label={t('care.link.note')} placeholder={t('care.pro.notePh', { name })} value={plan.shared ?? ''} onChangeText={(v) => setPlan({ ...plan, shared: v })} multiline />
          <Pill title={t('care.pro.savePlan')} variant="green" onPress={doSavePlan} />
        </>
      ) : null}

      {tab === 'notes' ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={16} color={c.green} />
            <Txt variant="small" color={c.green} style={{ flex: 1 }}>{t('care.pro.notesSub', { name })}</Txt>
          </View>
          <Card style={{ gap: 10 }}>
            <Txt bold color={c.title}>{note.id ? t('common.edit') : t('care.pro.newNote')}</Txt>
            <FieldBox label={t('care.pro.noteDate')} value={note.date} onChangeText={(v) => setNote({ ...note, date: v })} />
            <FieldBox placeholder={t('care.pro.notePh2')} value={note.body} onChangeText={(v) => setNote({ ...note, body: v })} multiline />
            <Pill title={t('care.pro.saveNote')} onPress={doSaveNote} disabled={!note.body.trim()} />
          </Card>
          {!notes.length ? <Txt color={c.body}>{t('care.pro.noNotes')}</Txt> : null}
          {notes.map((n) => (
            <Card key={n.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Txt bold color={c.title} style={{ flex: 1 }}>{n.date}</Txt>
                <Pressable onPress={() => setNote({ id: n.id, date: n.date, body: n.body })} accessibilityRole="button" accessibilityLabel={t('common.edit')} hitSlop={8} style={{ marginRight: 12 }}>
                  <Ionicons name="create-outline" size={20} color={c.navy} />
                </Pressable>
                <Pressable onPress={() => removeNote(n)} accessibilityRole="button" accessibilityLabel={t('care.pro.deleteNote')} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={c.body} />
                </Pressable>
              </View>
              <Txt color={c.title}>{n.body}</Txt>
            </Card>
          ))}
        </>
      ) : null}

      {tab === 'messages' ? <MessageThread linkId={person.linkId} demo={person.demo} canSend otherName={name} /> : null}
    </Page>
  );
}
