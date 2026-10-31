import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, ThemeColors } from '@/constants/theme';
import { getDb } from '@/db';
import {
  CategoryRow,
  PayerRow,
  addCategory,
  addPayer,
  exportAllData,
  listCategories,
  listPayers,
  renameCategory,
  renamePayer,
  restoreAllData,
  setCategoryHidden,
  setPayerHidden,
  swapCategoryOrder,
  swapPayerOrder,
} from '@/db/queries';
import { expensesToCsv } from '@/logic/csv';

const IOS_TAB_BAR_HEIGHT = 49;

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [payers, setPayers] = useState<PayerRow[]>([]);

  const load = useCallback(async () => {
    const db = await getDb();
    const [cats, pays] = await Promise.all([listCategories(db, true), listPayers(db, true)]);
    setCategories(cats);
    setPayers(pays);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /* ---- категории ---- */
  const handleAddCategory = () => {
    Alert.prompt('Новая категория', undefined, async (name) => {
      if (!name?.trim()) return;
      const db = await getDb();
      await addCategory(db, name.trim());
      await load();
    });
  };
  const handleRenameCategory = (c: CategoryRow) => {
    Alert.prompt('Переименовать категорию', undefined, async (name) => {
      if (!name?.trim()) return;
      const db = await getDb();
      await renameCategory(db, c.id, name.trim());
      await load();
    }, 'plain-text', c.name);
  };
  const handleToggleCategoryHidden = async (c: CategoryRow) => {
    const db = await getDb();
    await setCategoryHidden(db, c.id, c.hidden === 0);
    await load();
  };
  const handleMoveCategory = async (index: number, dir: -1 | 1) => {
    const neighbor = categories[index + dir];
    if (!neighbor) return;
    const db = await getDb();
    await swapCategoryOrder(db, categories[index].id, neighbor.id);
    await load();
  };

  /* ---- "кто" ---- */
  const handleAddPayer = () => {
    Alert.prompt('Новый человек', undefined, async (name) => {
      if (!name?.trim()) return;
      const db = await getDb();
      await addPayer(db, name.trim());
      await load();
    });
  };
  const handleRenamePayer = (p: PayerRow) => {
    Alert.prompt('Переименовать', undefined, async (name) => {
      if (!name?.trim()) return;
      const db = await getDb();
      await renamePayer(db, p.id, name.trim());
      await load();
    }, 'plain-text', p.name);
  };
  const handleTogglePayerHidden = async (p: PayerRow) => {
    const db = await getDb();
    await setPayerHidden(db, p.id, p.hidden === 0);
    await load();
  };
  const handleMovePayer = async (index: number, dir: -1 | 1) => {
    const neighbor = payers[index + dir];
    if (!neighbor) return;
    const db = await getDb();
    await swapPayerOrder(db, payers[index].id, neighbor.id);
    await load();
  };

  /* ---- бэкап ---- */
  const handleExportJson = async () => {
    const db = await getDb();
    const data = await exportAllData(db);
    const uri = FileSystem.cacheDirectory + `traty-backup-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Бэкап JSON' });
    }
  };

  const handleExportCsv = async () => {
    const db = await getDb();
    const data = await exportAllData(db);
    const catName = (id: number) => data.categories.find((c) => c.id === id)?.name ?? '?';
    const payName = (id: number) => data.payers.find((p) => p.id === id)?.name ?? '?';
    const csv = expensesToCsv(data.expenses, catName, payName);
    const uri = FileSystem.cacheDirectory + `traty-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Экспорт CSV' });
    }
  };

  const handleImportJson = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets?.[0]) return;
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      Alert.alert('Не получилось', 'Файл не похож на JSON-бэкап');
      return;
    }
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.payers) || !Array.isArray(parsed.expenses)) {
      Alert.alert('Не получилось', 'Файл не похож на JSON-бэкап');
      return;
    }
    Alert.alert(
      'Восстановить из бэкапа?',
      'Это заменит все текущие категории, людей и траты содержимым файла. Отменить будет нельзя.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Заменить',
          style: 'destructive',
          onPress: async () => {
            const db = await getDb();
            await restoreAllData(db, parsed);
            await load();
            Alert.alert('Готово', 'Данные восстановлены из бэкапа');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + IOS_TAB_BAR_HEIGHT + Spacing.four }}>
      <Text style={[styles.heading, { color: colors.text }]}>Настройки</Text>

      <Section title="Категории" colors={colors}>
        {categories.map((c, i) => (
          <RefRow
            key={c.id}
            name={c.name}
            hidden={c.hidden === 1}
            canMoveUp={i > 0}
            canMoveDown={i < categories.length - 1}
            colors={colors}
            onPress={() => handleRenameCategory(c)}
            onToggleHidden={() => handleToggleCategoryHidden(c)}
            onMoveUp={() => handleMoveCategory(i, -1)}
            onMoveDown={() => handleMoveCategory(i, 1)}
          />
        ))}
        <Pressable onPress={handleAddCategory} style={styles.addRow}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>+ Добавить категорию</Text>
        </Pressable>
      </Section>

      <Section title="Кто" colors={colors}>
        {payers.map((p, i) => (
          <RefRow
            key={p.id}
            name={p.name}
            hidden={p.hidden === 1}
            canMoveUp={i > 0}
            canMoveDown={i < payers.length - 1}
            colors={colors}
            onPress={() => handleRenamePayer(p)}
            onToggleHidden={() => handleTogglePayerHidden(p)}
            onMoveUp={() => handleMovePayer(i, -1)}
            onMoveDown={() => handleMovePayer(i, 1)}
          />
        ))}
        <Pressable onPress={handleAddPayer} style={styles.addRow}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>+ Добавить человека</Text>
        </Pressable>
      </Section>

      <Section title="Резервная копия" colors={colors}>
        <Pressable onPress={handleExportJson} style={styles.actionRow}>
          <Text style={{ color: colors.text }}>Экспорт в JSON</Text>
        </Pressable>
        <Pressable onPress={handleExportCsv} style={styles.actionRow}>
          <Text style={{ color: colors.text }}>Экспорт в CSV</Text>
        </Pressable>
        <Pressable onPress={handleImportJson} style={styles.actionRow}>
          <Text style={{ color: colors.danger }}>Импорт из JSON (заменит всё)</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: colors.backgroundElement }]}>
        {children}
      </View>
    </View>
  );
}

function RefRow({
  name,
  hidden,
  canMoveUp,
  canMoveDown,
  colors,
  onPress,
  onToggleHidden,
  onMoveUp,
  onMoveDown,
}: {
  name: string;
  hidden: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  colors: ThemeColors;
  onPress: () => void;
  onToggleHidden: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <View style={styles.refRow}>
      <Pressable onPress={onMoveUp} disabled={!canMoveUp} hitSlop={6}>
        <Text style={{ color: canMoveUp ? colors.accent : colors.textSecondary, fontSize: 18 }}>
          ↑
        </Text>
      </Pressable>
      <Pressable onPress={onMoveDown} disabled={!canMoveDown} hitSlop={6}>
        <Text style={{ color: canMoveDown ? colors.accent : colors.textSecondary, fontSize: 18 }}>
          ↓
        </Text>
      </Pressable>
      <Pressable onPress={onPress} style={styles.refName}>
        <Text style={{ color: hidden ? colors.textSecondary : colors.text, fontSize: 16 }}>
          {name}
        </Text>
      </Pressable>
      <Pressable onPress={onToggleHidden}>
        <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>
          {hidden ? 'Показать' : 'Скрыть'}
        </Text>
      </Pressable>
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
  section: {
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingBottom: Spacing.one,
  },
  sectionBody: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  refName: {
    flex: 1,
  },
  addRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  actionRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
