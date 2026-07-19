/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, Download, Filter, RefreshCw, Search } from 'lucide-react';
import { orderApi, type IAdminOrdersQuery } from '../../api/orderApi';
import Modal from '../../components/ui/Modal';
import { ORDER_STATUS_LABELS as statusLabels } from '../../constants/orderStatus';
import { useToast } from '../../contexts/ToastContext';
import type { IOrder, OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const paymentLabels: Record<PaymentStatus, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
};

const methodLabels: Record<PaymentMethod, string> = {
  COD: 'COD',
  ONLINE: 'VietQR',
};

// Đơn VietQR tạo quá 24h mà chưa thanh toán = quá hạn, đang giữ kho vô ích.
const OVERDUE_MS = 24 * 60 * 60 * 1000;

const isOverdueOnline = (order: IOrder) =>
  order.paymentMethod === 'ONLINE'
  && order.paymentStatus === 'pending'
  && order.orderStatus === 'pending'
  && Date.now() - new Date(order.createdAt).getTime() > OVERDUE_MS;

type PendingAction =
  | { kind: 'status'; order: IOrder; nextStatus: OrderStatus }
  | { kind: 'quickCancel'; order: IOrder };

const QUICK_CANCEL_REASON = 'Quá hạn thanh toán VietQR (quá 24 giờ), hệ thống hoàn tồn kho';

export default function OrdersManagePage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

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

  // Mở modal thu thập lý do/ghi chú thay vì window.prompt — submit thật nằm ở confirmPendingAction.
  const handleStatusChange = (order: IOrder, nextStatus: OrderStatus) => {
    setReasonInput('');
    setPendingAction({ kind: 'status', order, nextStatus });
  };

  const handleQuickCancel = (order: IOrder) => {
    setReasonInput('');
    setPendingAction({ kind: 'quickCancel', order });
  };

  const closePendingAction = () => {
    if (submittingAction) return;
    setPendingAction(null);
    setReasonInput('');
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const { order } = pendingAction;
    const isCancelStatus = pendingAction.kind === 'quickCancel' || pendingAction.nextStatus === 'cancelled';

    if (pendingAction.kind === 'status' && isCancelStatus && !reasonInput.trim()) {
      return;
    }

    setSubmittingAction(true);
    setUpdatingId(order._id);
    try {
      const updated = pendingAction.kind === 'quickCancel'
        ? await orderApi.updateStatus(order._id, {
            orderStatus: 'cancelled',
            cancelReason: QUICK_CANCEL_REASON,
          })
        : await orderApi.updateStatus(order._id, {
            orderStatus: pendingAction.nextStatus,
            paymentStatus: pendingAction.nextStatus === 'delivered' ? 'paid' : order.paymentStatus,
            note: isCancelStatus ? undefined : reasonInput.trim() || undefined,
            cancelReason: isCancelStatus ? reasonInput.trim() : undefined,
          });
      setOrders((current) => current.map((item) => item._id === updated._id ? updated : item));
      setPendingAction(null);
      setReasonInput('');
    } catch (err: unknown) {
      const fallback = pendingAction.kind === 'quickCancel' ? 'Không thể hủy đơn hàng.' : 'Không thể cập nhật đơn hàng.';
      showToast(getApiErrorMessage(err, fallback), 'error');
    } finally {
      setSubmittingAction(false);
      setUpdatingId('');
    }
  };

  const overdueCount = useMemo(() => orders.filter(isOverdueOnline).length, [orders]);

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

      {overdueCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Có <strong>{overdueCount}</strong> đơn VietQR quá hạn thanh toán (&gt;24h) đang giữ tồn kho — hủy để hoàn kho.
          </span>
        </div>
      )}

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
                        {isOverdueOnline(order) && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Quá hạn thanh toán
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge text-[11px]">{statusLabels[order.orderStatus]}</span>
                        {order.cancelReason && <p className="text-xs text-red-600 mt-2 max-w-48">{order.cancelReason}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          disabled={updatingId === order._id || order.orderStatus === 'cancelled'}
                          onChange={(event) => handleStatusChange(order, event.target.value as OrderStatus)}
                          className="input-field !py-2 text-sm min-w-40"
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        {isOverdueOnline(order) && (
                          <button
                            type="button"
                            disabled={updatingId === order._id}
                            onClick={() => handleQuickCancel(order)}
                            className="mt-2 w-full px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                          >
                            Hủy &amp; hoàn kho
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingAction && (
        <Modal
          open
          onClose={closePendingAction}
          title={
            pendingAction.kind === 'quickCancel'
              ? 'Hủy đơn quá hạn thanh toán'
              : pendingAction.nextStatus === 'cancelled'
              ? 'Hủy đơn hàng'
              : 'Cập nhật trạng thái đơn hàng'
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Đơn <strong className="text-text">{pendingAction.order.orderCode}</strong>
              {pendingAction.kind === 'status' && (
                <> sẽ chuyển sang trạng thái <strong className="text-text">{statusLabels[pendingAction.nextStatus]}</strong>.</>
              )}
            </p>

            {pendingAction.kind === 'quickCancel' ? (
              <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
                {QUICK_CANCEL_REASON}
              </p>
            ) : (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  {pendingAction.nextStatus === 'cancelled' ? 'Lý do hủy đơn (bắt buộc)' : 'Ghi chú cập nhật (tùy chọn)'}
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(event) => setReasonInput(event.target.value)}
                  rows={3}
                  className="input-field mt-1 resize-none"
                  placeholder={pendingAction.nextStatus === 'cancelled' ? 'Nhập lý do hủy đơn hàng' : 'Ghi chú (có thể bỏ trống)'}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closePendingAction} disabled={submittingAction} className="btn-outline !py-2 text-sm">
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void confirmPendingAction()}
                disabled={
                  submittingAction
                  || (pendingAction.kind === 'status' && pendingAction.nextStatus === 'cancelled' && !reasonInput.trim())
                }
                className="btn-primary !py-2 text-sm disabled:opacity-50"
              >
                {submittingAction ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
