import { RouteProp, useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Package, Truck, CheckCircle2, QrCode, XCircle, MapPin, CreditCard, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderApi, paymentApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import GreenButton from '../components/GreenButton';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IOrder, OrderStatus } from '../types/models';
import {
  formatDate, formatPrice, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../utils/format';

const ORDER_STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipping', 'delivered'];

export default function OrderDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setOrder(await orderApi.getOrderById(params.orderId));
    } catch {
      Alert.alert('Lỗi', 'Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [params.orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

  // Custom Navigation Header
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Chi tiết đơn hàng',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 18, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const canCancel = order.orderStatus === 'pending' || order.orderStatus === 'confirmed';
  const canPayOnline =
    order.paymentMethod === 'ONLINE' &&
    order.paymentStatus === 'pending' &&
    order.orderStatus !== 'cancelled';

  const getStatusLabel = (status: OrderStatus) => {
    if (status === 'pending') return 'Chờ xác nhận';
    if (status === 'confirmed') return 'Đã xác nhận';
    if (status === 'shipping') return 'Đang giao';
    if (status === 'delivered') return 'Đã giao';
    if (status === 'cancelled') return 'Đã hủy';
    return status;
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'COD') return 'COD';
    if (method === 'ONLINE') return 'Chuyển khoản VietQR';
    return method;
  };

  const getPaymentStatusLabel = (status: string) => {
    if (status === 'pending') return 'Chưa thanh toán';
    if (status === 'paid') return 'Đã thanh toán';
    if (status === 'failed') return 'Thanh toán thất bại';
    return status;
  };

  const handlePayOnline = async () => {
    setPaying(true);
    try {
      const payment = await paymentApi.createPayosPayment(order._id);
      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
      } else {
        Alert.alert('Lỗi', 'Không tạo được link thanh toán');
      }
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không tạo được link thanh toán'));
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const updated = await orderApi.cancelOrder(order._id, cancelReason.trim() || undefined);
      setOrder(updated);
      setCancelVisible(false);
      setCancelReason('');
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không hủy được đơn hàng'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top General Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.orderCode}>#{order.orderCode}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.orderStatus)}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.paymentText}>
            Thanh toán: {getPaymentMethodLabel(order.paymentMethod)} - {getPaymentStatusLabel(order.paymentStatus)}
          </Text>
        </View>

        {/* Sản phẩm Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.productRow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&q=80' }}
                style={styles.productThumb}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title} x{item.quantity}
                </Text>
              </View>
              <Text style={styles.productPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.shippingFee)}</Text>
          </View>
          {order.discountTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-{formatPrice(order.discountTotal)}</Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Giao tới Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Giao tới</Text>
          <Text style={styles.recipientName}>
            {order.shippingAddress.recipientName} • {order.shippingAddress.phone}
          </Text>
          <Text style={styles.recipientAddress}>
            {order.shippingAddress.addressLine}, {order.shippingAddress.city}
          </Text>
        </View>

        {/* Lịch sử trạng thái Card */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lịch sử trạng thái</Text>
            <View style={styles.timelineContainer}>
              {order.statusHistory.map((h, i) => {
                const isFirst = i === 0;
                return (
                  <View key={i} style={styles.timelineItem}>
                    <View style={styles.timelineLineWrap}>
                      <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
                      {i !== order.statusHistory!.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStatus, isFirst && styles.timelineStatusActive]}>
                        {getStatusLabel(h.status)}
                      </Text>
                      <Text style={styles.timelineDate}>{formatDate(h.changedAt)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Actions for online pay */}
        {canPayOnline && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <GreenButton
              title="Thanh toán ngay bằng VietQR"
              onPress={handlePayOnline}
              loading={paying}
            />
          </View>
        )}

        {/* Actions for cancel */}
        {canCancel && !cancelVisible && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCancelVisible(true)}>
            <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        )}

        {cancelVisible && (
          <View style={[styles.card, { borderColor: colors.error, borderWidth: 1 }]}>
            <Text style={styles.sectionTitle}>Hủy đơn hàng</Text>
            <Text style={styles.cancelHint}>Vui lòng nhập lý do hủy đơn (không bắt buộc):</Text>
            <TextInput
              style={styles.cancelInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Ví dụ: Đổi ý không mua nữa..."
              placeholderTextColor={colors.textPlaceholder}
              multiline
            />
            <View style={styles.cancelActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => setCancelVisible(false)}
              >
                <Text style={styles.actionBtnOutlineText}>Không hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnDanger]} 
                onPress={handleCancel} 
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <Text style={styles.actionBtnDangerText}>Xác nhận hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: { 
    ...typography.h2, 
    fontSize: 16, 
    color: colors.text, 
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCode: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.surface,
    fontSize: 11,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  paymentText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Products List
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  productThumb: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  productPrice: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },

  // Summary
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: { ...typography.body, fontSize: 14, color: colors.textSecondary },
  summaryValue: { ...typography.body, fontSize: 14, color: colors.text, fontWeight: '500' },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  totalLabel: { ...typography.body, fontSize: 14, color: colors.text, fontWeight: '600' },
  totalValue: { ...typography.h2, fontSize: 18, color: colors.primary, fontWeight: '700' },

  // Giao toi details
  recipientName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recipientAddress: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Timeline (Lich su trang thai)
  timelineContainer: {
    marginTop: spacing.xs,
  },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineLineWrap: { width: 24, alignItems: 'center', marginRight: spacing.sm },
  timelineDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: colors.border, 
    marginTop: 4,
  },
  timelineDotActive: { backgroundColor: colors.primary },
  timelineLine: { 
    flex: 1, 
    width: 2, 
    backgroundColor: colors.border, 
    marginTop: 4,
  },
  timelineContent: { flex: 1, paddingBottom: spacing.sm },
  timelineStatus: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  timelineStatusActive: { color: colors.primary, fontWeight: '700' },
  timelineDate: { ...typography.caption, color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  // Cancel order details
  cancelBtn: {
    marginHorizontal: spacing.md,
    borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  cancelBtnText: { ...typography.h3, color: colors.error, fontSize: 16 },
  cancelHint: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  cancelInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, minHeight: 80, ...typography.body, textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  cancelActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionBtnOutline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  actionBtnOutlineText: { ...typography.h3, fontSize: 15 },
  actionBtnDanger: { backgroundColor: colors.error },
  actionBtnDangerText: { ...typography.h3, fontSize: 15, color: colors.surface },
});
