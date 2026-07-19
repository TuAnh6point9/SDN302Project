import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { orderApi, voucherApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import ProvincePicker from '../components/ProvincePicker';
import { PROVINCES } from '../constants/provinces';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { PaymentMethod } from '../types/models';
import { formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SHIPPING_FEE = 30000; // đồng bộ với client/src/pages/CheckoutPage.tsx

export default function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { cart, clearLocal } = useCart();

  const defaultAddress = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];
  const [recipientName, setRecipientName] = useState(defaultAddress?.recipientName ?? user?.name ?? '');
  const [phone, setPhone] = useState(defaultAddress?.phone ?? user?.phone ?? '');
  const [addressLine, setAddressLine] = useState(defaultAddress?.addressLine ?? '');
  const [city, setCity] = useState(
    defaultAddress?.city && PROVINCES.includes(defaultAddress.city) ? defaultAddress.city : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountTotal: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.book.discountPrice ?? item.book.price) * item.quantity,
    0
  );
  const discountTotal = appliedVoucher?.discountTotal ?? 0;
  const total = subtotal - discountTotal + SHIPPING_FEE;

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setVoucherError('');
    try {
      const res = await voucherApi.validate(code, subtotal);
      setAppliedVoucher({ code, discountTotal: res.discountTotal });
    } catch (err) {
      setAppliedVoucher(null);
      setVoucherError(getApiErrorMessage(err, 'Mã giảm giá không hợp lệ'));
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!recipientName.trim() || !phone.trim() || !addressLine.trim() || !city.trim()) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const order = await orderApi.createOrder({
        shippingAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          addressLine: addressLine.trim(),
          city: city.trim(),
        },
        shippingFee: SHIPPING_FEE,
        voucherCode: appliedVoucher?.code,
        paymentMethod,
      });
      clearLocal();
      navigation.replace('OrderDetail', { orderId: order._id });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đặt hàng thất bại, thử lại sau'));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Giỏ hàng trống, không thể đặt hàng</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.safe} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Người nhận</Text>
          <TextInput style={styles.input} value={recipientName} onChangeText={setRecipientName}
            placeholder="Họ tên người nhận" placeholderTextColor={colors.textPlaceholder} />
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone}
            placeholder="0901234567" placeholderTextColor={colors.textPlaceholder} keyboardType="phone-pad" />
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput style={styles.input} value={addressLine} onChangeText={setAddressLine}
            placeholder="Số nhà, đường, phường/xã" placeholderTextColor={colors.textPlaceholder} />
          <Text style={styles.label}>Tỉnh/Thành phố</Text>
          <ProvincePicker value={city} onChange={setCity} />
        </View>

        <Text style={styles.sectionTitle}>Thanh toán</Text>
        <View style={styles.card}>
          {(
            [
              { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: 'cash-outline' },
              { value: 'ONLINE', label: 'VietQR qua payOS', icon: 'qr-code-outline' },
            ] as Array<{ value: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }>
          ).map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.payOption, paymentMethod === m.value && styles.payOptionActive]}
              onPress={() => setPaymentMethod(m.value)}
            >
              <Ionicons name={m.icon} size={20}
                color={paymentMethod === m.value ? colors.primary : colors.textSecondary} />
              <Text style={[styles.payLabel, paymentMethod === m.value && { color: colors.primaryDark, fontWeight: '700' }]}>
                {m.label}
              </Text>
              <Ionicons
                name={paymentMethod === m.value ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentMethod === m.value ? colors.primary : colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mã giảm giá</Text>
        <View style={styles.card}>
          <View style={styles.voucherRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={voucherCode}
              onChangeText={setVoucherCode}
              placeholder="Nhập mã voucher"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={applyVoucher} disabled={validating}>
              {validating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyText}>Áp dụng</Text>}
            </TouchableOpacity>
          </View>
          {appliedVoucher && (
            <Text style={styles.voucherOk}>
              Đã áp dụng {appliedVoucher.code}: -{formatPrice(appliedVoucher.discountTotal)}
            </Text>
          )}
          {voucherError ? <Text style={styles.voucherErr}>{voucherError}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
        <View style={styles.card}>
          {items.map((item) => (
            <View key={item._id} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>
                {item.book.title} x{item.quantity}
              </Text>
              <Text style={styles.summaryValue}>
                {formatPrice((item.book.discountPrice ?? item.book.price) * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          {discountTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-{formatPrice(discountTotal)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>{formatPrice(SHIPPING_FEE)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Xác nhận đặt hàng</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8, marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 4,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginVertical: 3,
  },
  payOptionActive: { borderColor: colors.primary, backgroundColor: '#E8F1E9' },
  payLabel: { flex: 1, fontSize: 13, color: colors.text },
  voucherRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  voucherOk: { fontSize: 12, color: colors.success, fontWeight: '600' },
  voucherErr: { fontSize: 12, color: colors.error },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  summaryItem: { flex: 1, fontSize: 13, color: colors.textSecondary },
  summaryLabel: { fontSize: 13, color: colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },
  error: { color: colors.error, fontSize: 13, marginTop: 12 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
