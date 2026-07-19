import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Minus, Plus, ShoppingBag, Ticket, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiErrorMessage, resolveImageUrl } from '../api/client';
import GreenButton from '../components/GreenButton';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
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

  const shipping = items.length > 0 ? 30000 : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.emptyIconWrap}>
          <ShoppingBag size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySubText}>Looks like you haven't added any books yet.</Text>
        <GreenButton
          title="Explore Books"
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
          style={{ marginTop: spacing.md, width: 200 }}
        />
      </SafeAreaView>
    );
  }

  const renderFooter = () => (
    <View style={styles.listFooter}>
      <TouchableOpacity style={styles.voucherCard}>
        <View style={styles.voucherLeft}>
          <Ticket size={24} color={colors.primary} />
          <Text style={styles.voucherText}>Apply Voucher</Text>
        </View>
        <Text style={styles.voucherSelect}>Select</Text>
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>{formatPrice(shipping)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => {
          const price = item.book.discountPrice ?? item.book.price;
          return (
            <View style={styles.productCard}>
              <TouchableOpacity onPress={() => navigation.navigate('BookDetail', { slug: item.book.slug })}>
                <Image source={{ uri: resolveImageUrl(item.book.images[0]) }} style={styles.thumb} />
              </TouchableOpacity>
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <Text style={styles.title} numberOfLines={2}>{item.book.title}</Text>
                  <TouchableOpacity onPress={() => changeQuantity(item._id, 0)} style={styles.deleteBtn}>
                    <Trash2 size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.price}>{formatPrice(price)}</Text>
                
                <View style={styles.qtyRow}>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      disabled={busyItemId === item._id}
                      onPress={() => changeQuantity(item._id, item.quantity - 1)}
                    >
                      <Minus size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      disabled={busyItemId === item._id || item.quantity >= item.book.stockQuantity}
                      onPress={() => changeQuantity(item._id, item.quantity + 1)}
                    >
                      <Plus size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {busyItemId === item._id && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.stickyFooter}>
        <View style={styles.stickyTotalRow}>
          <Text style={styles.stickyTotalLabel}>Total</Text>
          <Text style={styles.stickyTotalValue}>{formatPrice(total)}</Text>
        </View>
        <GreenButton
          title="Checkout"
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, gap: 12, padding: 24,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: { ...typography.h2, color: colors.text },
  emptySubText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120, // space for sticky footer
  },
  productCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumb: { width: 80, height: 110, borderRadius: radius.md, backgroundColor: colors.background },
  productInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xs },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...typography.h3, fontSize: 15, flex: 1, marginRight: spacing.sm },
  deleteBtn: { padding: spacing.xs },
  price: { ...typography.h2, fontSize: 16, color: colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    height: 36,
  },
  qtyBtn: { padding: spacing.sm },
  qtyText: { ...typography.h3, fontSize: 14, minWidth: 24, textAlign: 'center' },
  listFooter: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  voucherLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voucherText: { ...typography.h3, fontSize: 15, color: colors.primary },
  voucherSelect: { ...typography.body, color: colors.primary, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: { ...typography.h2, fontSize: 18, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  summaryTotalLabel: { ...typography.h3, fontSize: 16 },
  summaryTotalValue: { ...typography.h2, fontSize: 18, color: colors.primary },
  stickyFooter: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
    gap: spacing.md,
  },
  stickyTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stickyTotalLabel: { ...typography.body, color: colors.textSecondary },
  stickyTotalValue: { ...typography.h1, fontSize: 24, color: colors.primary },
});
