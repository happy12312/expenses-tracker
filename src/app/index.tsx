import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryGrid from '@/components/CategoryGrid';
import ExpenseToast from '@/components/ExpenseToast';
import PayerRow from '@/components/PayerRow';
import { Colors, Spacing } from '@/constants/theme';
import { getDb } from '@/db';
import {
  CategoryRow,
  PayerRow as PayerRecord,
  addExpense,
  decrementCategoryUse,
  deleteExpense,
  listCategoriesByUsage,
  listPayers,
} from '@/db/queries';
import { formatTenge } from '@/logic/format';

const IOS_TAB_BAR_HEIGHT = 49; // стандартная высота нативного таб-бара iOS, сверх safe-area инсета
const MAX_DIGITS = 9;
const TOAST_MS = 4000;

export default function InputScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const amountInputRef = useRef<TextInput>(null);

  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [payers, setPayers] = useState<PayerRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [toast, setToast] = useState<{ text: string; expenseId: number; categoryId: number } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshLookups = useCallback(async () => {
    const db = await getDb();
    const [cats, pays] = await Promise.all([listCategoriesByUsage(db), listPayers(db)]);
    setCategories(cats);
    setPayers(pays);
    return { cats, pays };
  }, []);

  useEffect(() => {
    (async () => {
      const { pays } = await refreshLookups();
      if (pays.length > 0) setPayerId(pays[0].id);
      setReady(true);
    })();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [refreshLookups]);

  const resetForNextEntry = useCallback((defaultPayerId: number | null) => {
    setAmount('');
    setNote('');
    setNoteExpanded(false);
    setPayerId(defaultPayerId);
    amountInputRef.current?.focus();
  }, []);

  const handleAmountChange = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, MAX_DIGITS);
    setAmount(digitsOnly);
  }, []);

  const handlePick = useCallback(
    async (category: CategoryRow) => {
      const value = Number(amount);
      if (!amount || value <= 0 || payerId === null) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      const db = await getDb();
      const expenseId = await addExpense(db, {
        amount: value,
        categoryId: category.id,
        payerId,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const payerName = payers.find((p) => p.id === payerId)?.name ?? '';
      setToast({
        text: `−${formatTenge(value)} · ${category.name} · ${payerName}`,
        expenseId,
        categoryId: category.id,
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);

      const defaultPayerId = payers.length > 0 ? payers[0].id : null;
      resetForNextEntry(defaultPayerId);
      await refreshLookups();
    },
    [amount, payerId, payers, refreshLookups, resetForNextEntry]
  );

  const handleUndo = useCallback(async () => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    const db = await getDb();
    await deleteExpense(db, toast.expenseId);
    await decrementCategoryUse(db, toast.categoryId);
    setToast(null);
    await refreshLookups();
  }, [toast, refreshLookups]);

  if (!ready) {
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TextInput
        ref={amountInputRef}
        autoFocus
        value={amount ? formatTenge(Number(amount)) : ''}
        onChangeText={handleAmountChange}
        keyboardType="number-pad"
        placeholder="0 ₸"
        placeholderTextColor={colors.textSecondary}
        style={[styles.amount, { color: colors.text }]}
      />

      <PayerRow payers={payers} selectedId={payerId} onSelect={setPayerId} />

      {noteExpanded ? (
        <TextInput
          autoFocus
          value={note}
          onChangeText={setNote}
          placeholder="Комментарий"
          placeholderTextColor={colors.textSecondary}
          style={[styles.noteInput, { color: colors.text, borderColor: colors.backgroundElement }]}
          onBlur={() => {
            if (!note) setNoteExpanded(false);
          }}
        />
      ) : (
        <Pressable onPress={() => setNoteExpanded(true)} style={styles.noteCollapsed}>
          <Text style={{ color: colors.textSecondary }}>{note || '+ Комментарий'}</Text>
        </Pressable>
      )}

      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: insets.bottom + IOS_TAB_BAR_HEIGHT + Spacing.three }}>
        <CategoryGrid categories={categories} onPick={handlePick} />
      </ScrollView>

      {toast && (
        <ExpenseToast
          text={toast.text}
          onUndo={handleUndo}
          bottomOffset={insets.bottom + IOS_TAB_BAR_HEIGHT + Spacing.two}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  noteCollapsed: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteInput: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    fontSize: 15,
  },
});
