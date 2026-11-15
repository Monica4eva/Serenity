import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../lib/useApp';
import { addConsent, Contact, Role, uid } from '../../lib/store';
import { Txt } from '../../components/ui';
import { Brand, Card, FieldBox, Heading, Page, Pill, Select, SquareCheck, TextLink, TopBar, useDS, OptionCard } from '../../components/ds';
import { TextInput } from 'react-native';
import { ROLES } from '../../components/ContactList';

export default function ContactForm() {
  const { t, state, update, theme } = useApp();
  const c = useDS();
  const params = useLocalSearchParams<{ id?: string; role?: Role }>();
  const existing = state.contacts.find((c) => c.id === params.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState<Role | undefined>(existing?.role ?? params.role);
  const [cc, setCc] = useState('+267');
  const [phone, setPhone] = useState(existing?.phone?.replace(/^\+267\s?/, '') ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [emergency, setEmergency] = useState(existing?.isEmergency ?? false); // never pre-ticked for new contacts
  const [level, setLevel] = useState<Contact['consentLevel']>(existing?.consentLevel ?? 'support');
  const [touched, setTouched] = useState(false);
  const errs = { name: !name.trim() ? t('contact.errName') : '', role: !role ? t('contact.errRole') : '', phone: !phone.trim() ? t('contact.errPhone') : '' };

  const save = () => {
    setTouched(true);
    if (errs.name || errs.role || errs.phone) return;
    const fullPhone = phone.trim().startsWith('+') ? phone.trim() : `${cc} ${phone.trim()}`;
    const c: Contact = {
      id: existing?.id ?? uid(),
      name: name.trim(),
      role: role!,
      phone: fullPhone,
      email: email.trim() || undefined,
      isEmergency: emergency,
      consentLevel: level,
      lastReconfirmed: emergency ? new Date().toISOString() : undefined,
    };
    update((s) => {
      const contacts = existing ? s.contacts.map((x) => (x.id === c.id ? c : x)) : [...s.contacts, c];
      return addConsent({ ...s, contacts }, 'emergency', emergency, c.id);
    });
    router.back();
  };

  const remove = () =>
    Alert.alert(t('common.delete'), existing!.name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { update((s) => ({ ...s, contacts: s.contacts.filter((x) => x.id !== existing!.id) })); router.back(); } },
    ]);

  return (
    <Page top={<TopBar />} footer={<Pill title={t('ui.saveContact')} onPress={save} />}>
      <Brand wordmark={false} size={90} />
      <Heading small title={t('contact.title')} subtitle={t('ui.contactSub')} />
      <FieldBox label={t('contact.name')} required value={name} onChangeText={setName} placeholder={t('ui.namePh')} />
      {touched && errs.name ? <Txt variant="small" color={theme.colors.red}>{errs.name}</Txt> : null}
      <View style={{ gap: 6 }}>
        <Txt bold color={c.title}>
          {t('ui.roleLabel')}
          <Txt color="#B3261E"> *</Txt>
        </Txt>
        <Select hideLabel value={role} onChange={(k) => setRole(k as Role)} placeholder={t('ui.selectRole')} label={t('ui.roleLabel')} options={ROLES.map((r) => ({ key: r, label: t(`network.${r}`) }))} />
      </View>
      {touched && errs.role ? <Txt variant="small" color={theme.colors.red}>{errs.role}</Txt> : null}
      <View style={{ gap: 6 }}>
        <Txt bold color={c.title}>{t('ui.phoneNumber')}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.d ? c.border : '#E5EAEE', minHeight: 48, paddingHorizontal: 12, gap: 8 }}>
          <Txt importantForAccessibility="no">🇧🇼</Txt>
          <TextInput value={cc} onChangeText={setCc} keyboardType="phone-pad" accessibilityLabel={t('contact.code')} style={{ width: 52, fontSize: 16, color: c.title }} />
          <View style={{ width: 1, height: 24, backgroundColor: '#D5DCE2' }} />
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('ui.phonePh')} placeholderTextColor="#8E959C" accessibilityLabel={t('ui.phoneNumber')} style={{ flex: 1, fontSize: 16, color: c.title, paddingVertical: 10 }} />
        </View>
        {touched && errs.phone ? <Txt variant="small" color={theme.colors.red}>{errs.phone}</Txt> : null}
      </View>
      <FieldBox label={`${t('ui.emailLabel')} ${t('ui.optionalTag')}`} value={email} onChangeText={setEmail} placeholder={t('ui.emailPh')} keyboardType="email-address" />
      {/* Never pre-ticked: the app may only contact this person with explicit permission (build spec 5.2D). */}
      <View style={{ backgroundColor: c.addCard, borderRadius: 16, borderWidth: 1, borderColor: c.navy, padding: 16, marginTop: 10 }}>
        <SquareCheck label={`${t('ui.emergencyTitle')}. ${t('ui.emergencyBody')}`} checked={emergency} onPress={() => setEmergency(!emergency)}>
          <Txt bold color={c.title} style={{ fontSize: 18 }}>{t('ui.emergencyTitle')}</Txt>
          <Txt variant="small" color={c.title}>{t('ui.emergencyBody')}</Txt>
        </SquareCheck>
      </View>
      {emergency ? (
        <Card style={{ backgroundColor: c.selected }}>
          <Txt bold color={c.title}>{t('contact.preview')}</Txt>
          <Txt color={c.title}>{t('contact.previewText', { contact: name || '...', name: state.profile.preferredName || '...' })}</Txt>
          <Txt variant="small" color={c.body}>{t('contact.previewNote')}</Txt>
        </Card>
      ) : null}
      <Txt bold color={c.title} style={{ marginTop: 6 }}>{t('ui.sharing')}</Txt>
      <OptionCard title={t('contact.levelNone')} selected={level === 'none'} onPress={() => setLevel('none')} />
      <OptionCard title={t('contact.levelSupport')} selected={level === 'support'} onPress={() => setLevel('support')} />
      <OptionCard title={t('contact.levelAlerts')} selected={level === 'alerts'} onPress={() => setLevel('alerts')} />
      {existing ? <TextLink title={t('common.delete')} color={theme.colors.red} onPress={remove} /> : null}
    </Page>
  );
}
