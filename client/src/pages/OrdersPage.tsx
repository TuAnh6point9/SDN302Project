import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import type { IOrder, OrderStatus } from '../types';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getMyOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-text">Đơn hàng của tôi</h1>
        <p className="text-text-secondary text-sm mt-1">Theo dõi các đơn COD đã đặt</p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <ClipboardList className="w-14 h-14 text-gray-300 mx-auto" />
          <h2 className="text-lg font-semibold">Bạn chưa có đơn hàng nào</h2>
          <Link to="/books" className="btn-primary">Mua sách ngay</Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {orders.map((order) => (
            <Link key={order._id} to={`/orders/${order._id}`} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between hover:bg-gray-50/70 transition-colors">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-text">{order.orderCode}</span>
                  <span className="badge text-[11px]">{statusLabels[order.orderStatus]}</span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {new Date(order.createdAt).toLocaleString('vi-VN')} - {order.items.length} sản phẩm
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
