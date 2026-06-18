/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Filter, RefreshCw, Search } from 'lucide-react';
import { orderApi, type IAdminOrdersQuery } from '../../api/orderApi';
import type { IOrder, OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
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

const methodLabels: Record<PaymentMethod, string> = {
  COD: 'COD',
  ONLINE: 'VietQR',
};

export default function OrdersManagePage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = useMemo<IAdminOrdersQuery>(() => ({
    search: search.trim() || undefined,
    orderStatus,
    paymentStatus,
    paymentMethod,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [dateFrom, dateTo, orderStatus, paymentMethod, paymentStatus, search]);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderApi.getAllOrders(filters)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (order: IOrder, nextStatus: OrderStatus) => {
    const cancelReason = nextStatus === 'cancelled'
      ? window.prompt('Nhập lý do hủy đơn hàng:')
      : undefined;

    if (nextStatus === 'cancelled' && !cancelReason?.trim()) {
      return;
    }

    const note = nextStatus !== 'cancelled'
      ? window.prompt('Ghi chú cập nhật trạng thái (có thể bỏ trống):') || undefined
      : undefined;

    setUpdatingId(order._id);
    try {
      const nextPaymentStatus = nextStatus === 'delivered' ? 'paid' : order.paymentStatus;
      const updated = await orderApi.updateStatus(order._id, {
        orderStatus: nextStatus,
        paymentStatus: nextPaymentStatus,
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

  const resetFilters = () => {
    setSearch('');
    setOrderStatus('all');
    setPaymentStatus('all');
    setPaymentMethod('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportCsv = () => {
    const header = ['Order Code', 'Customer', 'Phone', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Created At'];
    const rows = orders.map((order) => {
      const user = typeof order.user === 'object' ? order.user : null;
      return [
        order.orderCode,
        user?.name || order.shippingAddress.recipientName,
        order.shippingAddress.phone,
        String(order.total),
        order.paymentMethod,
        order.paymentStatus,
        order.orderStatus,
        new Date(order.createdAt).toISOString(),
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `greenleaf-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản lý đơn hàng</h2>
          <p className="text-xs text-text-secondary">Tìm kiếm, lọc và cập nhật trạng thái xử lý đơn</p>
        </div>
        <button onClick={fetchOrders} className="btn-outline !py-2.5 text-sm">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
        <button onClick={exportCsv} className="btn-outline !py-2.5 text-sm">
          <Download className="w-4 h-4" /> Xuất CSV
        </button>
      </div>

      <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Filter className="w-4 h-4 text-primary" /> Bộ lọc đơn hàng
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-field !py-2.5 !pl-9 text-sm"
              placeholder="Mã đơn, tên hoặc số điện thoại"
            />
          </div>
          <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value as OrderStatus | 'all')} className="input-field !py-2.5 text-sm">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | 'all')} className="input-field !py-2.5 text-sm">
            <option value="all">Tất cả thanh toán</option>
            {Object.entries(paymentLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | 'all')} className="input-field !py-2.5 text-sm">
            <option value="all">Tất cả phương thức</option>
            {Object.entries(methodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="button" onClick={resetFilters} className="btn-outline !py-2.5 text-sm">
            Xóa lọc
          </button>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="input-field !py-2.5 text-sm" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="input-field !py-2.5 text-sm" />
        </div>
      </section>

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <span className="text-sm text-text-secondary mt-3 block">Đang tải đơn hàng...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Không tìm thấy đơn hàng phù hợp</h3>
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
                        <p className="font-semibold text-text">{user?.name || order.shippingAddress.recipientName}</p>
                        <p className="text-xs text-text-secondary">{user?.email || order.shippingAddress.phone}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{formatPrice(order.total)}</td>
                      <td className="px-6 py-4">
                        <p>{paymentLabels[order.paymentStatus]}</p>
                        <p className="text-xs text-text-secondary mt-1">{methodLabels[order.paymentMethod]}</p>
                      </td>
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
