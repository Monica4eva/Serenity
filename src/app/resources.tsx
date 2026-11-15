// Resources hub: online recovery meetings (AA, NA, SMART...), Botswana services, helplines.
import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import { RESOURCES } from '../lib/resources';
import { Txt } from '../components/ui';
import { Card, Page, SectionLabel, TopBar, useDS, DS } from '../components/ds';

export default function Resources() {
  const { t, state } = useApp();
  const c = useDS();
  const tn = state.language === 'tn';
  return (
    <Page top={<TopBar close title={t('res.title')} subtitle={t('res.sub')} />}>
      <Pressable onPress={() => Linking.openURL('tel:997')} accessibilityRole="button" style={{ backgroundColor: DS.helpRed, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name="call" size={20} color="#FFFFFF" />
        <Txt bold color="#FFFFFF" style={{ flex: 1 }}>{t('res.emergency')}</Txt>
      </Pressable>
      {RESOURCES.map((g) => (
        <View key={g.id} style={{ gap: 10 }}>
          <SectionLabel>{t(`res.groups.${g.id}`)}</SectionLabel>
          {g.items.map((r) => (
            <Card key={r.id} style={{ gap: 8 }}>
              <Txt bold color={c.title} style={{ fontSize: 16 }}>{r.name}</Txt>
              <Txt color={c.body} style={{ fontSize: 14 }}>{tn ? r.tn : r.en}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {r.url ? (
                  <Pressable onPress={() => Linking.openURL(r.url!)} accessibilityRole="link" accessibilityLabel={`${t('res.open')}: ${r.name}`} style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.navy, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="open-outline" size={16} color={c.onNavy} />
                    <Txt bold color={c.onNavy} style={{ fontSize: 13 }}>{t('res.open')}</Txt>
                  </Pressable>
                ) : null}
                {(r.phones ?? []).map((p) => (
                  <Pressable key={p} onPress={() => Linking.openURL(`tel:${p.replace(/\s/g, '')}`)} accessibilityRole="button" accessibilityLabel={`${t('common.call')} ${r.name} ${p}`} style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: c.green, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="call-outline" size={16} color={c.green} />
                    <Txt bold color={c.green} style={{ fontSize: 13 }}>{p}</Txt>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
        </View>
      ))}
      <Txt variant="small" color={c.body}>{t('res.note')}</Txt>
    </Page>
  );
}
