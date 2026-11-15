import React from 'react';
import { useApp } from '../lib/useApp';
import { Txt } from '../components/ui';
import { Card, Page, RowCard, TopBar, useDS } from '../components/ds';

export default function Devices() {
  const { t } = useApp();
  const c = useDS();
  return (
    <Page top={<TopBar close title={t('ui.devices')} />}>
      <RowCard icon={{ name: 'phone-portrait-outline' }} title={t('ui.thisPhone')} subtitle={t('ui.thisPhoneSub')} done onPress={() => {}} />
      <Card cream>
        <Txt color={c.title}>{t('ui.devicesBody')}</Txt>
      </Card>
    </Page>
  );
}
