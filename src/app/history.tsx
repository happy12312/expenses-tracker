import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EditExpenseModal from '@/components/EditExpenseModal';
import ExpenseListRow from '@/components/ExpenseListRow';
import { Colors, Spacing } from '@/constants/theme';
import { getDb } from '@/db';
import {
  CategoryRow,
  PayerRow,
  deleteExpense,
  listAllExpenses,
  listCategories,
  listPayers,
  updateExpense,
} from '@/db/queries';
import { ExpenseRow, filterByPayer } from '@/logic/aggregate';
import { formatDayLabel } from '@/logic/format';

const IOS_TAB_BAR_HEIGHT = 49;

interface Section {
  title: string;
  data: ExpenseRow[];
}

function groupByDay(expenses: ExpenseRow[]): Section[] {
  const sections: Section[] = [];
  for (const e of expenses) {
    const label = formatDayLabel(e.created_at);
    const last = sections[sections.length - 1];
    if (last && last.title === label) {
      last.data.push(e);
    } else {
      sections.push({ title: label, data: [e] });
    }
  }
  return sections;
}

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [payers, setPayers] = useState<PayerRow[]>([]);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [payerFilter, setPayerFilter] = useState<number | null>(null);

  const load = useCallback(async () => {
    const db = await getDb();
    const [exp, cats, pays] = await Promise.all([
      listAllExpenses(db),
      listCategories(db, true),
      listPayers(db, true),
    ]);
    setExpenses(exp);
    setCategories(cats);
    setPayers(pays);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? '?';
  const payerName = (id: number) => payers.find((p) => p.id === id)?.name ?? '?';

  const handleDelete = useCallback(
    async (id: number) => {
      const db = await getDb();
      await deleteExpense(db, id);
      await load();
    },
    [load]
  );

  const handleSaveEdit = useCallback(
    async (params: { amount: number; categoryId: number; payerId: number; note: string; createdAt: Date }) => {
      if (!editing) return;
      const db = await getDb();
      await updateExpense(db, editing.id, params);
      setEditing(null);
      await load();
    },
    [editing, load]
  );

  const filteredExpenses = filterByPayer(expenses, payerFilter);
  const sections = groupByDay(filteredExpenses);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.heading, { color: colors.text }]}>История</Text>

      <View style={styles.payerFilterRow}>
        <Pressable
          onPress={() => setPayerFilter(null)}
          style={[
            styles.pill,
            { backgroundColor: payerFilter === null ? colors.accent : colors.backgroundElement },
          ]}>
          <Text style={{ color: payerFilter === null ? '#fff' : colors.text, fontWeight: '600' }}>
            Все
          </Text>
        </Pressable>
        {payers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPayerFilter(p.id)}
            style={[
              styles.pill,
              { backgroundColor: payerFilter === p.id ? colors.accent : colors.backgroundElement },
            ]}>
            <Text style={{ color: payerFilter === p.id ? '#fff' : colors.text, fontWeight: '600' }}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + IOS_TAB_BAR_HEIGHT }}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                style={[styles.deleteAction, { backgroundColor: colors.danger }]}
                onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Удалить</Text>
              </Pressable>
            )}>
            <Pressable style={{ backgroundColor: colors.background }} onPress={() => setEditing(item)}>
              <ExpenseListRow
                categoryName={categoryName(item.category_id)}
                payerName={payerName(item.payer_id)}
                note={item.note}
                amount={item.amount}
                createdAt={item.created_at}
              />
            </Pressable>
          </Swipeable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Трат пока нет</Text>
        }
      />

      <EditExpenseModal
        expense={editing}
        categories={categories}
        payers={payers}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        onDelete={async () => {
          if (editing) await handleDelete(editing.id);
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  payerFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    width: 100,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
