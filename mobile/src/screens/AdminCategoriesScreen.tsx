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
import { Plus, Folder } from 'lucide-react-native';
import { categoryApi } from '../api';
import GreenButton from '../components/GreenButton';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { ICategory } from '../types/models';

export default function AdminCategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await categoryApi.getCategories());
    } catch {
      Alert.alert('Lỗi', 'Không tải được danh mục');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Danh mục',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const openAddModal = () => {
    setName('');
    setDescription('');
    // Prefill parent to the first category if any
    setParentId(categories[0]?._id || '');
    setModalVisible(true);
  };

  const handleCreateCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);
    try {
      await categoryApi.createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        parent: parentId || undefined,
      });
      Alert.alert('Thành công', 'Đã tạo danh mục mới');
      setModalVisible(false);
      fetchCategories();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo danh mục, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Categories hierarchy listing
  const parentCategories = categories.filter((c) => !c.parent);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.topBtnSection}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Tạo Danh Mục Mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        renderItem={({ item }) => {
          const isChild = !!item.parent;
          const parentCatName = isChild
            ? categories.find((c) => c._id === item.parent)?.name
            : '';

          return (
            <View style={[styles.catCard, isChild && styles.catCardChild]}>
              <Folder size={18} color={isChild ? '#767577' : colors.primary} />
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{item.name}</Text>
                {isChild && (
                  <Text style={styles.catParentText}>Thuộc danh mục: {parentCatName}</Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo danh mục mới</Text>

            <Text style={styles.formLabel}>Tên danh mục *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: Cây cổ thụ"
              placeholderTextColor={colors.textPlaceholder}
            />

            <Text style={styles.formLabel}>Mô tả</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Nhập mô tả..."
              placeholderTextColor={colors.textPlaceholder}
            />

            {parentCategories.length > 0 && (
              <>
                <Text style={styles.formLabel}>Chọn danh mục cha</Text>
                <View style={styles.parentContainer}>
                  <FlatList
                    horizontal
                    data={parentCategories}
                    keyExtractor={(item) => item._id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                    renderItem={({ item }) => {
                      const isSelected = parentId === item._id;
                      return (
                        <TouchableOpacity
                          style={[styles.parentChip, isSelected && styles.parentChipActive]}
                          onPress={() => setParentId(isSelected ? '' : item._id)}
                        >
                          <Text style={[styles.parentChipText, isSelected && styles.parentChipTextActive]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </>
            )}

            {submitting ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <GreenButton title="Tạo mới" onPress={handleCreateCategory} style={styles.confirmBtn} />
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
  topBtnSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  catCardChild: {
    marginLeft: 20,
    backgroundColor: '#FAFAFA',
  },
  catInfo: { flex: 1 },
  catName: { ...typography.body, fontWeight: '600', fontSize: 14, color: colors.text },
  catParentText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, width: '100%', gap: spacing.sm },
  modalTitle: { ...typography.h2, fontSize: 18, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  formLabel: { ...typography.body, fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 40, fontSize: 13, color: colors.text },
  parentContainer: { marginVertical: 4 },
  parentChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  parentChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  parentChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  parentChipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  confirmBtn: { flex: 1, height: 40, marginTop: 0 },
});
