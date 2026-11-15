import React from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/useApp';
import type { Contact } from '../lib/store';
import { Button, Card, IconButton, Txt } from './ui';

export const ROLES = ['family', 'sponsor', 'counsellor', 'healthcare', 'other'] as const;
export const roleLabel = (t: (k: string) => string, r: string) => t(`network.${r}`);

export const needsReconfirm = (c: Contact) =>
  c.isEmergency && (!c.lastReconfirmed || Date.now() - new Date(c.lastReconfirmed).getTime() > 90 * 86400000);

export function ContactRow({ c, actions }: { c: Contact; actions?: boolean }) {
  const { t, theme, state } = useApp();
  const name = state.profile.preferredName || 'me';
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary} />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">{c.name}</Txt>
          <Txt variant="small">{roleLabel(t, c.role)}</Txt>
          {c.isEmergency ? (
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
              <Txt variant="small" bold color={theme.colors.success}>
                {t('network.emergencyBadge')}
              </Txt>
            </View>
          ) : null}
        </View>
        {actions ? (
          <>
            <IconButton icon="call" label={`${t('common.call')} ${c.name}`} color={theme.colors.success} onPress={() => Linking.openURL(`tel:${c.phone}`)} />
            <IconButton
              icon="chatbubble-ellipses"
              label={`${t('common.message')} ${c.name}`}
              color={theme.colors.primary}
              onPress={() => Linking.openURL(`sms:${c.phone}?body=${encodeURIComponent(t('support.needTalkMsg', { contact: c.name, name }))}`)}
            />
          </>
        ) : null}
        <IconButton icon="create-outline" label={`${t('common.edit')} ${c.name}`} onPress={() => router.push({ pathname: '/onboarding/contact', params: { id: c.id } })} />
      </View>
      {needsReconfirm(c) ? (
        <View style={{ gap: 6 }}>
          <Txt variant="small" color={theme.colors.warnText}>
            {t('network.reconfirm', { name: c.name })}
          </Txt>
          <Button variant="secondary" title={t('network.reconfirmBtn')} onPress={() => router.push({ pathname: '/onboarding/contact', params: { id: c.id } })} />
        </View>
      ) : null}
    </Card>
  );
}
