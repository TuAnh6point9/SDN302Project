import { useFocusEffect } from '@react-navigation/native';
import { Leaf, Info } from 'lucide-react-native';
import React, { useCallback, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rewardApi } from '../api';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { IRewardHistoryItem, IVoucher } from '../types/models';
import { formatDate, formatPrice } from '../utils/format';

const REDEEM_POINTS = 1000;

const getVoucherStatus = (voucher: IVoucher) => {
  if ((voucher.usedCount ?? 0) >= (voucher.usageLimit ?? 1)) {
    return { label: 'Đã dùng', color: colors.textSecondary, backgroundColor: colors.divider };
  }
  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
    return { label: 'Hết hạn', color: colors.error, backgroundColor: '#FDECEC' };
  }
  return { label: 'Còn hạn', color: colors.primary, backgroundColor: colors.primaryLight };
};

export default function RewardsScreen() {
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState<IRewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [claimingCode, setClaimingCode] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  const flatListRef = useRef<FlatList>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setHistory(await rewardApi.getHistory());
    } catch {
      // Keep old list
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Tab navigator không unmount màn hình — xóa thông báo cũ mỗi lần quay lại
      setRedeemError('');
      setRedeemSuccess('');
      setClaimError('');
      setClaimSuccess('');
      Promise.all([fetchHistory(), refreshUser()]).finally(() => setLoading(false));
    }, [fetchHistory, refreshUser])
  );

  const handleRedeem = async () => {
    setRedeemError('');
    setRedeemSuccess('');
    if ((user?.points ?? 0) < REDEEM_POINTS) {
      setRedeemError('Bạn chưa đủ điểm để đổi voucher này');
      return;
    }
    setRedeeming(true);
    try {
      const res = await rewardApi.redeem(REDEEM_POINTS);
      setRedeemSuccess(`Đổi thành công voucher ${res.voucher.code} — lưu lại mã này ngay, mã chỉ hiển thị 1 lần!`);
      await Promise.all([fetchHistory(), refreshUser()]);
    } catch (err) {
      setRedeemError(getApiErrorMessage(err, 'Không đổi được điểm'));
    } finally {
      setRedeeming(false);
    }
  };

  const handleScrollToHistory = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleClaimVoucher = async () => {
    const code = claimCode.trim().toUpperCase();
    if (!code) return;
    setClaimingCode(true);
    setClaimError('');
    setClaimSuccess('');
    try {
      const res = await rewardApi.claimVoucher(code);
      setClaimCode('');
      setClaimSuccess(`Đã nhận voucher ${res.voucher.code}`);
      await fetchHistory();
    } catch (err) {
      setClaimError(getApiErrorMessage(err, 'Không nhận được voucher'));
    } finally {
      setClaimingCode(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    if (reason === 'purchase') return 'Thưởng mua hàng';
    if (reason === 'daily_login') return 'Điểm danh hàng ngày';
    if (reason === 'review') return 'Viết đánh giá';
    if (reason === 'redeem_voucher') return 'Đổi điểm lấy voucher';
    if (reason === 'claimed_voucher') return 'Nhận voucher bằng mã';
    return reason;
  };

  const myVouchers = history
    .filter(
      (item) =>
        (item.reason === 'redeem_voucher' || item.reason === 'claimed_voucher') &&
        item.refId &&
        typeof item.refId === 'object'
    )
    .map((item) => item.refId as IVoucher);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.heroCard}>
        <Leaf size={32} color={colors.surface} style={styles.heroIcon} />
        <Text style={styles.pointsText}>{user?.points ?? 0}</Text>
        <Text style={styles.pointsLabel}>điểm thưởng hiện có</Text>
        
        <TouchableOpacity style={styles.historyScrollBtn} onPress={handleScrollToHistory}>
          <Text style={styles.historyScrollText}>Lịch sử điểm</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Đổi điểm lấy voucher</Text>
      <Text style={styles.sectionSubtitle}>{REDEEM_POINTS} điểm = voucher {formatPrice(REDEEM_POINTS * 10)}</Text>

      <View style={styles.redeemCard}>
        <View style={styles.stepperValueCol}>
          <Text style={styles.redeemValText}>{REDEEM_POINTS}</Text>
          <Text style={styles.redeemCashText}>(- {formatPrice(REDEEM_POINTS * 10)})</Text>
        </View>

        <TouchableOpacity
          style={styles.redeemBtn}
          onPress={handleRedeem}
          disabled={redeeming}
        >
          {redeeming ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.redeemBtnText}>Đổi điểm</Text>
          )}
        </TouchableOpacity>
        {redeemError ? <Text style={styles.redeemError}>{redeemError}</Text> : null}
        {redeemSuccess ? <Text style={styles.redeemSuccess}>{redeemSuccess}</Text> : null}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Nhập mã voucher</Text>
      <Text style={styles.sectionSubtitle}>Lưu mã khuyến mãi công khai vào danh sách của bạn.</Text>
      <View style={styles.claimCard}>
        <View style={styles.claimRow}>
          <TextInput
            style={styles.claimInput}
            value={claimCode}
            onChangeText={(value) => setClaimCode(value.toUpperCase())}
            placeholder="Nhập mã voucher"
            placeholderTextColor={colors.textPlaceholder}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.claimBtn, (!claimCode.trim() || claimingCode) && styles.claimBtnDisabled]}
            onPress={handleClaimVoucher}
            disabled={!claimCode.trim() || claimingCode}
          >
            {claimingCode ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.claimBtnText}>Nhận</Text>
            )}
          </TouchableOpacity>
        </View>
        {claimError ? <Text style={styles.redeemError}>{claimError}</Text> : null}
        {claimSuccess ? <Text style={styles.redeemSuccess}>{claimSuccess}</Text> : null}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Voucher của tôi</Text>
      <View style={styles.vouchersCard}>
        {myVouchers.length === 0 ? (
          <Text style={styles.voucherEmpty}>Bạn chưa có voucher nào. Đổi điểm ở trên để nhận voucher đầu tiên.</Text>
        ) : (
          myVouchers.map((voucher) => {
            const status = getVoucherStatus(voucher);
            return (
              <View key={voucher._id} style={styles.voucherRow}>
                <View style={styles.voucherInfo}>
                  <Text style={styles.voucherCode}>{voucher.code}</Text>
                  <Text style={styles.voucherMeta}>
                    Giảm {formatPrice(voucher.value)}
                    {voucher.expiresAt ? `, HSD ${new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                  </Text>
                </View>
                <View style={[styles.voucherStatus, { backgroundColor: status.backgroundColor }]}>
                  <Text style={[styles.voucherStatusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Lịch sử điểm</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.navBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.navTitle}>Điểm thưởng</Text>
        <TouchableOpacity style={styles.infoBtn}>
          <Info size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={history}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Chưa có lịch sử điểm.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPositive = item.points > 0;
            return (
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyReason}>{getReasonLabel(item.reason)}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyPoints, { color: isPositive ? colors.primary : colors.error }]}>
                    {isPositive ? `+${item.points}` : item.points}
                  </Text>
                  {item.balanceAfter !== undefined && (
                    <Text style={styles.historyBalance}>Số dư: {item.balanceAfter}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  headerContainer: {
    paddingTop: spacing.xs,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  infoBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    marginBottom: spacing.sm,
  },
  pointsText: {
    ...typography.largeTitle,
    fontSize: 54,
    color: colors.surface,
    fontWeight: '800',
    lineHeight: 60,
  },
  pointsLabel: {
    ...typography.caption,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.md,
  },
  historyScrollBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  historyScrollText: {
    ...typography.h3,
    fontSize: 13,
    color: colors.surface,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  redeemCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  stepperValueCol: {
    alignItems: 'center',
  },
  redeemValText: {
    ...typography.h2,
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
  },
  redeemCashText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  redeemBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    ...typography.h3,
    fontSize: 16,
    color: colors.surface,
    fontWeight: '700',
  },
  redeemError: {
    ...typography.caption,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  redeemSuccess: {
    ...typography.caption,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  claimInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  claimBtn: {
    height: 48,
    minWidth: 78,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  claimBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  claimBtnText: {
    ...typography.h3,
    fontSize: 15,
    color: colors.surface,
    fontWeight: '700',
  },
  vouchersCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  voucherEmpty: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voucherInfo: {
    flex: 1,
    gap: 2,
  },
  voucherCode: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
    fontWeight: '800',
  },
  voucherMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  voucherStatus: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  voucherStatusText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    gap: 4,
    flex: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyReason: {
    ...typography.h3,
    fontSize: 15,
    color: colors.text,
  },
  historyDate: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyPoints: {
    ...typography.h2,
    fontSize: 16,
    fontWeight: '700',
  },
  historyBalance: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
