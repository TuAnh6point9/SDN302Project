import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gift } from 'lucide-react-native';
import { rewardApi } from '../api';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IRewardHistoryItem } from '../types/models';
import { formatDate } from '../utils/format';

export default function AdminRewardHistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState<IRewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setHistory(await rewardApi.getAdminHistory(100));
    } catch {
      Alert.alert('Lỗi', 'Không tải được lịch sử điểm thưởng hệ thống');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Lịch sử Điểm thưởng',
      headerStyle: { backgroundColor: colors.surface },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.h3, fontSize: 16, fontWeight: '700' },
      headerTintColor: colors.primary,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getReasonLabel = (reason: string) => {
    if (reason === 'purchase') return 'Tích điểm mua hàng';
    if (reason === 'daily_login') return 'Điểm danh hàng ngày';
    if (reason === 'review') return 'Viết đánh giá sách';
    if (reason === 'redeem_voucher') return 'Đổi voucher giảm giá';
    if (reason === 'claimed_voucher') return 'Nhận voucher sự kiện';
    return reason;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Chưa có lịch sử giao dịch nào</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isNegative = item.points < 0;
          return (
            <View style={styles.historyCard}>
              <View style={[styles.iconWrap, { backgroundColor: isNegative ? '#FFEBEE' : '#E8F5E9' }]}>
                <Gift size={20} color={isNegative ? colors.error : colors.primary} />
              </View>
              <View style={styles.historyMain}>
                <Text style={styles.reasonText}>{getReasonLabel(item.reason)}</Text>
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={[styles.pointsText, isNegative ? styles.pointsNegative : styles.pointsPositive]}>
                {isNegative ? '' : '+'}{item.points}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.md, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyMain: { flex: 1, gap: 2 },
  reasonText: { ...typography.body, fontWeight: '700', fontSize: 13, color: colors.text },
  dateText: { fontSize: 10, color: colors.textPlaceholder },
  pointsText: { ...typography.h2, fontSize: 15 },
  pointsPositive: { color: colors.primary },
  pointsNegative: { color: colors.error },
});
