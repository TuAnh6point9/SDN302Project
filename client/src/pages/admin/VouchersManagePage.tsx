/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Edit3, Plus, Save, TicketPercent, X } from 'lucide-react';
import { voucherApi } from '../../api/voucherApi';
import type { IVoucher, VoucherType } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const toDateInput = (value?: string) => value ? value.slice(0, 10) : '';
const toIsoOrUndefined = (value: string) => value ? new Date(value).toISOString() : undefined;

interface VoucherForm {
  code: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
}

const defaultForm: VoucherForm = {
  code: '',
  type: 'percent',
  value: 10,
  minOrderValue: 0,
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
};

export default function VouchersManagePage() {
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCode, setEditingCode] = useState('');
  const [form, setForm] = useState<VoucherForm>(defaultForm);

  const fetchVouchers = () => {
    setLoading(true);
    voucherApi.getVouchers()
      .then(setVouchers)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể tải voucher.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const updateForm = <K extends keyof VoucherForm>(key: K, value: VoucherForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingCode('');
    setForm(defaultForm);
    setError('');
  };

  const fillEditForm = (voucher: IVoucher) => {
    setEditingCode(voucher.code);
    setForm({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      minOrderValue: voucher.minOrderValue,
      maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : '',
      usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : '',
      expiresAt: toDateInput(voucher.expiresAt),
      isActive: voucher.isActive,
    });
    setError('');
  };

  const payloadFromForm = () => ({
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: Number(form.value),
    minOrderValue: Number(form.minOrderValue),
    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
    usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
    expiresAt: toIsoOrUndefined(form.expiresAt),
    isActive: form.isActive,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editingCode) {
        const updated = await voucherApi.updateVoucher(editingCode, payloadFromForm());
        setVouchers((current) => current.map((item) => item._id === updated._id ? updated : item));
      } else {
        const created = await voucherApi.createVoucher(payloadFromForm());
        setVouchers((current) => [created, ...current]);
      }
      resetForm();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể lưu voucher.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVoucher = async (voucher: IVoucher) => {
    try {
      const updated = await voucherApi.updateVoucher(voucher.code, { isActive: !voucher.isActive });
      setVouchers((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái voucher.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading text-text">Quản lý voucher</h2>
        <p className="text-xs text-text-secondary">Tạo, sửa và bật/tắt mã giảm giá cho đơn hàng</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-heading font-bold text-primary-dark">
            <TicketPercent className="w-5 h-5" /> {editingCode ? `Sửa voucher ${editingCode}` : 'Tạo voucher mới'}
          </div>
          {editingCode && (
            <button type="button" onClick={resetForm} className="btn-outline !py-2 text-xs">
              <X className="w-4 h-4" /> Hủy sửa
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
          <input
            required
            value={form.code}
            onChange={(event) => updateForm('code', event.target.value.toUpperCase())}
            className="input-field !py-2 text-sm"
            placeholder="GREEN10"
          />
          <select value={form.type} onChange={(event) => updateForm('type', event.target.value as VoucherType)} className="input-field !py-2 text-sm">
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền</option>
          </select>
          <input type="number" min={0} required value={form.value} onChange={(event) => updateForm('value', Number(event.target.value))} className="input-field !py-2 text-sm" placeholder="Giá trị" />
          <input type="number" min={0} value={form.minOrderValue} onChange={(event) => updateForm('minOrderValue', Number(event.target.value))} className="input-field !py-2 text-sm" placeholder="Đơn tối thiểu" />
          <input type="number" min={0} value={form.maxDiscount} onChange={(event) => updateForm('maxDiscount', event.target.value)} className="input-field !py-2 text-sm" placeholder="Giảm tối đa" />
          <input type="number" min={1} value={form.usageLimit} onChange={(event) => updateForm('usageLimit', event.target.value)} className="input-field !py-2 text-sm" placeholder="Số lượt" />
          <input type="date" value={form.expiresAt} onChange={(event) => updateForm('expiresAt', event.target.value)} className="input-field !py-2 text-sm" />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm('isActive', event.target.checked)} />
          Voucher đang bật
        </label>

        <button type="submit" disabled={submitting} className="btn-primary !py-2.5 text-sm">
          {editingCode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {submitting ? 'Đang lưu...' : editingCode ? 'Lưu voucher' : 'Tạo voucher'}
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
                  <th className="px-6 py-4">Hết hạn</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
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
                    <td className="px-6 py-4 text-text-secondary">{voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge text-[11px] ${voucher.isActive ? '' : 'bg-red-50 text-red-700'}`}>
                        {voucher.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => fillEditForm(voucher)} className="btn-outline !py-2 text-xs">
                          <Edit3 className="w-4 h-4" /> Sửa
                        </button>
                        <button type="button" onClick={() => void toggleVoucher(voucher)} className="btn-outline !py-2 text-xs">
                          {voucher.isActive ? 'Tắt' : 'Bật'}
                        </button>
                      </div>
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
