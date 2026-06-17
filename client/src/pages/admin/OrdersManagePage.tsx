/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import type { IOrder, OrderStatus, PaymentStatus } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
};

export default function OrdersManagePage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  const fetchOrders = () => {
    setLoading(true);
    orderApi.getAllOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (order: IOrder, orderStatus: OrderStatus) => {
    const cancelReason = orderStatus === 'cancelled'
      ? window.prompt('Nhập lý do hủy đơn hàng:')
      : undefined;

    if (orderStatus === 'cancelled' && !cancelReason?.trim()) {
      return;
    }

    const note = orderStatus !== 'cancelled'
      ? window.prompt('Ghi chú cập nhật trạng thái (có thể bỏ trống):') || undefined
      : undefined;

    setUpdatingId(order._id);
    try {
      const paymentStatus = orderStatus === 'delivered' ? 'paid' : order.paymentStatus;
      const updated = await orderApi.updateStatus(order._id, {
        orderStatus,
        paymentStatus,
        note,
        cancelReason: cancelReason?.trim(),
      });
      setOrders((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Không thể cập nhật đơn hàng.'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản lý đơn hàng</h2>
          <p className="text-xs text-text-secondary">Theo dõi trạng thái, thanh toán và lịch sử xử lý đơn</p>
        </div>
        <button onClick={fetchOrders} className="btn-outline !py-2.5 text-sm">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <span className="text-sm text-text-secondary mt-3 block">Đang tải đơn hàng...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Chưa có đơn hàng</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-gray-150">
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Tổng tiền</th>
                  <th className="px-6 py-4">Thanh toán</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {orders.map((order) => {
                  const user = typeof order.user === 'object' ? order.user : null;
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50 align-top">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text">{order.orderCode}</p>
                        <p className="text-xs text-text-secondary">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                        {order.voucherCode && <p className="text-xs text-primary mt-1">Voucher {order.voucherCode}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text">{user?.name || 'Khách hàng'}</p>
                        <p className="text-xs text-text-secondary">{user?.email || order.shippingAddress.phone}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{formatPrice(order.total)}</td>
                      <td className="px-6 py-4">{paymentLabels[order.paymentStatus]}</td>
                      <td className="px-6 py-4">
                        <span className="badge text-[11px]">{statusLabels[order.orderStatus]}</span>
                        {order.cancelReason && <p className="text-xs text-red-600 mt-2 max-w-48">{order.cancelReason}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          disabled={updatingId === order._id || order.orderStatus === 'cancelled'}
                          onChange={(event) => void handleStatusChange(order, event.target.value as OrderStatus)}
                          className="input-field !py-2 text-sm min-w-40"
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
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
