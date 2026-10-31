import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ExpenseListRow from '@/components/ExpenseListRow';
import { Colors, Spacing } from '@/constants/theme';
import { getDb } from '@/db';
import { CategoryRow, PayerRow, listCategories, listExpensesInRange, listPayers } from '@/db/queries';
import {
  CategoryBreakdownItem,
  ExpenseRow,
  aggregateByBucket,
  aggregateByCategory,
  aggregateByPayer,
  filterByPayer,
  sumTotal,
} from '@/logic/aggregate';
import { formatPercent, formatTenge } from '@/logic/format';
import { PeriodKind, formatPeriodLabel, getBucketStarts, getPeriodRange, toLocalIso } from '@/logic/period';

const IOS_TAB_BAR_HEIGHT = 49;
const PERIOD_KINDS: { key: PeriodKind; label: string }[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' },
];

function isoBound(d: Date): string {
  return toLocalIso(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
}

export default function SummaryScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [kind, setKind] = useState<PeriodKind>('week');
  const [offset, setOffset] = useState(0);
  const [payerFilter, setPayerFilter] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [payers, setPayers] = useState<PayerRow[]>([]);
  const [drillCategory, setDrillCategory] = useState<CategoryBreakdownItem | null>(null);

  const range = useMemo(() => getPeriodRange(kind, new Date(), offset), [kind, offset]);

  const load = useCallback(async () => {
    const db = await getDb();
    const [exp, cats, pays] = await Promise.all([
      listExpensesInRange(db, isoBound(range.start), isoBound(range.end)),
      listCategories(db, true),
      listPayers(db, true),
    ]);
    setExpenses(exp);
    setCategories(cats);
    setPayers(pays);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => filterByPayer(expenses, payerFilter), [expenses, payerFilter]);
  const total = useMemo(() => sumTotal(filtered), [filtered]);
  const byCategory = useMemo(() => aggregateByCategory(filtered, categories), [filtered, categories]);
  const byPayer = useMemo(() => aggregateByPayer(filtered, payers), [filtered, payers]);

  const bucketKind = kind === 'year' ? 'month' : 'day';
  const bucketStarts = useMemo(() => getBucketStarts(kind, range), [kind, range]);
  const bucketSums = useMemo(
    () => aggregateByBucket(filtered, bucketStarts, bucketKind),
    [filtered, bucketStarts, bucketKind]
  );
  const maxBucket = Math.max(1, ...bucketSums);

  const drillExpenses = useMemo(() => {
    if (!drillCategory) return [];
    return filtered.filter((e) => e.category_id === drillCategory.categoryId);
  }, [filtered, drillCategory]);

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? '?';
  const payerName = (id: number) => payers.find((p) => p.id === id)?.name ?? '?';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Сводки</Text>

      <View style={styles.segmentRow}>
        {PERIOD_KINDS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => {
              setKind(p.key);
              setOffset(0);
            }}
            style={[
              styles.segment,
              { backgroundColor: kind === p.key ? colors.accent : colors.backgroundElement },
            ]}>
            <Text style={{ color: kind === p.key ? '#fff' : colors.text, fontWeight: '600' }}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.periodNav}>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={8}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.periodLabel, { color: colors.text }]}>
          {formatPeriodLabel(kind, range)}
        </Text>
        <Pressable onPress={() => setOffset((o) => o + 1)} hitSlop={8}>
          <Text style={[styles.navArrow, { color: colors.accent }]}>›</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + IOS_TAB_BAR_HEIGHT + Spacing.four }}>
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

        <Text style={[styles.total, { color: colors.text }]}>{formatTenge(total)}</Text>
        {payerFilter === null && byPayer.length > 1 && (
          <Text style={[styles.payerSplit, { color: colors.textSecondary }]}>
            {byPayer.map((p) => `${p.name}: ${formatTenge(p.total)}`).join('  ·  ')}
          </Text>
        )}

        <View style={styles.chart}>
          {bucketSums.map((sum, i) => (
            <View key={i} style={styles.chartBarWrap}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: Math.max(2, (sum / maxBucket) * 80),
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.categoryList}>
          {byCategory.length === 0 && (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.four }}>
              Трат за этот период нет
            </Text>
          )}
          {byCategory.map((c) => (
            <Pressable key={c.categoryId} onPress={() => setDrillCategory(c)} style={styles.categoryRow}>
              <View style={styles.categoryRowTop}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>{formatTenge(c.total)}</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.backgroundElement }]}>
                <View
                  style={[styles.barFill, { width: `${c.percent}%`, backgroundColor: colors.accent }]}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {formatPercent(c.total, total)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.listHeading, { color: colors.text }]}>Все траты за период</Text>
        <View style={styles.fullList}>
          {filtered.map((e) => (
            <ExpenseListRow
              key={e.id}
              categoryName={categoryName(e.category_id)}
              payerName={payerName(e.payer_id)}
              note={e.note}
              amount={e.amount}
              createdAt={e.created_at}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!drillCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setDrillCategory(null)}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + Spacing.three },
            ]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{drillCategory?.name}</Text>
              <Pressable onPress={() => setDrillCategory(null)}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>Готово</Text>
              </Pressable>
            </View>
            <ScrollView>
              {drillExpenses.map((e) => (
                <ExpenseListRow
                  key={e.id}
                  categoryName={categoryName(e.category_id)}
                  payerName={payerName(e.payer_id)}
                  note={e.note}
                  amount={e.amount}
                  createdAt={e.created_at}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  navArrow: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 160,
    textAlign: 'center',
  },
  payerFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 16,
  },
  total: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: Spacing.four,
  },
  payerSplit: {
    textAlign: 'center',
    fontSize: 13,
    paddingTop: Spacing.one,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 90,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: 10,
    borderRadius: 4,
  },
  categoryList: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.two,
  },
  fullList: {
    paddingBottom: Spacing.three,
  },
  categoryRow: {
    gap: 4,
  },
  categoryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
