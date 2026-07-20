import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { voucherApi } from '../api';
import GreenButton from '../components/GreenButton';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IVoucher } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

export default function AdminVouchersScreen() {
  const navigation = useNavigation();
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Voucher Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('fixed');
  const [value, setValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresDays, setExpiresDays] = useState('30'); // default expires in 30 days
  const [creating, setCreating] = useState(false);

  const fetchVouchers = useCallback(async () => {
    try {
      setVouchers(await voucherApi.getVouchers());
    } catch {
      Alert.alert('Lỗi', 'Không tải được danh sách voucher');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Voucher',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVouchers();
  };

  const handleToggleVoucher = async (voucher: IVoucher, newValue: boolean) => {
    // Optimistic update
    setVouchers((prev) =>
      prev.map((v) => (v._id === voucher._id ? { ...v, isActive: newValue } : v))
    );
    try {
      await voucherApi.updateVoucher(voucher.code, { isActive: newValue });
    } catch {
      Alert.alert('Lỗi', 'Không cập nhật được voucher');
      // Rollback
      setVouchers((prev) =>
        prev.map((v) => (v._id === voucher._id ? { ...v, isActive: !newValue } : v))
      );
    }
  };

  const handleCreateVoucher = async () => {
    const cleanCode = code.trim().toUpperCase();
    const valNum = parseInt(value, 10);
    const minOrderValNum = parseInt(minOrderValue, 10) || 0;
    const maxDiscountNum = parseInt(maxDiscount, 10) || undefined;
    const usageLimitNum = parseInt(usageLimit, 10) || undefined;
    const expiresDaysNum = parseInt(expiresDays, 10) || 30;

    if (!cleanCode) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã voucher');
      return;
    }
    if (isNaN(valNum) || valNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá trị giảm hợp lệ');
      return;
    }

    setCreating(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresDaysNum);

      const payload = {
        code: cleanCode,
        type,
        value: valNum,
        minOrderValue: minOrderValNum,
        maxDiscount: maxDiscountNum,
        usageLimit: usageLimitNum,
        expiresAt: expiresAt.toISOString(),
        isActive: true,
      };

      await voucherApi.createVoucher(payload);
      Alert.alert('Thành công', 'Đã tạo voucher mới');
      setCreateModalVisible(false);
      // Reset form
      setCode('');
      setValue('');
      setMinOrderValue('');
      setMaxDiscount('');
      setUsageLimit('');
      setExpiresDays('30');
      fetchVouchers();
    } catch {
      Alert.alert('Lỗi', 'Không tạo được voucher, vui lòng thử lại');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {/* Create Button Top */}
      <View style={styles.topBtnSection}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Tạo Voucher Mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vouchers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có voucher nào</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
          return (
            <View style={[styles.voucherCard, !item.isActive && styles.voucherInactive]}>
              <View style={styles.voucherLeft}>
                <View style={styles.codeRow}>
                  <Text style={styles.voucherCode}>{item.code}</Text>
                  {isExpired && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredText}>Hết hạn</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.voucherDesc}>
                  Giảm {item.type === 'percent' ? `${item.value}%` : formatPrice(item.value)}
                  {item.minOrderValue > 0 ? ` cho đơn từ ${formatPrice(item.minOrderValue)}` : ''}
                </Text>
                {item.maxDiscount && (
                  <Text style={styles.voucherSubdesc}>Giảm tối đa: {formatPrice(item.maxDiscount)}</Text>
                )}
                {item.usageLimit && (
                  <Text style={styles.voucherSubdesc}>
                    Đã dùng: {item.usedCount ?? 0}/{item.usageLimit} lượt
                  </Text>
                )}
                {item.expiresAt && (
                  <Text style={styles.voucherSubdesc}>Hạn dùng: {formatDate(item.expiresAt)}</Text>
                )}
              </View>

              <View style={styles.voucherRight}>
                <Text style={styles.activeLabel}>{item.isActive ? 'Bật' : 'Tắt'}</Text>
                <Switch
                  value={item.isActive}
                  onValueChange={(val) => handleToggleVoucher(item, val)}
                  trackColor={{ false: '#767577', true: colors.primaryLight }}
                  thumbColor={item.isActive ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
          );
        }}
      />

      {/* Create Voucher Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Tạo voucher mới</Text>

              {/* Code */}
              <Text style={styles.formLabel}>Mã Voucher</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(val) => setCode(val.toUpperCase())}
                placeholder="VD: KHUYENMAI10"
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="characters"
              />

              {/* Type */}
              <Text style={styles.formLabel}>Loại giảm giá</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'fixed' && styles.toggleBtnActive]}
                  onPress={() => setType('fixed')}
                >
                  <Text style={[styles.toggleBtnText, type === 'fixed' && styles.toggleBtnTextActive]}>
                    Số tiền cố định (đ)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'percent' && styles.toggleBtnActive]}
                  onPress={() => setType('percent')}
                >
                  <Text style={[styles.toggleBtnText, type === 'percent' && styles.toggleBtnTextActive]}>
                    Phần trăm (%)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Value */}
              <Text style={styles.formLabel}>Giá trị giảm</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                keyboardType="number-pad"
                placeholder={type === 'percent' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
                placeholderTextColor={colors.textPlaceholder}
              />

              {/* Min Order Value */}
              <Text style={styles.formLabel}>Giá trị đơn hàng tối thiểu (đ)</Text>
              <TextInput
                style={styles.input}
                value={minOrderValue}
                onChangeText={setMinOrderValue}
                keyboardType="number-pad"
                placeholder="Ví dụ: 150000"
                placeholderTextColor={colors.textPlaceholder}
              />

              {/* Max Discount */}
              {type === 'percent' && (
                <>
                  <Text style={styles.formLabel}>Giảm giá tối đa (đ)</Text>
                  <TextInput
                    style={styles.input}
                    value={maxDiscount}
                    onChangeText={setMaxDiscount}
                    keyboardType="number-pad"
                    placeholder="Ví dụ: 50000"
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </>
              )}

              {/* Usage Limit */}
              <Text style={styles.formLabel}>Giới hạn lượt sử dụng</Text>
              <TextInput
                style={styles.input}
                value={usageLimit}
                onChangeText={setUsageLimit}
                keyboardType="number-pad"
                placeholder="Bỏ trống nếu không giới hạn"
                placeholderTextColor={colors.textPlaceholder}
              />

              {/* Expires In */}
              <Text style={styles.formLabel}>Hiệu lực trong (ngày)</Text>
              <TextInput
                style={styles.input}
                value={expiresDays}
                onChangeText={setExpiresDays}
                keyboardType="number-pad"
                placeholder="Mặc định: 30 ngày"
                placeholderTextColor={colors.textPlaceholder}
              />

              {creating ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setCreateModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Huỷ</Text>
                  </TouchableOpacity>
                  <GreenButton
                    title="Tạo mới"
                    onPress={handleCreateVoucher}
                    style={styles.confirmBtn}
                  />
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
  topBtnSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  voucherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  voucherInactive: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  voucherLeft: {
    flex: 1,
    gap: 4,
    marginRight: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voucherCode: {
    ...typography.h3,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },
  expiredBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredText: {
    color: colors.error,
    fontSize: 9,
    fontWeight: '700',
  },
  voucherDesc: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  voucherSubdesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  voucherRight: {
    alignItems: 'center',
    gap: 4,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
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
