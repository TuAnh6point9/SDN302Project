/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Plus, TicketPercent } from 'lucide-react';
import { voucherApi } from '../../api/voucherApi';
import type { IVoucher, VoucherType } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function VouchersManagePage() {
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState<VoucherType>('percent');
  const [value, setValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);

  const fetchVouchers = () => {
    setLoading(true);
    voucherApi.getVouchers()
      .then(setVouchers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await voucherApi.createVoucher({
        code,
        type,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive: true,
      });
      setCode('');
      setValue(10);
      setMinOrderValue(0);
      setMaxDiscount(undefined);
      setUsageLimit(undefined);
      fetchVouchers();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể tạo voucher.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading text-text">Quản lý voucher</h2>
        <p className="text-xs text-text-secondary">Tạo mã giảm giá cho đơn hàng COD</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 font-heading font-bold text-primary-dark">
          <TicketPercent className="w-5 h-5" /> Tạo voucher mới
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <input
            required
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="input-field !py-2 text-sm"
            placeholder="GREEN10"
          />
          <select value={type} onChange={(event) => setType(event.target.value as VoucherType)} className="input-field !py-2 text-sm">
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền</option>
          </select>
          <input
            type="number"
            min={0}
            required
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="input-field !py-2 text-sm"
            placeholder="Giá trị"
          />
          <input
            type="number"
            min={0}
            value={minOrderValue}
            onChange={(event) => setMinOrderValue(Number(event.target.value))}
            className="input-field !py-2 text-sm"
            placeholder="Đơn tối thiểu"
          />
          <input
            type="number"
            min={0}
            value={maxDiscount ?? ''}
            onChange={(event) => setMaxDiscount(event.target.value ? Number(event.target.value) : undefined)}
            className="input-field !py-2 text-sm"
            placeholder="Giảm tối đa"
          />
          <input
            type="number"
            min={1}
            value={usageLimit ?? ''}
            onChange={(event) => setUsageLimit(event.target.value ? Number(event.target.value) : undefined)}
            className="input-field !py-2 text-sm"
            placeholder="Số lượt"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary !py-2.5 text-sm">
          <Plus className="w-4 h-4" /> {submitting ? 'Đang tạo...' : 'Tạo voucher'}
        </button>
      </form>

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-secondary">Đang tải voucher...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center text-sm text-text-secondary">Chưa có voucher nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-gray-150">
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Giá trị</th>
                  <th className="px-6 py-4">Đơn tối thiểu</th>
                  <th className="px-6 py-4">Lượt dùng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {vouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td className="px-6 py-4 font-bold text-text">{voucher.code}</td>
                    <td className="px-6 py-4">
                      {voucher.type === 'percent' ? `${voucher.value}%` : formatPrice(voucher.value)}
                      {voucher.maxDiscount ? <span className="text-xs text-text-secondary block">Tối đa {formatPrice(voucher.maxDiscount)}</span> : null}
                    </td>
                    <td className="px-6 py-4">{formatPrice(voucher.minOrderValue)}</td>
                    <td className="px-6 py-4">{voucher.usedCount}{voucher.usageLimit ? ` / ${voucher.usageLimit}` : ''}</td>
                    <td className="px-6 py-4">
                      <span className="badge text-[11px]">{voucher.isActive ? 'Đang bật' : 'Đã tắt'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
