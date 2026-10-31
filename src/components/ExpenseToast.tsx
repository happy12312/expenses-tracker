import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function ExpenseToast({
  text,
  onUndo,
  bottomOffset,
}: {
  text: string;
  onUndo: () => void;
  bottomOffset: number;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.toast,
        { backgroundColor: scheme === 'dark' ? '#2E3135' : '#1C1C1E', bottom: bottomOffset },
      ]}>
      <Text style={styles.text}>{text}</Text>
      <Pressable onPress={onUndo} hitSlop={8}>
        <Text style={[styles.undo, { color: colors.accent }]}>Отменить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  undo: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: Spacing.three,
  },
});
