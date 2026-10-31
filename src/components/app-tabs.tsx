import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ввод</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="summary">
        <NativeTabs.Trigger.Label>Сводки</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.pie" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>История</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Настройки</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
