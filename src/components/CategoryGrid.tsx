import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { CategoryRow } from '@/db/queries';

export default function CategoryGrid({
  categories,
  onPick,
}: {
  categories: CategoryRow[];
  onPick: (category: CategoryRow) => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.grid}>
      {categories.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onPick(c)}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: pressed ? colors.backgroundSelected : colors.backgroundElement,
            },
          ]}>
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {c.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
