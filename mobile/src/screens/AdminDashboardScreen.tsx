import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  DollarSign,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookApi, orderApi, statsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IBook, IOrder, IAdminOverview } from '../types/models';
import { formatPrice } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();
  const [books, setBooks] = useState<IBook[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [overview, setOverview] = useState<IAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bookResponse, orderResponse, statsResponse] = await Promise.all([
        bookApi.getBooks({ limit: 100, sort: 'newest' }),
        orderApi.getAllOrders(),
        statsApi.getAdminOverview(),
      ]);
      setBooks(bookResponse.books);
      setOrders(orderResponse);
      setOverview(statsResponse);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản quản trị?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter((order) => order.orderStatus === 'delivered');
    const pendingOrders = orders.filter((order) => order.orderStatus === 'pending');
    const lowStockBooks = books.filter((book) => book.stockQuantity > 0 && book.stockQuantity <= 5);
    const outOfStockBooks = books.filter((book) => book.stockQuantity === 0);

    return {
      revenue: deliveredOrders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: pendingOrders.length,
      totalBooks: books.length,
      lowStockBooks,
      outOfStockBooks,
      featuredBooks: books.filter((book) => book.isFeatured).length,
      customers: overview?.totals?.customers ?? 0,
    };
  }, [books, orders, overview]);

  // Max revenue in 14 days to scale the custom vertical bar chart
  const maxDayRevenue = useMemo(() => {
    if (!overview?.revenueByDay || overview.revenueByDay.length === 0) return 1;
    return Math.max(...overview.revenueByDay.map((d) => d.revenue), 1);
  }, [overview]);

  // Max book quantity sold to scale the top books progress bars
  const maxBookQuantity = useMemo(() => {
    if (!overview?.topBooks || overview.topBooks.length === 0) return 1;
    return Math.max(...overview.topBooks.map((b) => b.quantity), 1);
  }, [overview]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu hệ thống...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GreenLeaf Admin</Text>
        <TouchableOpacity
          style={styles.storeBtn}
          onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        >
          <Ionicons name="storefront-outline" size={22} color={colors.primary} />
          <Text style={styles.storeText}>Cửa hàng</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.titleSection}>
          <Text style={styles.welcomeTitle}>Tổng quan hệ thống</Text>
          <Text style={styles.welcomeSub}>Theo dõi nhanh sách, đơn hàng và tồn kho</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: '#E8F5E9' }]}>
              <DollarSign size={20} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>Doanh thu đã giao</Text>
            <Text style={styles.statValue}>{formatPrice(stats.revenue)}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: '#FFF8E1' }]}>
              <ClipboardList size={20} color="#FFB300" />
            </View>
            <Text style={styles.statLabel}>Đơn chờ xác nhận</Text>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: '#E3F2FD' }]}>
              <BookOpen size={20} color="#1E88E5" />
            </View>
            <Text style={styles.statLabel}>Số đầu sách</Text>
            <Text style={styles.statValue}>{stats.totalBooks}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: '#EDE7F6' }]}>
              <Users size={20} color="#5E35B1" />
            </View>
            <Text style={styles.statLabel}>Khách hàng</Text>
            <Text style={styles.statValue}>{stats.customers}</Text>
          </View>
        </View>

        {/* Menu Quản Trị */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Chức năng quản trị</Text>
          <View style={styles.menuGridContainer}>
            <View style={styles.menuGridRow}>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminOrders')}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                <Text style={styles.menuGridLabel}>Đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminInventory')}>
                <Ionicons name="cube-outline" size={20} color="#1E88E5" />
                <Text style={styles.menuGridLabel}>Tồn kho</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminVouchers')}>
                <Ionicons name="pricetag-outline" size={20} color="#FFB300" />
                <Text style={styles.menuGridLabel}>Voucher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminBooks')}>
                <Ionicons name="book-outline" size={20} color="#7C3AED" />
                <Text style={styles.menuGridLabel}>Sách</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.menuGridRow}>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminCategories')}>
                <Ionicons name="folder-open-outline" size={20} color="#E65100" />
                <Text style={styles.menuGridLabel}>Danh mục</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminUsers')}>
                <Ionicons name="people-outline" size={20} color="#00ACC1" />
                <Text style={styles.menuGridLabel}>Thành viên</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminReviews')}>
                <Ionicons name="star-outline" size={20} color="#D81B60" />
                <Text style={styles.menuGridLabel}>Đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuGridItem} onPress={() => navigation.navigate('AdminRewardHistory')}>
                <Ionicons name="gift-outline" size={20} color="#43A047" />
                <Text style={styles.menuGridLabel}>Lịch sử điểm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 14 Days Revenue Custom Chart */}
        {overview && overview.revenueByDay && overview.revenueByDay.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Doanh thu 14 ngày qua (đơn đã giao)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              <View style={styles.chartContainer}>
                {overview.revenueByDay.map((dayData, index) => {
                  const barHeight = Math.max((dayData.revenue / maxDayRevenue) * 140, 4);
                  const dateLabel = dayData.day.split('-').slice(1).reverse().join('/');
                  return (
                    <View key={dayData.day} style={styles.chartBarCol}>
                      <View style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, { height: barHeight }]} />
                      </View>
                      <Text style={styles.chartBarLabel}>{dateLabel}</Text>
                      <Text style={styles.chartBarValue}>{formatPrice(dayData.revenue)}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Top 5 Books sold */}
        {overview && overview.topBooks && overview.topBooks.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#FFB300" />
              <Text style={styles.sectionTitle}>Top 5 sách bán chạy nhất</Text>
            </View>
            <View style={styles.topBooksContainer}>
              {overview.topBooks.map((book, index) => {
                const percentage = Math.max((book.quantity / maxBookQuantity) * 100, 5);
                return (
                  <View key={book.title} style={styles.topBookRow}>
                    <View style={styles.topBookMeta}>
                      <Text style={styles.topBookRank}>{index + 1}</Text>
                      <Text style={styles.topBookTitle} numberOfLines={1}>
                        {book.title}
                      </Text>
                      <Text style={styles.topBookQty}>{book.quantity} cuốn</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sắp hết hàng / Hết hàng grid */}
        <View style={styles.stockSection}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#E65100" />
              <Text style={styles.sectionTitle}>Sắp hết hàng</Text>
            </View>
            {stats.lowStockBooks.length === 0 ? (
              <Text style={styles.emptyStockText}>Không có sách nào sắp hết hàng.</Text>
            ) : (
              <View style={styles.stockList}>
                {stats.lowStockBooks.slice(0, 8).map((book) => (
                  <View key={book._id} style={styles.stockRow}>
                    <Text style={styles.stockBookName} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text style={[styles.stockBadge, { color: '#E65100', backgroundColor: '#FFF3E0' }]}>
                      {book.stockQuantity} cuốn
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={styles.sectionTitle}>Hết hàng</Text>
            </View>
            {stats.outOfStockBooks.length === 0 ? (
              <Text style={styles.emptyStockText}>Không có sách nào hết hàng.</Text>
            ) : (
              <View style={styles.stockList}>
                {stats.outOfStockBooks.slice(0, 8).map((book) => (
                  <View key={book._id} style={styles.stockRow}>
                    <Text style={styles.stockBookName} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text style={[styles.stockBadge, { color: colors.error, backgroundColor: '#FFEBEE' }]}>
                      0 cuốn
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 },
  loadingText: { ...typography.body, color: colors.textSecondary },
  headerBar: {
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    ...typography.body,
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  titleSection: {
    marginBottom: spacing.xs,
  },
  welcomeTitle: {
    ...typography.h1,
    fontSize: 22,
    color: colors.text,
  },
  welcomeSub: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
  chartScroll: {
    paddingVertical: spacing.xs,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    gap: 16,
  },
  chartBarCol: {
    alignItems: 'center',
    width: 48,
    gap: 4,
  },
  chartBarWrapper: {
    height: 140,
    justifyContent: 'flex-end',
    width: 14,
  },
  chartBar: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    width: '100%',
  },
  chartBarLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chartBarValue: {
    fontSize: 8,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  topBooksContainer: {
    gap: spacing.md,
  },
  topBookRow: {
    gap: spacing.xs,
  },
  topBookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBookRank: {
    ...typography.h3,
    fontSize: 13,
    color: colors.primary,
    width: 18,
  },
  topBookTitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  topBookQty: {
    ...typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#ECEFF1',
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stockSection: {
    gap: spacing.md,
  },
  emptyStockText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stockList: {
    gap: spacing.sm,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  stockBookName: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  stockBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  menuGridContainer: {
    gap: 8,
    marginTop: 8,
  },
  menuGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  menuGridItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  menuGridLabel: {
    ...typography.body,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
});
