import { useEffect, useState } from 'react';
import { Coins, Gift, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { rewardApi } from '../../api/rewardApi';
import type { IRewardHistoryItem, IRewardSummary, RewardReason } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const reasonLabels: Record<RewardReason, string> = {
  daily_login: 'Điểm danh hàng ngày',
  purchase: 'Thưởng mua hàng',
  review: 'Thưởng đánh giá',
  redeem_voucher: 'Đổi voucher',
  claimed_voucher: 'Nhận voucher bằng mã',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function RewardDashboardPage() {
  const [summary, setSummary] = useState<IRewardSummary | null>(null);
  const [history, setHistory] = useState<IRewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([rewardApi.getAdminSummary(), rewardApi.getAdminHistory(50)])
      .then(([summaryData, historyData]) => {
        setSummary(summaryData);
        setHistory(historyData.history);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Không thể tải dữ liệu điểm thưởng.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-sm text-text-secondary">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading text-text">Điểm thưởng</h2>
        <p className="text-xs text-text-secondary">Tổng quan hệ thống điểm thưởng toàn hệ thống</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Tổng điểm đã phát</p>
            <p className="text-xl font-heading font-bold text-text">{summary?.totalIssued ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Tổng điểm đã đổi</p>
            <p className="text-xl font-heading font-bold text-text">{summary?.totalRedeemed ?? 0}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Điểm đang lưu hành</p>
            <p className="text-xl font-heading font-bold text-text">
              {(summary?.totalIssued ?? 0) - (summary?.totalRedeemed ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-150 font-heading font-bold text-sm text-text">
            Theo loại thưởng
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-secondary text-xs uppercase tracking-wider">
                <th className="px-5 py-3">Loại</th>
                <th className="px-5 py-3">Số lượt</th>
                <th className="px-5 py-3 text-right">Tổng điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {(summary?.byReason ?? []).map((r) => (
                <tr key={r.reason}>
                  <td className="px-5 py-3">{reasonLabels[r.reason]}</td>
                  <td className="px-5 py-3">{r.count}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${r.totalPoints >= 0 ? 'text-primary' : 'text-red-600'}`}>
                    {r.totalPoints >= 0 ? '+' : ''}{r.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-150 font-heading font-bold text-sm text-text flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Top người dùng nhiều điểm nhất
          </div>
          {(summary?.topHolders.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-text-secondary">Chưa có dữ liệu.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-150">
                {summary?.topHolders.map((holder) => (
                  <tr key={holder._id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{holder.name}</p>
                      <p className="text-xs text-text-secondary">{holder.email}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{holder.points} điểm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-150 font-heading font-bold text-sm text-text">
          Hoạt động gần đây
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm text-text-secondary">Chưa có hoạt động nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-text-secondary text-xs uppercase tracking-wider border-b border-gray-150">
                  <th className="px-5 py-3">Người dùng</th>
                  <th className="px-5 py-3">Loại</th>
                  <th className="px-5 py-3 text-right">Điểm</th>
                  <th className="px-5 py-3 text-right">Số dư sau</th>
                  <th className="px-5 py-3 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {history.map((item) => {
                  const userInfo = typeof item.user === 'object' ? item.user : null;
                  return (
                    <tr key={item._id}>
                      <td className="px-5 py-3">
                        {userInfo ? (
                          <>
                            <p className="font-medium text-text">{userInfo.name}</p>
                            <p className="text-xs text-text-secondary">{userInfo.email}</p>
                          </>
                        ) : (
                          <span className="text-text-secondary">{String(item.user)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">{reasonLabels[item.reason]}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${item.points >= 0 ? 'text-primary' : 'text-red-600'}`}>
                        {item.points >= 0 ? '+' : ''}{item.points}
                      </td>
                      <td className="px-5 py-3 text-right text-text-secondary">{item.balanceAfter ?? '-'}</td>
                      <td className="px-5 py-3 text-right text-text-secondary whitespace-nowrap">{formatDate(item.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
