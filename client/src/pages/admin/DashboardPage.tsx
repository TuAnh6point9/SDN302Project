import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, ClipboardList, DollarSign, Star } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { orderApi } from '../../api/orderApi';
import type { IBook, IOrder } from '../../types';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function DashboardPage() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookApi.getBooks({ limit: 100, sort: 'newest' }),
      orderApi.getAllOrders(),
    ])
      .then(([bookResponse, orderResponse]) => {
        setBooks(bookResponse.books);
        setOrders(orderResponse);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter((order) => order.orderStatus === 'delivered');
    const pendingOrders = orders.filter((order) => order.orderStatus === 'pending');
    const lowStockBooks = books.filter((book) => book.stockQuantity > 0 && book.stockQuantity <= 5);
    const outOfStockBooks = books.filter((book) => book.stockQuantity === 0);

    return {
      revenue: deliveredOrders.reduce((sum, order) => sum + order.total, 0),
      pendingOrders: pendingOrders.length,
      totalBooks: books.length,
      lowStockBooks,
      outOfStockBooks,
      featuredBooks: books.filter((book) => book.isFeatured).length,
    };
  }, [books, orders]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
        <span className="text-sm text-text-secondary mt-3 block">Đang tải dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-heading text-text">Tổng quan hệ thống</h2>
        <p className="text-xs text-text-secondary">Theo dõi nhanh sách, đơn hàng và tồn kho</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-primary-light/20 text-primary flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs text-text-secondary">Doanh thu đã giao</p>
          <p className="text-xl font-bold text-text mt-1">{formatPrice(stats.revenue)}</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center mb-4">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="text-xs text-text-secondary">Đơn chờ xác nhận</p>
          <p className="text-xl font-bold text-text mt-1">{stats.pendingOrders}</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs text-text-secondary">Số đầu sách</p>
          <p className="text-xl font-bold text-text mt-1">{stats.totalBooks}</p>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
            <Star className="w-5 h-5" />
          </div>
          <p className="text-xs text-text-secondary">Sách nổi bật</p>
          <p className="text-xl font-bold text-text mt-1">{stats.featuredBooks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" /> Sắp hết hàng
          </h3>
          {stats.lowStockBooks.length === 0 ? (
            <p className="text-sm text-text-secondary">Không có sách nào sắp hết hàng.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.lowStockBooks.slice(0, 8).map((book) => (
                <div key={book._id} className="py-3 flex justify-between gap-4 text-sm">
                  <span className="font-medium text-text line-clamp-1">{book.title}</span>
                  <span className="text-yellow-700 font-semibold whitespace-nowrap">{book.stockQuantity} cuốn</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" /> Hết hàng
          </h3>
          {stats.outOfStockBooks.length === 0 ? (
            <p className="text-sm text-text-secondary">Không có sách nào hết hàng.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.outOfStockBooks.slice(0, 8).map((book) => (
                <div key={book._id} className="py-3 flex justify-between gap-4 text-sm">
                  <span className="font-medium text-text line-clamp-1">{book.title}</span>
                  <span className="text-red-600 font-semibold whitespace-nowrap">0 cuốn</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
