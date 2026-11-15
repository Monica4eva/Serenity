// My Recovery Details: substance, recovery stage, start date, aftercare, other information.
import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../lib/useApp';
import { formatLong } from '../../lib/dates';
import { Txt } from '../../components/ui';
import { Brand, Card, FieldBox, Heading, Page, Pill, RadioMark, Select, TextLink, TopBar, useDS } from '../../components/ds';

const SUBSTANCES = ['alcohol', 'cannabis', 'opioids', 'stimulants', 'sedatives', 'inhalants', 'gambling', 'multiple', 'other', 'preferNot'];
const STAGES = [
  { key: 'afterTreatment', icon: 'calendar-outline' },
  { key: 'early', icon: 'bandage-outline' },
  { key: 'building', icon: 'scale-balance', mci: true },
  { key: 'longterm', icon: 'medal-outline' },
];

function CardHead({ icon, title, sub, mci }: { icon: string; title: string; sub: string; mci?: boolean }) {
  const c = useDS();
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      {mci ? <MaterialCommunityIcons name={icon as any} size={28} color={c.navy} /> : <Ionicons name={icon as any} size={28} color={c.navy} />}
      <View style={{ flex: 1 }}>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {title}
        </Txt>
        <Txt variant="small" color={c.body}>
          {sub}
        </Txt>
      </View>
    </View>
  );
}

export default function Details() {
  const { t, state, update } = useApp();
  const c = useDS();
  const d = state.details;
  const [substance, setSubstance] = useState(d.substance);
  const [stage, setStage] = useState(d.stage);
  const [start, setStart] = useState<string | undefined>(d.start ?? undefined);
  const [aftercare, setAftercare] = useState(d.aftercare);
  const [other, setOther] = useState(d.other ?? '');
  const [picking, setPicking] = useState(false);

  const save = (then: () => void) => {
    update((s) => ({
      ...s,
      details: { ...s.details, substance, stage, start, aftercare, other },
      // The start date sets the day counter on Today.
      recoveryStart: start ?? s.recoveryStart,
    }));
    then();
  };

  return (
    <Page
      top={<TopBar />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={() => save(() => router.back())} />
          <TextLink title={t('common.saveLater')} onPress={() => save(() => router.back())} />
        </>
      }
    >
      <Brand wordmark={false} size={90} />
      <Heading small title={t('ui.detTitle')} />
      <Card cream>
        <CardHead icon="pill" mci title={t('ui.substance')} sub={t('ui.substanceQ')} />
        <View style={{ paddingLeft: 42 }}>
          <Select
            label={t('ui.substance')}
            value={substance}
            onChange={setSubstance}
            placeholder={t('ui.substancePh')}
            options={SUBSTANCES.map((k) => ({ key: k, label: t(`ui.substances.${k}`) }))}
          />
        </View>
      </Card>
      <Card cream>
        <CardHead icon="bandage-outline" title={t('ui.stage')} sub={t('ui.stageQ')} />
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
          {STAGES.map((st) => {
            const sel = stage === st.key;
            return (
              <Pressable
                key={st.key}
                onPress={() => setStage(st.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${t(`ui.stages.${st.key}`)} ${t(`ui.stageHints.${st.key}`)}`}
                style={{ flex: 1, minHeight: 104, borderRadius: 12, borderWidth: 1, borderColor: sel ? c.navy : '#D5DCE2', backgroundColor: c.card, padding: 6, alignItems: 'center', gap: 4 }}
              >
                <View style={{ alignSelf: 'flex-end' }}>
                  <RadioMark selected={sel} />
                </View>
                {st.mci ? <MaterialCommunityIcons name={st.icon as any} size={20} color={c.navy} /> : <Ionicons name={st.icon as any} size={20} color={c.navy} />}
                <Txt bold center color={c.title} style={{ fontSize: 11.5, lineHeight: 14 }}>
                  {t(`ui.stages.${st.key}`)}
                </Txt>
                {t(`ui.stageHints.${st.key}`) ? (
                  <Txt center color={c.body} style={{ fontSize: 10.5, lineHeight: 13 }}>
                    {t(`ui.stageHints.${st.key}`)}
                  </Txt>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card cream>
        <CardHead icon="calendar-clear-outline" title={t('ui.timeIn')} sub={t('ui.timeInQ')} />
        <Pressable
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('ui.timeIn')}: ${start ? formatLong(new Date(start), state.language) : t('ui.selectDate')}`}
          style={{ marginLeft: 42, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#C9DCCF', backgroundColor: c.d ? c.card : '#F8FBF8', paddingHorizontal: 12 }}
        >
          <Ionicons name="calendar-outline" size={18} color={c.navy} />
          <Txt style={{ flex: 1, fontSize: 14 }} color={start ? c.title : '#6E767D'}>
            {start ? formatLong(new Date(start), state.language) : t('ui.selectDate')}
          </Txt>
          <Ionicons name="chevron-down" size={18} color={c.body} />
        </Pressable>
        {picking ? (
          <DateTimePicker
            value={start ? new Date(start) : new Date()}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, date) => {
              setPicking(Platform.OS === 'ios');
              if (e.type !== 'dismissed' && date) {
                const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8);
                setStart(day.toISOString());
              }
            }}
          />
        ) : null}
      </Card>
      <Card cream>
        <CardHead icon="people-outline" title={t('ui.aftercare')} sub={t('ui.aftercareQ')} />
        {[
          { key: 'yes', label: t('ui.aftercareYes') },
          { key: 'no', label: t('ui.aftercareNo') },
        ].map((o) => {
          const sel = aftercare === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => setAftercare(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={o.label}
              style={{ marginLeft: 42, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#D5DCE2', backgroundColor: sel ? c.selected : c.card, paddingHorizontal: 12 }}
            >
              <RadioMark selected={sel} />
              <Txt bold={sel} color={c.title} style={{ fontSize: 13.5, flex: 1 }}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </Card>
      <Card cream>
        <Txt bold color={c.title} style={{ fontSize: 17 }}>
          {t('ui.otherInfo')}
        </Txt>
        <FieldBox value={other} onChangeText={setOther} placeholder={t('ui.typeHere')} multiline />
      </Card>
    </Page>
  );
}
