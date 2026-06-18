import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Boxes, History, PackagePlus, RefreshCw } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { inventoryApi } from '../../api/inventoryApi';
import type { IBook, IInventoryMovement } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));

const getBookTitle = (book: IInventoryMovement['book']) =>
  typeof book === 'string' ? book : book.title;

export default function InventoryManagePage() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [movements, setMovements] = useState<IInventoryMovement[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [mode, setMode] = useState<'change' | 'set'>('change');
  const [type, setType] = useState<'import' | 'adjustment' | 'return'>('import');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedBook = useMemo(
    () => books.find((book) => book._id === selectedBookId),
    [books, selectedBookId]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bookResponse, movementResponse] = await Promise.all([
        bookApi.getBooks({ limit: 100, sort: 'newest' }),
        inventoryApi.getMovements(),
      ]);
      setBooks(bookResponse.books);
      setMovements(movementResponse);
      setSelectedBookId((current) => current || bookResponse.books[0]?._id || '');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải dữ liệu tồn kho.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBookId) {
      setError('Vui lòng chọn sách cần cập nhật.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await inventoryApi.adjust(selectedBookId, {
        mode,
        type,
        quantity: mode === 'set' ? quantity : undefined,
        quantityChange: mode === 'change' ? quantity : undefined,
        note,
      });
      setMessage('Đã cập nhật tồn kho.');
      setNote('');
      await fetchData();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật tồn kho.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản lý tồn kho</h2>
          <p className="text-xs text-text-secondary">
            Nhập kho, điều chỉnh số lượng và theo dõi lịch sử biến động.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="btn-ghost inline-flex items-center gap-2 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {(error || message) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Cập nhật tồn kho</h3>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Sách</span>
            <select
              value={selectedBookId}
              onChange={(event) => setSelectedBookId(event.target.value)}
              className="input-field !py-2.5 text-sm"
              disabled={loading}
            >
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title}
                </option>
              ))}
            </select>
          </label>

          {selectedBook && (
            <div className="rounded-2xl bg-background border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary">Tồn kho hiện tại</p>
                <p className="text-2xl font-bold text-primary">{selectedBook.stockQuantity}</p>
              </div>
              <Boxes className="w-9 h-9 text-primary/60" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Chế độ</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as 'change' | 'set')}
                className="input-field !py-2.5 text-sm"
              >
                <option value="change">Cộng/trừ</option>
                <option value="set">Đặt số lượng</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Loại</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as 'import' | 'adjustment' | 'return')}
                className="input-field !py-2.5 text-sm"
              >
                <option value="import">Nhập kho</option>
                <option value="adjustment">Điều chỉnh</option>
                <option value="return">Hoàn kho</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              {mode === 'set' ? 'Số lượng mới' : 'Mức thay đổi'}
            </span>
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="input-field !py-2.5 text-sm"
              min={mode === 'set' ? 0 : undefined}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Ghi chú</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="input-field !py-2.5 text-sm"
              placeholder="Ví dụ: nhập lô mới, kiểm kê cuối tháng..."
            />
          </label>

          <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2" disabled={submitting}>
            <ArrowDownUp className="w-4 h-4" />
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-150 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Lịch sử tồn kho</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Đang tải dữ liệu...</div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-sm text-text-secondary">Chưa có lịch sử tồn kho.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background/80 text-xs uppercase tracking-wider text-text-secondary">
                  <tr>
                    <th className="px-5 py-3">Thời gian</th>
                    <th className="px-5 py-3">Sách</th>
                    <th className="px-5 py-3">Loại</th>
                    <th className="px-5 py-3 text-right">Trước</th>
                    <th className="px-5 py-3 text-right">Thay đổi</th>
                    <th className="px-5 py-3 text-right">Sau</th>
                    <th className="px-5 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {movements.map((movement) => (
                    <tr key={movement._id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{formatDate(movement.createdAt)}</td>
                      <td className="px-5 py-3 min-w-52 font-medium text-text">{getBookTitle(movement.book)}</td>
                      <td className="px-5 py-3">
                        <span className="badge text-[11px]">{movement.type}</span>
                      </td>
                      <td className="px-5 py-3 text-right">{movement.quantityBefore}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${movement.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantityChange > 0 ? '+' : ''}
                        {movement.quantityChange}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{movement.quantityAfter}</td>
                      <td className="px-5 py-3 text-text-secondary min-w-48">{movement.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
