// Recovery Baseline Assessment, 3 pages (designer's layout):
// 1 Recovery Background, 2 Health & Well-being, 3 Today's snapshot (mood, HALT, cravings, triggers).
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useApp } from '../../lib/useApp';
import { uid } from '../../lib/store';
import { Txt, ProgressBar } from '../../components/ui';
import { MOODS } from '../../components/MoodRow';
import { Brand, Card, FieldBox, Heading, Page, Pill, Select, SquareCheck, TextLink, TopBar, useDS } from '../../components/ds';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useDS();
  return (
    <Card style={{ gap: 10, borderWidth: 1, borderColor: c.d ? c.border : '#DCE3E8', shadowOpacity: 0 }}>
      <Txt bold color={c.title} style={{ fontSize: 17 }}>
        {title}
      </Txt>
      {children}
    </Card>
  );
}

export default function Baseline() {
  const { t, state, update } = useApp();
  const c = useDS();
  const params = useLocalSearchParams<{ page?: string }>();
  const page = Number(params.page ?? 1);
  const d = state.details;
  const [v, setV] = useState<Record<string, string | undefined>>({ ...d });
  const b = state.baseline;
  const [feeling, setFeeling] = useState<number | undefined>(b.feeling);
  const [halt, setHalt] = useState<string[]>(b.halt);
  const [craving, setCraving] = useState<number>(b.craving ?? 0);
  const set = (k: string) => (x: string) => setV({ ...v, [k]: x });
  const opts = (group: string, keys: string[]) => keys.map((k) => ({ key: k, label: t(`ui.${group}.${k}`) }));
  const yn = opts('yn', ['yes', 'no', 'unsure']);

  const SLEEP_HOURS: Record<string, number> = { s1: 4.5, s2: 5.5, s3: 6.5, s4: 8, s5: 9.5 };
  const saveDetails = () =>
    update((s) => ({
      ...s,
      details: { ...s.details, ...v },
      baseline: { ...s.baseline, sleepHours: v.usualSleep ? SLEEP_HOURS[v.usualSleep] : s.baseline.sleepHours },
    }));

  const finishAll = () => {
    update((s) => ({
      ...s,
      details: { ...s.details, ...v },
      baseline: {
        ...s.baseline,
        feeling,
        halt,
        craving,
        note: v.anything,
        extended: { ...s.baseline.extended, ...(!s.baseline.extended.earlyWarning && v.earlySigns ? { earlyWarning: v.earlySigns } : {}) },
      },
      checkins: [...s.checkins, { id: uid(), type: 'baseline', answers: { feeling, halt, craving, sleep: s.baseline.sleepHours }, at: new Date().toISOString() }],
    }));
    router.push(state.onboarded ? '/(tabs)' : '/onboarding/intro');
  };

  const later = () => {
    saveDetails();
    update((s) => ({ ...s, onboarded: true }));
    router.replace('/(tabs)');
  };

  const header = (
    <View style={{ gap: 10 }}>
      <Brand wordmark={false} size={80} />
      {page < 3 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt variant="h2" color={c.title} style={{ flex: 1 }}>
              {t('ui.baseTitle')}
            </Txt>
            <Txt bold color={c.title}>
              {t('ui.baseOf', { n: page })}
            </Txt>
          </View>
          <ProgressBar value={page / 3} color={c.navy} />
        </>
      ) : null}
    </View>
  );

  if (page === 1)
    return (
      <Page
        top={<TopBar />}
        footer={
          <>
            <Pill title={t('common.continue')} onPress={() => { saveDetails(); router.push('/onboarding/baseline?page=2'); }} />
            <TextLink title={t('common.saveLater')} onPress={later} />
          </>
        }
      >
        {header}
        <View>
          <Txt variant="h2" color={c.green}>
            {t('ui.p1Title')}
          </Txt>
          <Txt variant="small" color={c.title}>
            {t('ui.p1Sub')}
          </Txt>
        </View>
        <Group title={t('ui.aboutYou')}>
          <Select label={t('ui.ageGroup')} value={v.ageGroup} onChange={set('ageGroup')} options={opts('ages', ['a18', 'a25', 'a35', 'a45', 'a55', 'preferNot'])} compact />
          <View style={{ gap: 6 }}>
            <Txt color={c.body} style={{ fontSize: 14 }}>
              {t('ui.area')}
            </Txt>
            <FieldBox value={v.area ?? ''} onChangeText={set('area')} placeholder={t('ui.areaPh')} />
          </View>
        </Group>
        <Group title={t('ui.journey')}>
          <Select label={t('ui.rehab')} value={v.rehab} onChange={set('rehab')} options={yn} placeholder={t('ui.ynPh')} compact />
          <Select label={t('ui.aftercareNow')} value={v.aftercareNow} onChange={set('aftercareNow')} options={yn} placeholder={t('ui.ynPh')} compact />
          <Select label={t('ui.supportPlan')} value={v.supportPlan} onChange={set('supportPlan')} options={yn} placeholder={t('ui.ynPh')} compact />
        </Group>
        <Group title={t('ui.goalHeading')}>
          <Select label={t('ui.mattersMost')} value={v.mattersMost} onChange={set('mattersMost')} options={opts('matters', ['routines', 'clean', 'family', 'work', 'health', 'peace'])} compact multi />
        </Group>
      </Page>
    );

  if (page === 2)
    return (
      <Page
        top={<TopBar />}
        footer={
          <>
            <Pill title={t('common.continue')} onPress={() => { saveDetails(); router.push('/onboarding/baseline?page=3'); }} />
            <TextLink title={t('common.saveLater')} onPress={later} />
          </>
        }
      >
        {header}
        <View>
          <Txt variant="h2" color={c.green}>
            {t('ui.p2Title')}
          </Txt>
          <Txt variant="small" color={c.title}>
            {t('ui.p2Sub')}
          </Txt>
        </View>
        <Group title={t('ui.sleepRest')}>
          <Select label={t('ui.usualSleep')} value={v.usualSleep} onChange={set('usualSleep')} options={opts('sleepOpts', ['s1', 's2', 's3', 's4', 's5'])} compact />
          <Select label={t('ui.sleepQuality')} value={v.sleepQuality} onChange={set('sleepQuality')} options={opts('qualityOpts', ['poor', 'fair', 'good', 'vgood'])} compact />
        </Group>
        <Group title={t('ui.nutrition')}>
          <Select label={t('ui.mealsDay')} value={v.mealsDay} onChange={set('mealsDay')} options={opts('mealOpts', ['m1', 'm2', 'm3', 'm4'])} compact />
          <Select label={t('ui.waterDay')} value={v.waterDay} onChange={set('waterDay')} options={opts('waterOpts', ['w1', 'w2', 'w3', 'w4'])} compact />
          <Select label={t('ui.foodAccess')} value={v.foodAccess} onChange={set('foodAccess')} options={yn} placeholder={t('ui.ynPh')} compact />
        </Group>
        <Group title={t('ui.physical')}>
          <Select label={t('ui.activityWeek')} value={v.activityWeek} onChange={set('activityWeek')} options={opts('actOpts', ['none', 'light', 'moderate', 'active'])} compact />
        </Group>
        <Group title={t('ui.overall')}>
          <Select label={t('ui.usuallyFeel')} value={v.usuallyFeel} onChange={set('usuallyFeel')} options={opts('feelOpts', ['bad', 'low', 'okay', 'good', 'vgood'])} compact />
        </Group>
      </Page>
    );

  const cravingLabels = [t('baseline.craving.none'), t('baseline.craving.moderate'), t('baseline.craving.strong')];
  return (
    <Page
      top={<TopBar />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={finishAll} />
          <TextLink title={t('common.saveLater')} onPress={later} />
        </>
      }
    >
      <Brand wordmark={false} size={80} />
      <Heading small title={t('ui.baseTitle')} subtitle={t('ui.p3Sub')} />
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('baseline.feeling')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.selectOne')}
        </Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
          {MOODS.map((m, i) => {
            const sel = feeling === i;
            const label = t(`baseline.moods.${m.key}`);
            return (
              <Pressable
                key={m.key}
                onPress={() => setFeeling(i)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={label}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 14, backgroundColor: sel ? c.selected : 'transparent', borderWidth: sel ? 1 : 0, borderColor: c.navy }}
              >
                <Txt style={{ fontSize: 36, lineHeight: 44, opacity: feeling === undefined || sel ? 1 : 0.55 }}>{m.emoji}</Txt>
                <Txt variant="small" color={sel ? c.title : c.body} bold={sel} numberOfLines={1}>
                  {label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.haltTitle')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.haltSub')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14 }}>
          {['hunger', 'anger', 'loneliness', 'tiredness'].map((k) => (
            <View key={k} style={{ minWidth: '45%' }}>
              <SquareCheck label={t(`baseline.haltItems.${k}`)} checked={halt.includes(k)} onPress={() => setHalt(halt.includes(k) ? halt.filter((x) => x !== k) : [...halt, k])} />
            </View>
          ))}
        </View>
      </Card>
      <Card cream>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.cravTitle')}
        </Txt>
        <Txt variant="small" color={c.body}>
          {t('ui.cravSub')}
        </Txt>
        <Slider
          minimumValue={0}
          maximumValue={2}
          step={1}
          value={craving}
          onValueChange={(x) => setCraving(Math.round(x))}
          minimumTrackTintColor={c.navy}
          maximumTrackTintColor="#D5DCE2"
          thumbTintColor={c.navy}
          accessibilityLabel={t('ui.cravTitle')}
          accessibilityValue={{ text: cravingLabels[craving] }}
          style={{ height: 40 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {cravingLabels.map((l, i) => (
            <Txt key={l} variant="small" bold={craving === i} color={c.title}>
              {l}
            </Txt>
          ))}
        </View>
      </Card>
      <Card>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.personalTriggers')}
        </Txt>
        <FieldBox label={t('ui.pps')} value={v.pps ?? ''} onChangeText={set('pps')} placeholder={t('ui.ppsPh')} />
        <FieldBox label={t('ui.earlySigns')} value={v.earlySigns ?? ''} onChangeText={set('earlySigns')} placeholder={t('ui.earlyPh')} />
      </Card>
      <Card cream>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.anythingElse')} <Txt color={c.body}>{t('ui.optionalTag')}</Txt>
        </Txt>
        <FieldBox value={v.anything ?? ''} onChangeText={set('anything')} placeholder={t('ui.anythingPh')} multiline />
      </Card>
    </Page>
  );
}
