import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import Modal from './ui/Modal';
import { rewardApi } from '../api/rewardApi';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';
import type { IRewardStatus } from '../types';

const PROMPTED_KEY = 'greenleaf_reward_prompted';

export default function DailyRewardModal() {
  const { user, applyUser } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<IRewardStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    rewardApi
      .getStatus()
      .then((s) => {
        setStatus(s);
        if (s.canClaim && sessionStorage.getItem(PROMPTED_KEY) !== s.today) {
          setOpen(true);
        }
      })
      .catch(() => {
        // Popup chỉ là best-effort — lỗi thì bỏ qua
      });
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    if (status) sessionStorage.setItem(PROMPTED_KEY, status.today);
    setOpen(false);
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await rewardApi.claim();
      applyUser(res.user);
      showToast(`Bạn đã nhận ${res.rewardPoints} điểm thưởng!`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể nhận thưởng.'), 'error');
    } finally {
      setClaiming(false);
      dismiss();
    }
  };

  if (!user || !status) return null;

  return (
    <Modal open={open} onClose={dismiss} title="Điểm danh hàng ngày">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <p className="text-2xl font-heading font-bold text-primary">+{status.rewardPoints} điểm</p>
        <p className="text-sm text-text-secondary">
          Điểm danh hôm nay để nhận điểm thưởng. Xem lịch sử tại{' '}
          <Link to="/rewards" className="text-primary hover:underline" onClick={dismiss}>
            trang điểm thưởng
          </Link>
          .
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" className="btn-ghost flex-1" onClick={dismiss}>
          Để sau
        </button>
        <button
          type="button"
          className="btn-primary flex-1 disabled:opacity-50"
          disabled={claiming}
          onClick={() => void handleClaim()}
        >
          {claiming ? 'Đang nhận...' : 'Nhận thưởng'}
        </button>
      </div>
    </Modal>
  );
}
