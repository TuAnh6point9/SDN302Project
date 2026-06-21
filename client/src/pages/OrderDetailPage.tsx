import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, CreditCard, MapPin, Timer, XCircle } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import type { IOrder, OrderStatus } from '../types';
import { getApiErrorMessage } from '../utils/errors';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { showToast } = useToast();

  const closeCancelModal = useCallback(() => {
    if (cancelling) return;
    setShowCancelModal(false);
    setCancelReason('');
  }, [cancelling]);

  useEffect(() => {
    if (!id) return;
    orderApi.getOrderById(id)
      .then(setOrder)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không tìm thấy đơn hàng.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container py-16 text-center space-y-4">
        <ClipboardList className="w-14 h-14 text-gray-300 mx-auto" />
        <h1 className="text-xl font-bold">{error || 'Không tìm thấy đơn hàng'}</h1>
        <Link to="/orders" className="btn-primary">Quay lại đơn hàng</Link>
      </div>
    );
  }

  const statusHistory = order.statusHistory?.length
    ? order.statusHistory
    : [{ status: order.orderStatus, changedAt: order.createdAt }];

  const canPayOnline = order.paymentMethod === 'ONLINE'
    && order.paymentStatus === 'pending'
    && order.orderStatus !== 'cancelled';
  const canCancelOrder = order.orderStatus === 'pending' && order.paymentStatus !== 'paid';

  const handlePayOnline = async () => {
    setPaying(true);
    setError('');
    try {
      const { order: updatedOrder, payment } = await paymentApi.createPayosPayment(order._id);
      setOrder(updatedOrder);
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      } else {
        setError('Không nhận được link thanh toán payOS.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể tạo thanh toán payOS.'));
    } finally {
      setPaying(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const updatedOrder = await orderApi.cancelOrder(order._id, cancelReason.trim() || undefined);
      setOrder(updatedOrder);
      setShowCancelModal(false);
      setCancelReason('');
      showToast('Đơn hàng đã được hủy thành công.', 'success');
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Không thể hủy đơn hàng.'), 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page-container py-8 space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold font-heading">Đơn {order.orderCode}</h1>
            <p className="text-sm text-text-secondary mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          <span className="badge w-fit">{statusLabels[order.orderStatus]}</span>
        </div>

        {order.cancelReason && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">Lý do hủy:</span> {order.cancelReason}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-5">
            <section className="space-y-3">
              <h2 className="font-heading font-bold flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" /> Tiến trình đơn hàng
              </h2>
              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                {statusHistory.map((entry, index) => (
                  <div key={`${entry.status}-${entry.changedAt}-${index}`} className="p-4 flex gap-3 text-sm">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-text">{statusLabels[entry.status]}</p>
                      <p className="text-xs text-text-secondary">{new Date(entry.changedAt).toLocaleString('vi-VN')}</p>
                      {entry.note && <p className="text-text-secondary mt-1">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-heading font-bold">Sản phẩm</h2>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {order.items.map((item) => (
                  <div key={`${item.book}-${item.title}`} className="p-4 flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-text">{item.title}</p>
                      <p className="text-text-secondary mt-1">{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <span className="font-bold text-primary whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-5">
            <div className="border border-gray-100 rounded-2xl p-4">
              <h2 className="font-heading font-bold flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-primary" /> Địa chỉ nhận hàng
              </h2>
              <div className="text-sm text-text-secondary space-y-1">
                <p className="font-semibold text-text">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine}, {order.shippingAddress.city}</p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Phương thức</span>
                <span className="font-semibold">{order.paymentMethod === 'ONLINE' ? 'Online' : 'COD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Thanh toán</span>
                <span className="font-semibold">{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tạm tính</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                  <span className="font-semibold text-primary">-{formatPrice(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Phí giao hàng</span>
                <span className="font-semibold">{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                <span className="font-bold">Tổng cộng</span>
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>

            {canPayOnline && (
              <button
                type="button"
                disabled={paying}
                onClick={() => void handlePayOnline()}
                className="btn-primary w-full disabled:opacity-60"
              >
                {paying ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Thanh toán VietQR
                  </>
                )}
              </button>
            )}

            {canCancelOrder && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="btn-outline w-full !border-red-200 !text-red-600 hover:!bg-red-50"
              >
                <XCircle className="w-5 h-5" /> Hủy đơn hàng
              </button>
            )}
          </aside>
        </div>
      </div>

      <Modal open={showCancelModal} onClose={closeCancelModal} title="Hủy đơn hàng">
        <p className="text-sm text-text-secondary">
          Bạn chắc chắn muốn hủy đơn <span className="font-semibold text-text">{order.orderCode}</span>? Hành động này không thể hoàn tác.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="text-sm font-medium text-text">
            Lý do hủy <span className="text-text-secondary font-normal">(có thể bỏ trống)</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            className="input-field resize-none"
            placeholder="Nhập lý do hủy đơn hàng..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={cancelling}
            maxLength={500}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={closeCancelModal}
            disabled={cancelling}
            className="btn-ghost flex-1 disabled:opacity-60"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => void handleCancelOrder()}
            disabled={cancelling}
            className="btn-danger flex-1 disabled:opacity-60"
          >
            {cancelling ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Xác nhận hủy'
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}
