import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookApi, inventoryApi } from '../api';
import GreenButton from '../components/GreenButton';
import GreenInput from '../components/GreenInput';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook } from '../types/models';
import { formatPrice } from '../utils/format';

type FilterType = 'all' | 'low_stock' | 'out_of_stock';

export default function AdminInventoryScreen() {
  const navigation = useNavigation();
  const [books, setBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Edit stock Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);
  const [mode, setMode] = useState<'set' | 'change'>('change');
  const [type, setType] = useState<'import' | 'adjustment' | 'return'>('import');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await bookApi.getBooks({ limit: 100, sort: 'newest' });
      setBooks(res.books);
    } catch {
      Alert.alert('Lỗi', 'Không tải được danh sách sách');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Tồn kho',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const openEditModal = (book: IBook) => {
    setSelectedBook(book);
    setMode('change');
    setType('import');
    setQuantity('1');
    setNote('');
    setEditModalVisible(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedBook) return;
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ');
      return;
    }

    setUpdating(true);
    try {
      const payload: any = {
        mode,
        type,
        note: note.trim(),
      };
      if (mode === 'set') {
        payload.quantity = qtyNum;
      } else {
        payload.quantityChange = type === 'return' ? -qtyNum : qtyNum; // negative for return
      }

      await inventoryApi.adjust(selectedBook._id, payload);
      Alert.alert('Thành công', 'Đã điều chỉnh tồn kho');
      setEditModalVisible(false);
      fetchBooks();
    } catch {
      Alert.alert('Lỗi', 'Không điều chỉnh được tồn kho, vui lòng thử lại');
    } finally {
      setUpdating(false);
    }
  };

  // Filters logic
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'low_stock') {
      return book.stockQuantity > 0 && book.stockQuantity <= 5;
    }
    if (filter === 'out_of_stock') {
      return book.stockQuantity === 0;
    }
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* Search Section */}
      <View style={styles.headerFilters}>
        <GreenInput
          placeholder="Tìm tên sách, tác giả..."
          value={search}
          onChangeText={setSearch}
          isSearch
        />

        {/* Filters Group */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'low_stock' && styles.tabActive]}
            onPress={() => setFilter('low_stock')}
          >
            <Text style={[styles.tabText, filter === 'low_stock' && styles.tabTextActive]}>Sắp hết hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'out_of_stock' && styles.tabActive]}
            onPress={() => setFilter('out_of_stock')}
          >
            <Text style={[styles.tabText, filter === 'out_of_stock' && styles.tabTextActive]}>Hết hàng</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Books Listing */}
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Không tìm thấy sách nào phù hợp</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;
          const isOutOfStock = item.stockQuantity === 0;
          return (
            <TouchableOpacity style={styles.bookCard} onPress={() => openEditModal(item)}>
              <View style={styles.bookDetails}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <Text style={styles.bookPrice}>{formatPrice(item.discountPrice ?? item.price)}</Text>
              </View>
              <View style={styles.stockCol}>
                <Text style={styles.stockLabel}>Tồn kho</Text>
                <Text style={[
                  styles.stockValue,
                  isOutOfStock && styles.stockOut,
                  isLowStock && styles.stockLow
                ]}>
                  {item.stockQuantity}
                </Text>
                <Text style={styles.tapToEdit}>Chạm để sửa</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Edit Stock Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cập nhật kho hàng</Text>
            {selectedBook && (
              <View style={styles.modalBookInfo}>
                <Text style={styles.modalBookTitle} numberOfLines={2}>{selectedBook.title}</Text>
                <Text style={styles.modalBookStock}>Tồn kho hiện tại: {selectedBook.stockQuantity} cuốn</Text>
              </View>
            )}

            {/* Mode selection (set vs change) */}
            <Text style={styles.formLabel}>Phương thức cập nhật</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'change' && styles.toggleBtnActive]}
                onPress={() => setMode('change')}
              >
                <Text style={[styles.toggleBtnText, mode === 'change' && styles.toggleBtnTextActive]}>
                  Thay đổi (+/-)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'set' && styles.toggleBtnActive]}
                onPress={() => setMode('set')}
              >
                <Text style={[styles.toggleBtnText, mode === 'set' && styles.toggleBtnTextActive]}>
                  Đặt số lượng mới
                </Text>
              </TouchableOpacity>
            </View>

            {/* Adjustment Type Selection */}
            {mode === 'change' && (
              <>
                <Text style={styles.formLabel}>Loại giao dịch</Text>
                <View style={styles.toggleRow}>
                  {(['import', 'adjustment', 'return'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.toggleBtn, type === t && styles.toggleBtnActive]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.toggleBtnText, type === t && styles.toggleBtnTextActive]}>
                        {t === 'import' ? 'Nhập hàng' : t === 'adjustment' ? 'Điều chỉnh' : 'Trả hàng'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Quantity Input */}
            <Text style={styles.formLabel}>Số lượng</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="Nhập số lượng..."
              placeholderTextColor={colors.textPlaceholder}
            />

            {/* Note Input */}
            <Text style={styles.formLabel}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Nhập lý do điều chỉnh..."
              placeholderTextColor={colors.textPlaceholder}
            />

            {updating ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <GreenButton
                  title="Xác nhận"
                  onPress={handleAdjustStock}
                  style={styles.confirmBtn}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerFilters: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookDetails: {
    flex: 1,
    marginRight: spacing.md,
    gap: 2,
  },
  bookTitle: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
  },
  bookAuthor: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bookPrice: {
    ...typography.h3,
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  stockCol: {
    alignItems: 'center',
    gap: 2,
  },
  stockLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  stockValue: {
    ...typography.h1,
    fontSize: 18,
    color: colors.primary,
  },
  stockOut: { color: colors.error },
  stockLow: { color: '#E65100' },
  tapToEdit: {
    fontSize: 8,
    color: colors.textPlaceholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalBookInfo: {
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: 2,
  },
  modalBookTitle: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  modalBookStock: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  formLabel: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFACA',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBtn: {
    flex: 1,
    height: 40,
    marginTop: 0,
  },
});
