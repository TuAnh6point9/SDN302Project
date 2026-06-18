import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../api/notificationApi';
import type { INotification } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải thông báo.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchNotifications);
  }, [fetchNotifications]);

  const handleMarkRead = async () => {
    setError('');
    try {
      await notificationApi.markRead();
      await fetchNotifications();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể đánh dấu đã đọc.'));
    }
  };

  return (
    <div className="page-container py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text">Thông báo</h1>
            <p className="text-sm text-text-secondary mt-1">
              Theo dõi cập nhật đơn hàng, thanh toán và hệ thống.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkRead}
            disabled={unreadCount === 0}
            className="btn-ghost inline-flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bell className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm text-text-secondary">Chưa có thông báo nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-150">
              {notifications.map((notification) => {
                const content = (
                  <div className="flex gap-4 p-5 hover:bg-gray-50/70 transition-colors">
                    <div
                      className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                        notification.readAt ? 'bg-gray-200' : 'bg-primary'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h2 className="font-semibold text-text">{notification.title}</h2>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{notification.message}</p>
                      <span className="badge text-[11px] mt-3">{notification.type}</span>
                    </div>
                  </div>
                );

                return notification.link ? (
                  <Link key={notification._id} to={notification.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={notification._id}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
