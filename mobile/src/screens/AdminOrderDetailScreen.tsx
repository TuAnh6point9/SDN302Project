import { RouteProp, useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  CreditCard,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import GreenButton from '../components/GreenButton';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IOrder, OrderStatus, PaymentStatus } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

export default function AdminOrderDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'AdminOrderDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setOrder(await orderApi.getOrderById(params.orderId));
    } catch {
      Alert.alert('Lỗi', 'Không tải được thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [params.orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Chi tiết đơn hàng (Admin)',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const updateOrderStatus = async (status: OrderStatus, payStatus?: PaymentStatus) => {
    setUpdating(true);
    try {
      const payload: any = { orderStatus: status };
      if (payStatus) payload.paymentStatus = payStatus;
      if (status === 'cancelled') payload.cancelReason = cancelReason.trim();

      const updated = await orderApi.updateStatus(params.orderId, payload);
      setOrder(updated);
      setCancelVisible(false);
      setCancelReason('');
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không cập nhật được trạng thái'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getStatusLabel = (status: OrderStatus) => {
    if (status === 'pending') return 'Chờ xác nhận';
    if (status === 'confirmed') return 'Đã xác nhận';
    if (status === 'shipping') return 'Đang giao';
    if (status === 'delivered') return 'Đã giao';
    if (status === 'cancelled') return 'Đã hủy';
    return status;
  };

  const getStatusColor = (status: OrderStatus) => {
    if (status === 'pending') return colors.warning;
    if (status === 'confirmed') return '#2563EB';
    if (status === 'shipping') return '#7C3AED';
    if (status === 'delivered') return colors.success;
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(order.orderStatus) }]}>
          <Text style={styles.statusBannerText}>Trạng thái: {getStatusLabel(order.orderStatus)}</Text>
          <Text style={styles.orderCodeText}>Mã đơn: {order.orderCode}</Text>
          <Text style={styles.orderDateText}>Ngày đặt: {formatDate(order.createdAt)}</Text>
        </View>

        {/* Action Buttons for Status Update */}
        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cập nhật trạng thái đơn hàng</Text>
            
            {updating ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
            ) : (
              <View style={styles.actionRow}>
                {order.orderStatus === 'pending' && (
                  <GreenButton
                    title="Xác nhận đơn hàng"
                    onPress={() => updateOrderStatus('confirmed')}
                    style={styles.actionBtn}
                  />
                )}
                {order.orderStatus === 'confirmed' && (
                  <GreenButton
                    title="Bắt đầu giao hàng"
                    onPress={() => updateOrderStatus('shipping')}
                    style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
                  />
                )}
                {order.orderStatus === 'shipping' && (
                  <GreenButton
                    title="Hoàn thành đơn (Đã giao)"
                    onPress={() => updateOrderStatus('delivered', 'paid')}
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  />
                )}

                <TouchableOpacity
                  style={styles.cancelToggleBtn}
                  onPress={() => setCancelVisible(!cancelVisible)}
                >
                  <Text style={styles.cancelToggleText}>
                    {cancelVisible ? 'Đóng' : 'Huỷ đơn hàng'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {cancelVisible && (
              <View style={styles.cancelForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Lý do huỷ đơn hàng..."
                  placeholderTextColor={colors.textPlaceholder}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />
                <TouchableOpacity
                  style={[styles.confirmCancelBtn, !cancelReason.trim() && styles.confirmCancelBtnDisabled]}
                  disabled={!cancelReason.trim() || updating}
                  onPress={() => updateOrderStatus('cancelled')}
                >
                  <Text style={styles.confirmCancelText}>Xác nhận huỷ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Recipient Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
          </View>
          <Text style={styles.infoText}>Họ tên: {order.shippingAddress.recipientName}</Text>
          <Text style={styles.infoText}>Điện thoại: {order.shippingAddress.phone}</Text>
          <Text style={styles.infoText}>Địa chỉ: {order.shippingAddress.addressLine}, {order.shippingAddress.city}</Text>
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Thanh toán</Text>
          </View>
          <Text style={styles.infoText}>
            Phương thức: {order.paymentMethod === 'COD' ? 'COD (Thanh toán khi nhận)' : 'Chuyển khoản VietQR'}
          </Text>
          <Text style={styles.infoText}>
            Trạng thái: {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </Text>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Package size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Danh sách sách mua</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={index} style={styles.bookRow}>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.bookPrice}>
                  {formatPrice(item.price)} x{item.quantity}
                </Text>
              </View>
              <Text style={styles.bookTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Costs summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          {order.discountTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -{formatPrice(order.discountTotal)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.shippingFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  statusBanner: {
    padding: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  statusBannerText: {
    ...typography.h2,
    color: '#fff',
    fontSize: 16,
  },
  orderCodeText: {
    ...typography.body,
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
  },
  orderDateText: {
    ...typography.body,
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text,
  },
  infoText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  bookPrice: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bookTotal: {
    ...typography.h3,
    fontSize: 13,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
  },
  totalValue: {
    ...typography.h2,
    fontSize: 17,
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    marginTop: 0,
  },
  cancelToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelToggleText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cancelForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
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
  confirmCancelBtn: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnDisabled: {
    opacity: 0.5,
  },
  confirmCancelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
