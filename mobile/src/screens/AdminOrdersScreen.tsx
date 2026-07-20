import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageOpen, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderApi } from '../api';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IOrder, OrderStatus } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: colors.warning,
  confirmed: '#2563EB',
  shipping: '#7C3AED',
  delivered: colors.success,
  cancelled: colors.error,
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_TABS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ XN', value: 'pending' },
  { label: 'Xác nhận', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã huỷ', value: 'cancelled' },
];

export default function AdminOrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setOrders(await orderApi.getAllOrders());
    } catch {
      // Keep old list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Quản lý Đơn hàng',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.orderStatus === activeTab;
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
      {/* Tabs Filter */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
          renderItem={({ item }) => {
            const isActive = activeTab === item.value;
            return (
              <TouchableOpacity
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(item.value)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PackageOpen size={48} color={colors.textPlaceholder} />
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('AdminOrderDetail', { orderId: item._id })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderCode}>{item.orderCode}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.orderStatus]}15` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.orderStatus] }]}>
                  {ORDER_STATUS_LABELS[item.orderStatus]}
                </Text>
              </View>
            </View>

            <View style={styles.orderBody}>
              <Text style={styles.metaText}>Khách hàng: {item.shippingAddress.recipientName}</Text>
              <Text style={styles.metaText}>Ngày đặt: {formatDate(item.createdAt)}</Text>
              <Text style={styles.metaText}>Thanh toán: {item.paymentMethod}</Text>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
              <ChevronRight size={16} color={colors.textSecondary} style={styles.chevron} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderBody: {
    gap: 2,
    paddingVertical: spacing.xs,
  },
  metaText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  totalValue: {
    ...typography.h2,
    fontSize: 15,
    color: colors.primary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});
