// Crisis hub (Sections 5.7 and 8). Reachable from every screen, before login,
// while the app is locked and offline (numbers are stored on the device).
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { useLogoState } from '../lib/useLogoState';
import { Button, Card, Chip, Disclaimer, IconButton, Screen, Txt, announce } from '../components/ui';
import { BreathingCircle } from '../components/Motion';

type Mode = 'menu' | 'craving' | 'emotional' | 'emergency' | 'attention';

export default function Crisis() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { t, state, update, theme } = useApp();
  const [mode, setMode] = useState<Mode>(params.mode ?? 'menu');
  const [emotion, setEmotion] = useState<string | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [clearStep, setClearStep] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const name = state.profile.preferredName || '';
  const emergencyContacts = state.contacts.filter((c) => c.isEmergency);
  const supportPerson = state.contacts.find((c) => c.role === 'sponsor') ?? state.contacts[0];
  const logo = useLogoState();
  // Psychologist, counsellor or doctor first; emergency contacts next; then anyone.
  const professional =
    state.contacts.find((c) => c.role === 'counsellor') ??
    state.contacts.find((c) => c.role === 'healthcare') ??
    state.contacts.find((c) => c.isEmergency) ??
    supportPerson;

  useEffect(() => {
    if (mode === 'emergency') {
      // Minimum-data safety log for the restricted review queue.
      update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at: new Date().toISOString(), kind: 'emergency_opened' }] }));
      announce(t('crisis.emergencyTitle'));
    }
    if (mode === 'attention') {
      update((s) => ({ ...s, safetyEvents: [...s.safetyEvents, { at: new Date().toISOString(), kind: `logo_${logo.state}_opened` }] }));
      announce(t('attention.title'));
    }
    if (mode === 'craving') {
      update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { cravingHelp: true, craving: 2 }, at: new Date().toISOString() }] }));
    }
  }, [mode]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const startTimer = () => {
    setSecs(600);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setSecs((s) => (s === null || s <= 1 ? (clearInterval(timer.current!), 0) : s - 1)), 1000);
  };

  const call = (n: string) => Linking.openURL(`tel:${n.replace(/\s/g, '')}`);

  const shareLocation = async (c: { name: string; phone: string }) => {
    Alert.alert(t('crisis.shareLocation', { name: c.name }), t('crisis.shareConfirm', { name: c.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.yes'),
        onPress: async () => {
          const { status } = await Location.requestForegroundPermissionsAsync();
          let link = '';
          if (status === 'granted') {
            const p = await Location.getCurrentPositionAsync({});
            link = ` https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
          }
          const msg = t('contact.previewText', { contact: c.name, name }) + link;
          Linking.openURL(`sms:${c.phone}?body=${encodeURIComponent(msg)}`);
        },
      },
    ]);
  };

  const close = <IconButton icon="close" label={t('common.close')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;

  const Numbers = (
    <Card>
      <Txt variant="h3">{t('crisis.numbers')}</Txt>
      {state.emergencyNumbers.map((n) => (
        <Button key={n.id} variant={n.id === 'ambulance' || n.id === 'police' ? 'danger' : 'secondary'} icon="call" title={`${state.language === 'tn' && n.labelTn ? n.labelTn : n.label}: ${n.number}`} onPress={() => call(n.number)} />
      ))}
      {state.emergencyNumbers.some((n) => !n.verified) ? <Disclaimer text={t('crisis.unverified')} /> : null}
    </Card>
  );

  if (mode === 'emergency')
    return (
      <Screen back={false} title={t('crisis.title')} right={close}>
        <Txt variant="h2">{t('crisis.emergencyTitle')}</Txt>
        <Txt>{t('crisis.emergencyBody')}</Txt>
        {emergencyContacts.map((c) => (
          <View key={c.id} style={{ gap: 8 }}>
            <Button variant="success" icon="call" title={t('crisis.callContact', { name: c.name })} onPress={() => call(c.phone)} />
            <Button variant="secondary" icon="location" title={t('crisis.shareLocation', { name: c.name })} onPress={() => shareLocation(c)} />
          </View>
        ))}
        {Numbers}
        <Card style={{ borderWidth: 2, borderColor: theme.colors.red }}>
          <Txt variant="h3">{t('crisis.medicalTitle')}</Txt>
          <Txt>{t('crisis.medicalBody')}</Txt>
        </Card>
        <Card style={{ backgroundColor: theme.colors.selected }}>
          <Txt>{t('crisis.stayCalm')}</Txt>
          <BreathingCircle pattern={[4, 4, 6, 0]} size={140} />
        </Card>
        <Disclaimer />
      </Screen>
    );

    if (mode === 'attention') {
    const red = logo.state === 'red';
    const tone = logo.state === 'red' ? 'red' : logo.state === 'pink' ? 'pink' : 'orange';
    // "I'm alright now": two safety questions, then the button goes back to blue.
    if (clearStep > 0) {
      const q = clearStep === 1 ? t('attention.alrightQ1') : t('attention.alrightQ2');
      const safeAnswer = clearStep === 1 ? t('common.yes') : t('common.no');
      const riskAnswer = clearStep === 1 ? t('common.no') : t('common.yes');
      return (
        <Screen back={false} title={t('attention.alright')} right={close}>
          <Txt variant="h2">{q}</Txt>
          <Button
            variant="success"
            title={safeAnswer}
            onPress={() => {
              if (clearStep === 1) return setClearStep(2);
              const at = new Date().toISOString();
              update((x) => ({
                ...x,
                dismissals: [...x.dismissals, { at, context: 'logo:allclear' }],
                safetyEvents: [...x.safetyEvents, { at, kind: 'logo_all_clear' }],
              }));
              announce(t('attention.alrightDone'));
              router.back();
            }}
          />
          <Button variant="danger" title={riskAnswer} onPress={() => { setClearStep(0); setMode('emergency'); }} />
          <Txt variant="small" center color={theme.colors.body}>{t('attention.alrightNote')}</Txt>
        </Screen>
      );
    }
    const Alright = <Button variant="success" icon="checkmark-circle-outline" title={t('attention.alright')} onPress={() => setClearStep(1)} />;
    const Reasons = logo.reasons.length ? (
      <Card>
        <Txt variant="h3">{t('attention.noticed')}</Txt>
        {logo.reasons.map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
            <Ionicons name="ellipse" size={8} color={theme.colors.body} style={{ marginTop: 9 }} />
            <Txt style={{ flex: 1 }}>{t(`signals.${r}`, { n: logo.missed })}</Txt>
          </View>
        ))}
      </Card>
    ) : null;
    const ProButtons = professional ? (
      <>
        <Button variant={red ? 'danger' : 'success'} icon="call" title={t('attention.callPro', { name: professional.name })} onPress={() => call(professional.phone)} />
        <Button
          variant="secondary"
          icon="chatbubble-ellipses"
          title={t('attention.messagePro', { name: professional.name })}
          onPress={() => Linking.openURL(`sms:${professional.phone}?body=${encodeURIComponent(t('attention.proMsg', { contact: professional.name, name }))}`)}
        />
      </>
    ) : (
      <Card>
        <Txt>{t('attention.noPro')}</Txt>
        <Button variant="secondary" icon="add" title={t('attention.addPro')} onPress={() => router.push({ pathname: '/onboarding/contact', params: { role: 'counsellor' } })} />
      </Card>
    );

    if (!red)
      return (
        <Screen back={false} title={t(tone === 'pink' ? 'attention.pinkTitle' : 'attention.orangeTitle')} right={close}>
          <Txt variant="h3">{t(tone === 'pink' ? 'attention.pinkBody' : 'attention.orangeBody')}</Txt>
          {Reasons}
          <Button icon="chatbubbles-outline" title={t('companion.entry')} onPress={() => router.replace('/companion')} />
          {tone === 'pink' ? ProButtons : null}
          <Button variant="secondary" icon="clipboard-outline" title={t('attention.doCheckin')} onPress={() => router.replace('/daily')} />
          {tone === 'orange' ? ProButtons : null}
          <Button variant="secondary" icon="water-outline" title={t('urge.title')} onPress={() => router.replace('/urge')} />
          <Button variant="secondary" icon="leaf-outline" title={t('attention.calm')} onPress={() => router.replace('/activities')} />
          {Alright}
          <Button variant="ghost" title={t('crisis.notSafe')} onPress={() => setMode('emergency')} />
        </Screen>
      );

    return (
      <Screen back={false} title={t('attention.title')} right={close}>
        <Txt variant="h3">{t('attention.body')}</Txt>
        {Reasons}
        {ProButtons}
        <Button variant="ghost" title={t('crisis.notSafe')} onPress={() => setMode('emergency')} />
        {Numbers}
        {Alright}
        <Disclaimer text={t('attention.howContacted')} />
      </Screen>
    );
  }

  if (mode === 'craving') {
    const steps = t('crisis.cravingSteps') as string[];
    const why = state.profile.answers?.why;
    return (
      <Screen back={false} title={t('crisis.cravingTitle')} right={close}>
        <Txt variant="h3">{t('crisis.cravingBody')}</Txt>
        <Card>
          {steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Txt bold color={theme.colors.success}>
                {i + 1}.
              </Txt>
              <Txt style={{ flex: 1 }}>{s}</Txt>
            </View>
          ))}
        </Card>
        <BreathingCircle pattern={[4, 0, 6, 0]} size={140} />
        {why ? (
          <Card style={{ backgroundColor: theme.colors.selected }}>
            <Txt bold>{t('crisis.myWhy')}</Txt>
            <Txt>“{why}”</Txt>
          </Card>
        ) : null}
        {secs === null ? (
          <Button title={t('crisis.startTimer')} icon="timer-outline" onPress={() => router.replace('/urge')} />
        ) : (
          <Card>
            <Txt variant="h2" center accessibilityLiveRegion="polite">
              {secs > 0 ? t('crisis.timerLeft', { m: Math.floor(secs / 60), s: String(secs % 60).padStart(2, '0') }) : t('crisis.timerDone')}
            </Txt>
          </Card>
        )}
        {supportPerson ? <Button variant="success" icon="call" title={t('crisis.callContact', { name: supportPerson.name })} onPress={() => call(supportPerson.phone)} /> : null}
        <Card>
          <Txt variant="h3">{t('crisis.plan')}</Txt>
          <Txt>{t('crisis.planBody')}</Txt>
        </Card>
        <Button variant="secondary" title={t('activities.title')} onPress={() => router.push('/activities')} />
        <Button variant="ghost" title={t('crisis.notSafe')} onPress={() => setMode('emergency')} />
      </Screen>
    );
  }

  if (mode === 'emotional') {
    const dirKey: Record<string, string> = { anger: 'dirAnger', anxiety: 'dirAnxiety', shame: 'dirShame', loneliness: 'dirLoneliness', sadness: 'dirSadness', hopeless: 'dirHopeless' };
    return (
      <Screen back={false} title={t('crisis.emotionalTitle')} right={close}>
        <Txt variant="h3">{t('crisis.emotionalQ')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(dirKey).map((k) => (
            <Chip key={k} label={t(`crisis.emotions.${k}`)} selected={emotion === k} onPress={() => setEmotion(k)} />
          ))}
        </View>
        {emotion ? (
          <Card>
            <Txt variant="h3" accessibilityLiveRegion="polite">
              {t(`crisis.${dirKey[emotion]}`)}
            </Txt>
            {emotion === 'hopeless' ? (
              <>
                <Button variant="danger" title={t('balance.safetyYes')} onPress={() => { update((s) => ({ ...s, checkins: [...s.checkins, { id: uid(), type: 'daily', answers: { disclosure: true }, level: 'red', reasons: ['disclosure'], at: new Date().toISOString() }] })); setMode('emergency'); }} />
                <Button variant="secondary" title={t('balance.safetyUnsure')} onPress={() => setMode('emergency')} />
                <Button variant="ghost" title={t('balance.safetyNo')} onPress={() => setEmotion('sadness')} />
              </>
            ) : (
              <>
                <Txt>{t('crisis.grounding')}</Txt>
                {supportPerson ? <Button variant="success" icon="call" title={t('crisis.callContact', { name: supportPerson.name })} onPress={() => call(supportPerson.phone)} /> : null}
                <Button variant="secondary" title={t('activities.title')} onPress={() => router.push('/activities')} />
              </>
            )}
          </Card>
        ) : null}
        <Button variant="ghost" title={t('crisis.notSafe')} onPress={() => setMode('emergency')} />
      </Screen>
    );
  }

  const options = [
    { key: 'craving', icon: 'water-outline' as const, label: t('crisis.craving'), go: () => setMode('craving') },
    { key: 'emotional', icon: 'cloud-outline' as const, label: t('crisis.struggling'), go: () => setMode('emotional') },
    { key: 'relapse', icon: 'refresh-outline' as const, label: t('crisis.relapsed'), go: () => router.push('/relapse') },
    { key: 'unsafe', icon: 'warning-outline' as const, label: t('crisis.notSafe'), go: () => setMode('emergency'), danger: true },
  ];
  return (
    <Screen back={false} title={t('crisis.title')} right={close}>
      <Txt variant="h3">{t('crisis.subtitle')}</Txt>
      {options.map((o) => (
        <Card key={o.key} onPress={o.go} label={o.label} style={o.danger ? { borderWidth: 2, borderColor: theme.colors.red } : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Ionicons name={o.icon} size={30} color={o.danger ? theme.colors.red : theme.colors.teal} />
            <Txt variant="h3" style={{ flex: 1 }}>
              {o.label}
            </Txt>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.body} />
          </View>
        </Card>
      ))}
      {Numbers}
      <Disclaimer />
    </Screen>
  );
}
