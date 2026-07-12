import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { rewardApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius } from '../theme/colors';
import { IRewardHistoryItem, IRewardStatus } from '../types/models';
import { formatDate, formatPrice, REWARD_REASON_LABELS } from '../utils/format';

// Đồng bộ với client/src/pages/RewardsPage.tsx
const REDEEM_MIN_POINTS = 100;
const REDEEM_STEP = 100;
const POINTS_TO_VND_RATE = 100;

export default function RewardsScreen() {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<IRewardStatus | null>(null);
  const [history, setHistory] = useState<IRewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(REDEEM_MIN_POINTS);
  const [redeeming, setRedeeming] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([rewardApi.getStatus(), rewardApi.getHistory()]);
      setStatus(s);
      setHistory(h);
    } catch {
      // pull-to-refresh bằng cách rời màn hình và quay lại
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await rewardApi.claim();
      setUser(res.user);
      await fetchData();
      Alert.alert('Đã điểm danh', `+${res.rewardPoints} điểm thưởng hôm nay`);
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không nhận được thưởng'));
    } finally {
      setClaiming(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await rewardApi.redeem(redeemPoints);
      setUser(res.user);
      await fetchData();
      Alert.alert(
        'Đổi voucher thành công',
        `Mã voucher của bạn: ${res.voucher.code}\nGiá trị: ${formatPrice(res.voucher.value)}\nDùng được ngay ở bước đặt hàng.`
      );
    } catch (err) {
      Alert.alert('Lỗi', getApiErrorMessage(err, 'Không đổi được voucher'));
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentPoints = user?.points ?? 0;
  const canRedeem = currentPoints >= redeemPoints;

  return (
    <FlatList
      style={styles.safe}
      data={history}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 12 }}>
          <View style={styles.pointsCard}>
            <Ionicons name="leaf" size={28} color="#fff" />
            <Text style={styles.pointsValue}>{currentPoints}</Text>
            <Text style={styles.pointsLabel}>điểm thưởng hiện có</Text>
            {status?.canClaim ? (
              <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} disabled={claiming}>
                {claiming
                  ? <ActivityIndicator color={colors.primaryDark} size="small" />
                  : <Text style={styles.claimText}>Điểm danh hôm nay +{status.rewardPoints}</Text>}
              </TouchableOpacity>
            ) : (
              <View style={styles.claimedPill}>
                <Ionicons name="checkmark-circle" size={15} color="#fff" />
                <Text style={styles.claimedText}>Hôm nay đã điểm danh</Text>
              </View>
            )}
          </View>

          <View style={styles.redeemCard}>
            <Text style={styles.sectionTitle}>Đổi điểm lấy voucher</Text>
            <Text style={styles.redeemHint}>
              {REDEEM_MIN_POINTS} điểm = voucher {formatPrice(REDEEM_MIN_POINTS * POINTS_TO_VND_RATE)}
            </Text>
            <View style={styles.redeemRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setRedeemPoints((p) => Math.max(REDEEM_MIN_POINTS, p - REDEEM_STEP))}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.redeemValueBox}>
                <Text style={styles.redeemValue}>{redeemPoints} điểm</Text>
                <Text style={styles.redeemEquals}>= {formatPrice(redeemPoints * POINTS_TO_VND_RATE)}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setRedeemPoints((p) => p + REDEEM_STEP)}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.redeemBtn, (!canRedeem || redeeming) && styles.redeemBtnDisabled]}
              onPress={handleRedeem}
              disabled={!canRedeem || redeeming}
            >
              {redeeming
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.redeemBtnText}>
                    {canRedeem ? 'Đổi voucher' : 'Không đủ điểm'}
                  </Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Lịch sử điểm</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>Chưa có giao dịch điểm nào</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.historyItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyReason}>{REWARD_REASON_LABELS[item.reason] ?? item.reason}</Text>
            <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.historyPoints, { color: item.points >= 0 ? colors.primary : colors.error }]}>
              {item.points >= 0 ? '+' : ''}{item.points}
            </Text>
            {item.balanceAfter != null && (
              <Text style={styles.historyBalance}>Số dư: {item.balanceAfter}</Text>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  pointsCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  pointsValue: { fontSize: 40, fontWeight: '800', color: '#fff' },
  pointsLabel: { fontSize: 13, color: '#D9EAD9' },
  claimBtn: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 10,
  },
  claimText: { color: colors.primaryDark, fontWeight: '800', fontSize: 13 },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  claimedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  redeemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  redeemHint: { fontSize: 12, color: colors.textSecondary },
  redeemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  stepBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    backgroundColor: colors.background,
  },
  redeemValueBox: { alignItems: 'center', minWidth: 120 },
  redeemValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  redeemEquals: { fontSize: 12, color: colors.textSecondary },
  redeemBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnDisabled: { backgroundColor: colors.disabled },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  historyReason: { fontSize: 13, fontWeight: '700', color: colors.text },
  historyDate: { fontSize: 11, color: colors.textPlaceholder },
  historyPoints: { fontSize: 15, fontWeight: '800' },
  historyBalance: { fontSize: 11, color: colors.textSecondary },
});
