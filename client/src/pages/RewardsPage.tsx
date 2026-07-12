import { useCallback, useEffect, useState } from 'react';
import { Coins, Gift, TicketPercent } from 'lucide-react';
import { rewardApi } from '../api/rewardApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { IRewardHistoryItem, IRewardStatus, RewardReason } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const REDEEM_MIN_POINTS = 100;
const REDEEM_STEP = 100;
const POINTS_TO_VND_RATE = 100;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const reasonLabels: Record<RewardReason, string> = {
  daily_login: 'Điểm danh hàng ngày',
  purchase: 'Thưởng mua hàng',
  review: 'Thưởng đánh giá',
  redeem_voucher: 'Đổi voucher',
};

export default function RewardsPage() {
  const { user, applyUser } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<IRewardHistoryItem[]>([]);
  const [status, setStatus] = useState<IRewardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(REDEEM_MIN_POINTS);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [historyData, statusData] = await Promise.all([
        rewardApi.getHistory(),
        rewardApi.getStatus(),
      ]);
      setHistory(historyData.history);
      setStatus(statusData);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải lịch sử điểm thưởng.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleClaim = async () => {
    setClaiming(true);
    setError('');
    try {
      const res = await rewardApi.claim();
      applyUser(res.user);
      showToast(`Bạn đã nhận ${res.rewardPoints} điểm thưởng!`, 'success');
      await fetchData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể nhận thưởng.'), 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    setError('');
    try {
      const res = await rewardApi.redeem(redeemPoints);
      applyUser(res.user);
      showToast(`Đã đổi thành công mã voucher ${res.voucher.code}!`, 'success');
      await fetchData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể đổi điểm.'), 'error');
    } finally {
      setRedeeming(false);
    }
  };

  const currentPoints = user?.points ?? 0;
  const canRedeem = currentPoints >= redeemPoints;

  return (
    <div className="page-container py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text">Điểm thưởng</h1>
            <p className="text-sm text-text-secondary mt-1">
              Điểm danh, mua hàng, đánh giá sách để tích điểm — đổi điểm lấy voucher giảm giá.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Điểm hiện tại</p>
              <p className="text-2xl font-heading font-bold text-text">{currentPoints}</p>
            </div>
          </div>
          {status?.canClaim && (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              disabled={claiming}
              onClick={() => void handleClaim()}
            >
              <Gift className="w-4 h-4" />
              {claiming ? 'Đang nhận...' : `Nhận ${status.rewardPoints} điểm hôm nay`}
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 font-heading font-bold text-text">
            <TicketPercent className="w-5 h-5 text-primary" /> Đổi điểm lấy voucher
          </div>
          <p className="text-sm text-text-secondary">
            {REDEEM_STEP} điểm = {formatPrice(REDEEM_STEP * POINTS_TO_VND_RATE)} giá trị voucher. Tối thiểu {REDEEM_MIN_POINTS} điểm.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="number"
              min={REDEEM_MIN_POINTS}
              step={REDEEM_STEP}
              value={redeemPoints}
              onChange={(event) => setRedeemPoints(Number(event.target.value))}
              className="input-field !py-2 text-sm sm:w-40"
            />
            <span className="text-sm text-text-secondary">
              = {formatPrice(redeemPoints * POINTS_TO_VND_RATE)}
            </span>
            <button
              type="button"
              className="btn-primary !py-2.5 text-sm disabled:opacity-50 sm:ml-auto"
              disabled={redeeming || !canRedeem || redeemPoints < REDEEM_MIN_POINTS || redeemPoints % REDEEM_STEP !== 0}
              onClick={() => void handleRedeem()}
            >
              {redeeming ? 'Đang đổi...' : 'Đổi voucher'}
            </button>
          </div>
          {!canRedeem && (
            <p className="text-xs text-red-600">Bạn không đủ điểm để đổi mức này.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Đang tải lịch sử...</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Gift className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-text-secondary">Chưa có lịch sử nhận thưởng.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-150">
              {history.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-5 hover:bg-gray-50/70 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h2 className="font-semibold text-text">{reasonLabels[item.reason]}</h2>
                      <span className="text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className={`text-sm font-semibold ${item.points >= 0 ? 'text-primary' : 'text-red-600'}`}>
                        {item.points >= 0 ? '+' : ''}{item.points} điểm
                      </p>
                      {item.balanceAfter !== undefined && (
                        <span className="text-xs text-text-secondary">Số dư: {item.balanceAfter}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
