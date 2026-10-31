import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatTenge, formatTime } from '@/logic/format';

export default function ExpenseListRow({
  categoryName,
  payerName,
  note,
  amount,
  createdAt,
}: {
  categoryName: string;
  payerName: string;
  note?: string | null;
  amount: number;
  createdAt: string;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }]}>{categoryName}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatTime(createdAt)} · {payerName}
          {note ? ` · ${note}` : ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: colors.text }]}>−{formatTenge(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  left: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
