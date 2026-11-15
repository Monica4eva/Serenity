// Voice notes: record, play back. Recordings stay on this phone (never uploaded).
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useApp } from '../lib/useApp';
import { Txt } from './ui';
import { useDS } from './ds';

export const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

/** Small play / pause bar for a saved voice note. */
export function VoicePlayer({ uri, secs }: { uri: string; secs?: number }) {
  const { t } = useApp();
  const c = useDS();
  const player = useAudioPlayer(uri);
  const st = useAudioPlayerStatus(player);
  useEffect(() => {
    if (st.didJustFinish) player.seekTo(0);
  }, [st.didJustFinish]);
  const total = st.duration || secs || 0;
  const pos = st.currentTime || 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.d ? '#22304A' : '#FFFFFF', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 }}>
      <Pressable
        onPress={() => (st.playing ? player.pause() : player.play())}
        accessibilityRole="button"
        accessibilityLabel={st.playing ? t('voice.pause') : t('voice.play')}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={st.playing ? 'pause' : 'play'} size={18} color={c.onNavy} />
      </Pressable>
      <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.d ? '#3A4A6A' : '#D5DCE2' }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: c.navy, width: total ? `${Math.min(100, (pos / total) * 100)}%` : '0%' }} />
      </View>
      <Txt variant="small" color={c.body} style={{ minWidth: 40, textAlign: 'right', paddingRight: 8 }}>
        {mmss(st.playing ? pos : total)}
      </Txt>
    </View>
  );
}
