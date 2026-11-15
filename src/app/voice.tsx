// Record a voice note for the journal. Saved only on this phone.
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useApp } from '../lib/useApp';
import { uid } from '../lib/store';
import { Txt, announce } from '../components/ui';
import { Page, Pill, TopBar, useDS, DS } from '../components/ds';
import { MOODS } from '../components/MoodRow';
import { VoicePlayer, mmss } from '../components/Voice';

/** Copies the recording out of the temporary folder so it is kept. */
function keep(tempUri: string): string {
  try {
    const dir = new Directory(Paths.document, 'voice-notes');
    if (!dir.exists) dir.create({ intermediates: true });
    const src = new File(tempUri);
    const ext = tempUri.split('.').pop() || 'm4a';
    const dest = new File(dir, `${uid()}.${ext}`);
    src.copy(dest);
    return dest.uri;
  } catch {
    return tempUri; // web preview, or the copy failed: keep the original location
  }
}

export default function Voice() {
  const { t, state, update } = useApp();
  const c = useDS();
  const q = useLocalSearchParams<{ id?: string }>();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rs = useAudioRecorderState(recorder, 250);
  const [uri, setUri] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [mood, setMood] = useState<number | undefined>();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) recorder.stop().catch(() => {});
    };
  }, []);

  const start = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setDenied(true);
      return Alert.alert(t('voice.title'), t('voice.denied'));
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    setUri(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
    announce(t('voice.recording'));
  };

  const stop = async () => {
    const len = rs.durationMillis / 1000;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (recorder.uri) {
      setUri(recorder.uri);
      setSecs(len);
      announce(t('voice.stopped'));
    }
  };

  const save = () => {
    if (!uri) return router.back();
    const saved = keep(uri);
    update((s) => ({
      ...s,
      journal: q.id
        ? s.journal.map((j) => (j.id === q.id ? { ...j, audio: saved, audioSecs: secs, mood: j.mood ?? mood } : j))
        : [...s.journal, { id: uid(), at: new Date().toISOString(), mood, text: '', audio: saved, audioSecs: secs }],
    }));
    announce(t('common.saved'));
    router.back();
  };

  const recording = rs.isRecording;
  return (
    <Page plain top={<TopBar close title={t('voice.title')} subtitle={t('voice.sub')} />} footer={<Pill title={t('common.save')} variant="green" disabled={!uri || recording} onPress={save} />}>
      <View style={{ alignItems: 'center', gap: 14, marginTop: 20 }}>
        <Pressable
          onPress={recording ? stop : start}
          accessibilityRole="button"
          accessibilityLabel={recording ? t('voice.stop') : uri ? t('voice.again') : t('voice.start')}
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: recording ? DS.helpRed : c.navy,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: recording ? DS.helpRed : '#16295F',
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Ionicons name={recording ? 'stop' : 'mic'} size={56} color="#FFFFFF" />
        </Pressable>
        <Txt bold color={c.title} style={{ fontSize: 30 }} accessibilityLiveRegion="polite">
          {mmss(recording ? rs.durationMillis / 1000 : secs)}
        </Txt>
        <Txt center color={c.body}>
          {recording ? t('voice.recordingHint') : uri ? t('voice.listenBack') : t('voice.tapToStart')}
        </Txt>
      </View>
      {uri && !recording ? <VoicePlayer uri={uri} secs={secs} /> : null}
      {!q.id ? (
        <View style={{ gap: 8 }}>
          <Txt bold color={c.title}>{t('voice.moodQ')}</Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 14, padding: 8 }} accessibilityRole="radiogroup">
            {MOODS.map((m, i) => (
              <Pressable key={m.key} onPress={() => setMood(mood === i ? undefined : i)} accessibilityRole="radio" accessibilityState={{ selected: mood === i }} accessibilityLabel={t(`baseline.moods.${m.key}`)} style={{ flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 4, backgroundColor: mood === i ? c.selected : 'transparent' }}>
                <Txt style={{ fontSize: 30, lineHeight: 38 }}>{m.emoji}</Txt>
                <Txt variant="small" color={c.body} numberOfLines={1}>{t(`baseline.moods.${m.key}`)}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <Txt variant="small" center color={c.body}>{denied ? t('voice.denied') : t('voice.private')}</Txt>
    </Page>
  );
}
