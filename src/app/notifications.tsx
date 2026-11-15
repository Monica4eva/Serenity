import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../lib/useApp';
import { notificationsFor } from '../lib/notify';
import { Txt } from '../components/ui';
import { Page, RowCard, TopBar, useDS } from '../components/ds';

export default function Notifications() {
  const { t, state } = useApp();
  const c = useDS();
  const list = notificationsFor(state, t);
  return (
    <Page top={<TopBar close title={t('ui.notifTitle')} />}>
      {list.length ? (
        <View style={{ gap: 12 }}>
          {list.map((n) => (
            <RowCard key={n.id} icon={{ name: n.icon }} tint="blue" title={n.text} onPress={() => router.push(n.route as any)} />
          ))}
        </View>
      ) : (
        <Txt center color={c.body} style={{ marginTop: 40 }}>{t('ui.notifEmpty')}</Txt>
      )}
    </Page>
  );
}
