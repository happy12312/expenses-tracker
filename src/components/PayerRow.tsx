import { Pressable, ScrollView, StyleSheet, Text, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { PayerRow as PayerRecord } from '@/db/queries';

export default function PayerRow({
  payers,
  selectedId,
  onSelect,
}: {
  payers: PayerRecord[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {payers.map((p) => {
        const selected = p.id === selectedId;
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[
              styles.pill,
              {
                backgroundColor: selected ? colors.accent : colors.backgroundElement,
              },
            ]}>
            <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '600' }}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
  },
});
