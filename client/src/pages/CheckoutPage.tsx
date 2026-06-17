import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, MapPin, Truck } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { voucherApi } from '../api/voucherApi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import type { PaymentMethod } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const SHIPPING_FEE = 30000;

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, clearLocalCart } = useCart();
  const defaultAddress = user?.addresses?.find((address) => address.isDefault) ?? user?.addresses?.[0];

  const [recipientName, setRecipientName] = useState(defaultAddress?.recipientName ?? user?.name ?? '');
  const [phone, setPhone] = useState(defaultAddress?.phone ?? user?.phone ?? '');
  const [addressLine, setAddressLine] = useState(defaultAddress?.addressLine ?? '');
  const [city, setCity] = useState(defaultAddress?.city ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [error, setError] = useState('');
  const [voucherMessage, setVoucherMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const items = cart?.items ?? [];
  const total = subtotal - discountTotal + SHIPPING_FEE;

  const handleApplyVoucher = async () => {
    setError('');
    setVoucherMessage('');
    setDiscountTotal(0);
    setAppliedVoucherCode('');

    if (!voucherCode.trim()) return;

    try {
      const result = await voucherApi.validate(voucherCode.trim(), subtotal);
      const appliedCode = result.voucherCode ?? voucherCode.trim().toUpperCase();
      setDiscountTotal(result.discountTotal);
      setAppliedVoucherCode(appliedCode);
      setVoucherMessage(`Đã áp dụng mã ${appliedCode}.`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Mã giảm giá không hợp lệ.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Giỏ hàng đang trống.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderApi.createOrder({
        shippingAddress: {
          recipientName,
          phone,
          addressLine,
          city,
        },
        shippingFee: SHIPPING_FEE,
        voucherCode: appliedVoucherCode || undefined,
        paymentMethod,
      });
      clearLocalCart();
      navigate(`/orders/${order._id}`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể tạo đơn hàng. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-text">Thanh toán</h1>
        <p className="text-text-secondary text-sm mt-1">Kiểm tra thông tin nhận hàng và chọn phương thức thanh toán</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Thông tin nhận hàng
          </h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Người nhận</label>
              <input required minLength={2} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="input-field mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Số điện thoại</label>
              <input required minLength={8} value={phone} onChange={(event) => setPhone(event.target.value)} className="input-field mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Địa chỉ</label>
            <input required minLength={5} value={addressLine} onChange={(event) => setAddressLine(event.target.value)} className="input-field mt-1" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tỉnh / thành phố</label>
            <input required minLength={2} value={city} onChange={(event) => setCity(event.target.value)} className="input-field mt-1" />
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Phương thức thanh toán
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'COD' as PaymentMethod, label: 'Thanh toán khi nhận hàng', desc: 'Khách trả tiền trực tiếp khi nhận sách' },
                { value: 'ONLINE' as PaymentMethod, label: 'Thanh toán online demo', desc: 'Tạo đơn chờ thanh toán và xác nhận demo sau' },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`border rounded-2xl p-4 cursor-pointer transition-colors ${
                    paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-text">{method.label}</span>
                  <span className="block text-xs text-text-secondary mt-1">{method.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Đơn hàng
          </h2>

          <div className="space-y-3 max-h-72 overflow-auto pr-1">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between gap-3 text-sm">
                <span className="text-text-secondary line-clamp-2">{item.book.title} x {item.quantity}</span>
                <span className="font-semibold whitespace-nowrap">{formatPrice((item.book.discountPrice ?? item.book.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Mã giảm giá</label>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value)}
                  className="input-field !py-2 text-sm"
                  placeholder="Ví dụ: GREEN10"
                />
                <button type="button" onClick={handleApplyVoucher} className="btn-outline !py-2 !px-4 text-sm">
                  Áp dụng
                </button>
              </div>
              {voucherMessage && <p className="text-xs text-primary font-semibold">{voucherMessage}</p>}
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Tạm tính</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Giảm giá</span>
                <span className="font-semibold text-primary">-{formatPrice(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-text-secondary">Phí giao hàng</span>
              <span className="font-semibold">{formatPrice(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between text-base pt-3 border-t border-gray-100">
              <span className="font-bold">Tổng cộng</span>
              <span className="font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting || items.length === 0} className="btn-primary w-full disabled:opacity-50">
            {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Đặt hàng'}
          </button>
        </aside>
      </form>
    </div>
  );
}
