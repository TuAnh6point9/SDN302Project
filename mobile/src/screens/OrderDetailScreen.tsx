import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { orderApi, paymentApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { IOrder } from '../types/models';
import {
  formatDate, formatPrice, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../utils/format';

export default function OrderDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>();
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

  // refetch khi quay lại màn hình (ví dụ sau khi thanh toán payOS xong)
  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

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
    <ScrollView style={styles.safe} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.orderCode}>#{order.orderCode}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Trạng thái</Text>
          <Text style={styles.metaValue}>{ORDER_STATUS_LABELS[order.orderStatus]}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Thanh toán</Text>
          <Text style={styles.metaValue}>
            {order.paymentMethod === 'COD' ? 'COD' : 'VietQR/payOS'} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Text>
        </View>
        {order.cancelReason ? (
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>Lý do hủy</Text>
            <Text style={[styles.metaValue, { color: colors.error }]}>{order.cancelReason}</Text>
          </View>
        ) : null}
      </View>

      {canPayOnline && (
        <TouchableOpacity style={styles.payBtn} onPress={handlePayOnline} disabled={paying}>
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Thanh toán VietQR</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Sản phẩm</Text>
      <View style={styles.card}>
        {order.items.map((item, i) => (
          <View key={i} style={styles.rowBetween}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title} x{item.quantity}
            </Text>
            <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Tạm tính</Text>
          <Text style={styles.metaValue}>{formatPrice(order.subtotal)}</Text>
        </View>
        {order.discountTotal > 0 && (
          <View style={styles.rowBetween}>
            <Text style={styles.metaLabel}>Giảm giá{order.voucherCode ? ` (${order.voucherCode})` : ''}</Text>
            <Text style={[styles.metaValue, { color: colors.success }]}>-{formatPrice(order.discountTotal)}</Text>
          </View>
        )}
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Phí vận chuyển</Text>
          <Text style={styles.metaValue}>{formatPrice(order.shippingFee)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Giao tới</Text>
      <View style={styles.card}>
        <Text style={styles.metaValue}>{order.shippingAddress.recipientName} · {order.shippingAddress.phone}</Text>
        <Text style={styles.metaLabel}>
          {order.shippingAddress.addressLine}, {order.shippingAddress.city}
        </Text>
      </View>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Lịch sử trạng thái</Text>
          <View style={styles.card}>
            {order.statusHistory.map((h, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineStatus}>{ORDER_STATUS_LABELS[h.status]}</Text>
                  {h.note ? <Text style={styles.timelineNote}>{h.note}</Text> : null}
                  <Text style={styles.timelineDate}>{formatDate(h.changedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {canCancel && !cancelVisible && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setCancelVisible(true)}>
          <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
        </TouchableOpacity>
      )}

      {cancelVisible && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.metaValue}>Lý do hủy (tùy chọn)</Text>
          <TextInput
            style={styles.cancelInput}
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Ví dụ: đặt nhầm số lượng"
            placeholderTextColor={colors.textPlaceholder}
            multiline
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.cancelConfirm, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => setCancelVisible(false)}
            >
              <Text style={[styles.cancelConfirmText, { color: colors.text }]}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelConfirm} onPress={handleCancel} disabled={cancelling}>
              {cancelling
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.cancelConfirmText}>Xác nhận hủy</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  orderCode: { fontSize: 16, fontWeight: '800', color: colors.text },
  date: { fontSize: 12, color: colors.textPlaceholder },
  metaLabel: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  metaValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  itemTitle: { flex: 1, fontSize: 13, color: colors.text },
  itemPrice: { fontSize: 13, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },
  payBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  timelineRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, marginTop: 4,
  },
  timelineStatus: { fontSize: 13, fontWeight: '700', color: colors.text },
  timelineNote: { fontSize: 12, color: colors.textSecondary },
  timelineDate: { fontSize: 11, color: colors.textPlaceholder },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  cancelBtnText: { color: colors.error, fontWeight: '700', fontSize: 14 },
  cancelInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 60,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
  },
  cancelConfirm: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: radius.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
