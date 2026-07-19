import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, ClipboardList, DollarSign, Star, TrendingUp, Trophy } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { bookApi } from '../../api/bookApi';
import { orderApi } from '../../api/orderApi';
import { statsApi, type IAdminOverview } from '../../api/statsApi';
import type { IBook, IOrder } from '../../types';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatCompact = (value: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatDayLabel = (day: string) => {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
};

export default function DashboardPage() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<IAdminOverview | null>(null);

  useEffect(() => {
    // Thống kê từ endpoint aggregation riêng; lỗi thì ẩn section chart,
    // phần dashboard cũ vẫn hiển thị bình thường.
    statsApi.getAdminOverview().then(setOverview).catch(console.error);
  }, []);

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
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-3 bg-gray-200 rounded w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200/60 rounded-2xl p-5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200/60 rounded-2xl p-5 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="space-y-3 pt-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between py-3 border-b border-gray-50 last:border-b-0">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Doanh thu 14 ngày (đơn đã giao)
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={overview.revenueByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDayLabel}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => formatCompact(Number(value))}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value)), 'Doanh thu']}
                  labelFormatter={(label) => `Ngày ${formatDayLabel(String(label))}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-text flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Top 5 sách bán chạy
            </h3>
            {overview.topBooks.length === 0 ? (
              <p className="text-sm text-text-secondary">Chưa có đơn hàng đã giao nào.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={overview.topBooks}
                  layout="vertical"
                  margin={{ top: 8, right: 32, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={150}
                    tick={{ fontSize: 11, fill: '#374151' }}
                    tickFormatter={(title) =>
                      String(title).length > 20 ? `${String(title).slice(0, 19)}…` : String(title)
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => [`${Number(value)} cuốn`, 'Đã bán']} />
                  <Bar
                    dataKey="quantity"
                    name="Đã bán"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                    label={{ position: 'right', fontSize: 11, fill: '#374151' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>
        </div>
      )}

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
