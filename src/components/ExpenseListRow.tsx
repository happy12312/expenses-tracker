import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { formatShortDateTime, formatTenge } from '@/logic/format';

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
        <View style={styles.topLine}>
          <Text style={[styles.title, { color: colors.text }]}>{categoryName}</Text>
          <Text style={[styles.amount, { color: colors.text }]}>−{formatTenge(amount)}</Text>
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatShortDateTime(createdAt)} · {payerName}
        </Text>
        {note ? (
          <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={2}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  left: {
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
  },
  note: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
