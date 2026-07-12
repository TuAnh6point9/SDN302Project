import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { bookApi, categoryApi } from '../api';
import BookCard from '../components/BookCard';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { IBook, ICategory } from '../types/models';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'featured';

const SORTS: Array<{ label: string; value: SortValue }> = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Nổi bật', value: 'featured' },
  { label: 'Giá tăng', value: 'price_asc' },
  { label: 'Giá giảm', value: 'price_desc' },
];

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<IBook[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<SortValue>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    categoryApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchBooks = useCallback(
    async (nextPage: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');
      try {
        const res = await bookApi.getBooks({
          page: nextPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          category: category || undefined,
          sort,
        });
        setBooks((prev) => (append ? [...prev, ...res.books] : res.books));
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages);
      } catch {
        setError('Không tải được danh sách sách. Kiểm tra kết nối tới server.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, category, sort]
  );

  useEffect(() => {
    fetchBooks(1, false);
  }, [fetchBooks]);

  const loadMore = () => {
    if (!loadingMore && !loading && page < totalPages) {
      fetchBooks(page + 1, true);
    }
  };

  // Danh mục cha là đủ cho filter, không cần cây đầy đủ như web
  const rootCategories = categories.filter((c) => !c.parent);

  return (
    <View style={styles.safe}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm sách, tác giả..."
            placeholderTextColor={colors.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View>
        <FlatList
          horizontal
          data={[{ _id: '', name: 'Tất cả', slug: '' } as ICategory, ...rootCategories]}
          keyExtractor={(c) => c._id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, category === item._id && styles.chipActive]}
              onPress={() => setCategory(item._id)}
            >
              <Text style={[styles.chipText, category === item._id && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.sortChip, sort === s.value && styles.sortChipActive]}
            onPress={() => setSort(s.value)}
          >
            <Text style={[styles.sortText, sort === s.value && styles.sortTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textPlaceholder} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBooks(1, false)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={48} color={colors.textPlaceholder} />
          <Text style={styles.emptyText}>Không tìm thấy sách phù hợp</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b._id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: 16 }} /> : null
          }
          renderItem={({ item }) => (
            <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { slug: item.slug })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  chipList: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { borderColor: colors.primary, backgroundColor: '#E8F1E9' },
  sortText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  sortTextActive: { color: colors.primaryDark },
  grid: { paddingHorizontal: 10, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
