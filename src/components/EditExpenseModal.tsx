import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryGrid from '@/components/CategoryGrid';
import PayerRow from '@/components/PayerRow';
import { Colors, Spacing } from '@/constants/theme';
import { CategoryRow, PayerRow as PayerRecord } from '@/db/queries';
import { ExpenseRow } from '@/logic/aggregate';

function parseLocalIso(iso: string): Date {
  const [datePart, timePart] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h = 0, mi = 0, s = 0] = (timePart ?? '0:0:0').split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}

export default function EditExpenseModal({
  expense,
  categories,
  payers,
  onClose,
  onSave,
  onDelete,
}: {
  expense: ExpenseRow | null;
  categories: CategoryRow[];
  payers: PayerRecord[];
  onClose: () => void;
  onSave: (params: {
    amount: number;
    categoryId: number;
    payerId: number;
    note: string;
    createdAt: Date;
  }) => void;
  onDelete: () => void;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [payerId, setPayerId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date());

  useEffect(() => {
    if (!expense) return;
    setAmount(String(expense.amount));
    setCategoryId(expense.category_id);
    setPayerId(expense.payer_id);
    setNote(expense.note ?? '');
    setCreatedAt(parseLocalIso(expense.created_at));
  }, [expense]);

  if (!expense) return null;

  const handleSave = () => {
    const value = Number(amount);
    if (!value || value <= 0 || categoryId === null || payerId === null) return;
    onSave({ amount: value, categoryId, payerId, note, createdAt });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Отмена</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Трата</Text>
            <Pressable onPress={handleSave}>
              <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>Сохранить</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />

            <PayerRow payers={payers} selectedId={payerId} onSelect={setPayerId} />

            <DateTimePicker
              value={createdAt}
              mode="datetime"
              display="compact"
              onChange={(_, date) => date && setCreatedAt(date)}
            />

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Комментарий"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.noteInput, { color: colors.text, borderColor: colors.backgroundElement }]}
            />

            <CategoryGrid
              categories={categories}
              selectedId={categoryId}
              onPick={(c) => setCategoryId(c.id)}
            />

            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Удалить трату</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  noteInput: {
    marginHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
