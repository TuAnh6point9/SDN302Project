import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageOpen, ChevronRight, Clock } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderApi } from '../api';
import GreenButton from '../components/GreenButton';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
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

const ORDER_STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 0.2,
  confirmed: 0.5,
  shipping: 0.8,
  delivered: 1,
  cancelled: 1,
};

type FilterType = 'all' | 'pending' | 'delivered';

export default function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setOrders(await orderApi.getMyOrders());
    } catch {
      // Keep old list, pull to refresh
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

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'confirmed', 'shipping'].includes(o.orderStatus);
    if (filter === 'delivered') return o.orderStatus === 'delivered';
    return true;
  });

  // Custom Mockup Header
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Đơn hàng',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 18, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  if (loading) {
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

  const getFilterLabel = (f: FilterType) => {
    if (f === 'all') return 'Tất cả';
    if (f === 'pending') return 'Chờ xử lý';
    if (f === 'delivered') return 'Đã giao';
    return f;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Filter Row */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'pending', 'delivered'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(o) => o._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconWrap}>
              <PackageOpen size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào</Text>
            <Text style={styles.emptySubText}>Bạn chưa thực hiện giao dịch nào.</Text>
            <GreenButton
              title="Mua sắm ngay"
              onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
              style={{ marginTop: spacing.lg, width: 200 }}
            />
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.orderStatus];
          const itemsText = item.items.map(i => `${i.title} x${i.quantity}`).join(', ');

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
            >
              {/* Header: Code & Solid status badge */}
              <View style={styles.cardHeader}>
                <Text style={styles.orderCode}>#{item.orderCode}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.orderStatus)}</Text>
                </View>
              </View>

              {/* Subheader: Date */}
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

              {/* Content Row: Description & Amount */}
              <View style={styles.cardBody}>
                <Text style={styles.itemsPreviewText} numberOfLines={1}>
                  {itemsText}
                </Text>
                <Text style={styles.totalPriceText}>{formatPrice(item.total)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  filterWrap: { 
    paddingVertical: spacing.md, 
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { ...typography.h3, fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: colors.surface },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  emptyWrap: { alignItems: 'center', marginTop: spacing.xxl },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { ...typography.h2, marginBottom: spacing.xs },
  emptySubText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCode: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
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
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemsPreviewText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  totalPriceText: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
});
