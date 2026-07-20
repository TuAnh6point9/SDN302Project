import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
import { bookApi, categoryApi } from '../api';
import GreenButton from '../components/GreenButton';
import GreenInput from '../components/GreenInput';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook, ICategory } from '../types/models';
import { formatPrice } from '../utils/format';

export default function AdminBooksScreen() {
  const navigation = useNavigation();
  const [books, setBooks] = useState<IBook[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Add/Edit Book Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bookRes, catRes] = await Promise.all([
        bookApi.getBooks({ limit: 100, sort: 'newest' }),
        categoryApi.getCategories(),
      ]);
      setBooks(bookRes.books);
      setCategories(catRes);
    } catch {
      Alert.alert('Lỗi', 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Sách',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setStockQuantity('');
    setSelectedCategory(categories[0]?._id || '');
    setIsFeatured(false);
    setModalVisible(true);
  };

  const openEditModal = (book: IBook) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setDescription(book.description);
    setPrice(String(book.price));
    setDiscountPrice(book.discountPrice ? String(book.discountPrice) : '');
    setStockQuantity(String(book.stockQuantity));
    setSelectedCategory(typeof book.category === 'object' ? book.category._id : book.category);
    setIsFeatured(book.isFeatured);
    setModalVisible(true);
  };

  const handleSaveBook = async () => {
    const priceNum = parseInt(price, 10);
    const discountPriceNum = discountPrice ? parseInt(discountPrice, 10) : undefined;
    const stockNum = parseInt(stockQuantity, 10);

    if (!title.trim() || !author.trim() || isNaN(priceNum) || isNaN(stockNum)) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      // Mock images array for mobile creations
      const images = editingBook ? editingBook.images : ['/uploads/books/default.jpg'];
      const payload = {
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || 'Sách về thiên nhiên',
        price: priceNum,
        discountPrice: discountPriceNum,
        stockQuantity: stockNum,
        category: selectedCategory,
        isFeatured,
        images,
        language: 'Tiếng Việt',
        tags: ['môi trường'],
      };

      if (editingBook) {
        await bookApi.updateBook(editingBook._id, payload);
        Alert.alert('Thành công', 'Đã cập nhật sách');
      } else {
        await bookApi.createBook(payload);
        Alert.alert('Thành công', 'Đã thêm sách mới');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu sách, vui lòng kiểm tra lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = (id: string) => {
    Alert.alert('Xoá sách', 'Bạn có chắc chắn muốn xoá đầu sách này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookApi.deleteBook(id);
            Alert.alert('Thành công', 'Đã xoá sách');
            fetchData();
          } catch {
            Alert.alert('Lỗi', 'Không xoá được sách');
          }
        },
      },
    ]);
  };

  const handleToggleFeatured = async (book: IBook, newValue: boolean) => {
    setBooks((prev) =>
      prev.map((b) => (b._id === book._id ? { ...b, isFeatured: newValue } : b))
    );
    try {
      await bookApi.updateBook(book._id, { isFeatured: newValue });
    } catch {
      Alert.alert('Lỗi', 'Không cập nhật được trạng thái nổi bật');
      setBooks((prev) =>
        prev.map((b) => (b._id === book._id ? { ...b, isFeatured: !newValue } : b))
      );
    }
  };

  const filteredBooks = books.filter((b) => {
    return (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    );
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
      <View style={styles.headerFilters}>
        <GreenInput
          placeholder="Tìm tên sách, tác giả..."
          value={search}
          onChangeText={setSearch}
          isSearch
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Thêm Sách Mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.bookAuthor}>{item.author}</Text>
              <Text style={styles.bookPrice}>
                {formatPrice(item.discountPrice ?? item.price)}
              </Text>
              <View style={styles.featuredRow}>
                <Text style={styles.featuredLabel}>Nổi bật</Text>
                <Switch
                  value={item.isFeatured}
                  onValueChange={(val) => handleToggleFeatured(item, val)}
                  trackColor={{ false: '#767577', true: colors.primaryLight }}
                  thumbColor={item.isFeatured ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
            <View style={styles.actionsCol}>
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(item)}>
                <Edit2 size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDeleteBook(item._id)}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
              </Text>

              <Text style={styles.formLabel}>Tên sách *</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tên sách..." />

              <Text style={styles.formLabel}>Tác giả *</Text>
              <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Nhập tên tác giả..." />

              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả sách..."
                multiline
              />

              <Text style={styles.formLabel}>Giá bán *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="number-pad"
                placeholder="VD: 120000"
              />

              <Text style={styles.formLabel}>Giá khuyến mãi</Text>
              <TextInput
                style={styles.input}
                value={discountPrice}
                onChangeText={setDiscountPrice}
                keyboardType="number-pad"
                placeholder="VD: 90000 (nếu có)"
              />

              <Text style={styles.formLabel}>Số lượng tồn kho *</Text>
              <TextInput
                style={styles.input}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="number-pad"
                placeholder="VD: 50"
              />

              <Text style={styles.formLabel}>Danh mục</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat._id;
                    return (
                      <TouchableOpacity
                        key={cat._id}
                        style={[styles.catChip, isSelected && styles.catChipActive]}
                        onPress={() => setSelectedCategory(cat._id)}
                      >
                        <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.formLabel}>Đặt làm sách nổi bật</Text>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: '#767577', true: colors.primaryLight }}
                  thumbColor={isFeatured ? colors.primary : '#f4f3f4'}
                />
              </View>

              {saving ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Huỷ</Text>
                  </TouchableOpacity>
                  <GreenButton title="Lưu lại" onPress={handleSaveBook} style={styles.confirmBtn} />
                </View>
              )}
            </View>
          </ScrollView>
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
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  listContent: { padding: spacing.md, gap: spacing.md },
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
  bookDetails: { flex: 1, gap: 2 },
  bookTitle: { ...typography.body, fontWeight: '600', fontSize: 14, color: colors.text },
  bookAuthor: { ...typography.caption, color: colors.textSecondary },
  bookPrice: { ...typography.h3, fontSize: 13, color: colors.primary, marginTop: 2 },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  featuredLabel: { fontSize: 11, color: colors.textSecondary },
  actionsCol: { gap: spacing.md, alignItems: 'center' },
  actionIconBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalScroll: { paddingVertical: 40, paddingHorizontal: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  modalTitle: { ...typography.h2, fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  formLabel: { ...typography.body, fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 40, fontSize: 13, color: colors.text },
  pickerContainer: { marginVertical: 4 },
  catScroll: { gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  confirmBtn: { flex: 1, height: 40, marginTop: 0 },
});
