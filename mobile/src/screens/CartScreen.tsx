import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { getApiErrorMessage, resolveImageUrl } from '../api/client';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { cart, refreshCart, updateItem, removeItem } = useCart();
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshCart().catch(() => {});
    }, [])
  );

  const changeQuantity = async (itemId: string, quantity: number) => {
    setBusyItemId(itemId);
    try {
      if (quantity <= 0) {
        await removeItem(itemId);
      } else {
        await updateItem(itemId, quantity);
      }
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không cập nhật được giỏ hàng'));
    } finally {
      setBusyItemId(null);
    }
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.book.discountPrice ?? item.book.price) * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={48} color={colors.textPlaceholder} />
        <Text style={styles.emptyText}>Giỏ hàng đang trống</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        >
          <Text style={styles.shopBtnText}>Tiếp tục mua sắm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
        renderItem={({ item }) => {
          const price = item.book.discountPrice ?? item.book.price;
          return (
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => navigation.navigate('BookDetail', { slug: item.book.slug })}
              >
                <Image source={{ uri: resolveImageUrl(item.book.images[0]) }} style={styles.thumb} />
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title} numberOfLines={2}>{item.book.title}</Text>
                <Text style={styles.price}>{formatPrice(price)}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    disabled={busyItemId === item._id}
                    onPress={() => changeQuantity(item._id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    disabled={busyItemId === item._id || item.quantity >= item.book.stockQuantity}
                    onPress={() => changeQuantity(item._id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                  {busyItemId === item._id && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
              </View>
              <View style={styles.rightCol}>
                <TouchableOpacity onPress={() => changeQuantity(item._id, 0)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
                <Text style={styles.lineTotal}>{formatPrice(price * item.quantity)}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Tạm tính</Text>
          <Text style={styles.footerValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Text style={styles.footerHint}>Phí ship và voucher tính ở bước đặt hàng</Text>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, gap: 12, padding: 24,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.text },
  shopBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: radius.md,
  },
  shopBtnText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 10,
  },
  thumb: { width: 56, height: 74, borderRadius: 8, backgroundColor: colors.background },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 6,
    backgroundColor: colors.background,
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
  rightCol: { justifyContent: 'space-between', alignItems: 'flex-end' },
  lineTotal: { fontSize: 13, fontWeight: '700', color: colors.text },
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    gap: 6,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 14, color: colors.textSecondary },
  footerValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  footerHint: { fontSize: 11, color: colors.textPlaceholder },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
