import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { orderApi } from '../api';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme/colors';
import { IOrder, OrderStatus } from '../types/models';
import { formatDate, formatPrice, ORDER_STATUS_LABELS } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: colors.warning,
  confirmed: '#2563EB',
  shipping: '#7C3AED',
  delivered: colors.success,
  cancelled: colors.error,
};

export default function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setOrders(await orderApi.getMyOrders());
    } catch {
      // giữ danh sách cũ, kéo xuống để thử lại
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={48} color={colors.textPlaceholder} />
        <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.safe}
      data={orders}
      keyExtractor={(o) => o._id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
        >
          <View style={styles.headerRow}>
            <Text style={styles.orderCode}>#{item.orderCode}</Text>
            <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.orderStatus] }]}>
              <Text style={styles.statusText}>{ORDER_STATUS_LABELS[item.orderStatus]}</Text>
            </View>
          </View>
          <Text style={styles.itemsPreview} numberOfLines={1}>
            {item.items.map((i) => `${i.title} x${i.quantity}`).join(', ')}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.total}>{formatPrice(item.total)}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background, gap: 12,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCode: { fontSize: 14, fontWeight: '800', color: colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  itemsPreview: { fontSize: 12, color: colors.textSecondary },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: colors.textPlaceholder },
  total: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
