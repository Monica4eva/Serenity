import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../lib/useApp';
import { Txt } from '../../components/ui';
import { Brand, Heading, Page, Pill, RowCard, SectionLabel, TextLink, TopBar, useDS } from '../../components/ds';
import { ContactRow, ROLES } from '../../components/ContactList';

export default function Network() {
  const { t, state } = useApp();
  const c = useDS();
  return (
    <Page
      top={<TopBar />}
      footer={
        <>
          <Pill title={t('common.continue')} onPress={() => router.back()} />
          <TextLink title={t('common.saveLater')} onPress={() => router.back()} />
        </>
      }
    >
      <Brand wordmark={false} size={90} />
      <Heading small title={t('network.title')} subtitle={t('ui.netSub')} />
      <SectionLabel>{t('ui.addHeading')}</SectionLabel>
      <View style={{ gap: 10 }}>
        {ROLES.map((r) => (
          <RowCard key={r} cream title={t(`network.${r}`)} subtitle={t(`ui.roleDesc.${r}`)} onPress={() => router.push({ pathname: '/onboarding/contact', params: { role: r } })} />
        ))}
      </View>
      <Pressable
        onPress={() => router.push('/onboarding/contact')}
        accessibilityRole="button"
        accessibilityLabel={`${t('ui.addCard')}. ${t('ui.addCardSub')}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: c.addCard, borderRadius: 16, borderWidth: 1, borderColor: c.navy, padding: 22, marginTop: 14 }}
      >
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.navy, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt bold color={c.title} style={{ fontSize: 18 }}>
            {t('ui.addCard')}
          </Txt>
          <Txt variant="small" color={c.body}>
            {t('ui.addCardSub')}
          </Txt>
        </View>
      </Pressable>
      {state.contacts.length ? <SectionLabel>{t('ui.yourContacts')}</SectionLabel> : null}
      {state.contacts.map((ct) => (
        <ContactRow key={ct.id} c={ct} />
      ))}
    </Page>
  );
}
