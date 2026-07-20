import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Leaf, Search as SearchIcon, SlidersHorizontal, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookApi, categoryApi, voucherApi } from '../api';
import BookCard from '../components/BookCard';
import GreenInput from '../components/GreenInput';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook, ICategory, IVoucher } from '../types/models';
import { formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'featured';

const PAGE_SIZE = 10;

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Nổi bật', value: 'featured' },
  { label: 'Giá tăng', value: 'price_asc' },
  { label: 'Giá giảm', value: 'price_desc' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [books, setBooks] = useState<IBook[]>([]);
  const [bestSellerIds, setBestSellerIds] = useState<Set<string>>(new Set());
  const [eventVouchers, setEventVouchers] = useState<IVoucher[]>([]);
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
    bookApi.getBestSellerIds()
      .then((ids) => setBestSellerIds(new Set(ids)))
      .catch(() => setBestSellerIds(new Set()));
    voucherApi.getHomepageEvents()
      .then(setEventVouchers)
      .catch(() => setEventVouchers([]));
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

  const rootCategories = categories.filter((c) => !c.parent);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Logo Header */}
      <View style={styles.logoRow}>
        <Leaf size={28} color={colors.primary} fill={colors.primary} />
        <Text style={styles.logoText}>GreenLeaf Books</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchRow}>
        <GreenInput
          containerStyle={styles.searchFlex}
          placeholder="Tìm sách, tác giả..."
          value={search}
          onChangeText={setSearch}
          isSearch
        />
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Tri thức xanh</Text>
          <Text style={styles.heroTitleLight}>Cuộc sống xanh</Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            Khám phá những cuốn sách hay về thiên nhiên và cuộc sống
          </Text>
          <TouchableOpacity style={styles.heroCta}>
            <Text style={styles.heroCtaText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80' }}
          style={styles.heroImage}
        />
      </View>

      {eventVouchers.length > 0 && (
        <FlatList
          horizontal
          data={eventVouchers}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoList}
          snapToAlignment="start"
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={styles.promoCard}>
              <View style={styles.promoContent}>
                <Text style={styles.promoEyebrow}>Voucher sự kiện</Text>
                <Text style={styles.promoCode}>{item.code}</Text>
                <Text style={styles.promoText}>
                  Giảm {formatPrice(item.value)}
                  {item.minOrderValue > 0 ? ` cho đơn từ ${formatPrice(item.minOrderValue)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.promoBtn}
                onPress={() => navigation.navigate('Tabs', { screen: 'Rewards' })}
              >
                <Text style={styles.promoBtnText}>Lưu mã</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Categories Row */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục</Text>
      </View>
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

      {/* Sort Options Row */}
      <FlatList
        horizontal
        data={SORT_OPTIONS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipList, { marginTop: spacing.xs, marginBottom: spacing.sm }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.sortChip, sort === item.value && styles.sortChipActive]}
            onPress={() => setSort(item.value)}
          >
            <Text style={[styles.sortChipText, sort === item.value && styles.sortChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Section Featured Header */}
      <View style={styles.featuredHeaderRow}>
        <Text style={styles.sectionTitle}>Sách nổi bật</Text>
        <TouchableOpacity style={styles.seeAllBtn} onPress={() => {}}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBooks(1, false)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b._id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={renderHeader}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore || loading ? (
              <ActivityIndicator color={colors.primary} style={{ margin: spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>Không tìm thấy sách phù hợp</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <BookCard
              book={item}
              isBestSeller={bestSellerIds.has(item._id)}
              onPress={() => navigation.navigate('BookDetail', { slug: item.slug })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerContainer: {
    paddingTop: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  logoText: {
    ...typography.h2,
    fontSize: 20,
    color: colors.primary,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchFlex: {
    flex: 1,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    marginHorizontal: spacing.md,
    height: 190,
    backgroundColor: '#E8F2E6',
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  heroContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: 0,
    fontSize: 20,
  },
  heroTitleLight: {
    ...typography.h2,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
    fontSize: 20,
  },
  heroSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  heroCta: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
  },
  heroCtaText: {
    ...typography.h3,
    fontSize: 12,
    color: colors.surface,
  },
  heroImage: {
    width: 130,
    height: '100%',
  },
  promoList: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  promoCard: {
    width: 300,
    minHeight: 116,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  promoContent: {
    flex: 1,
    gap: 3,
  },
  promoEyebrow: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  promoCode: {
    ...typography.h2,
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
  },
  promoText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 18,
  },
  promoBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  promoBtnText: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  chipList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.surface,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  sortChipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.body,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  grid: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
});
