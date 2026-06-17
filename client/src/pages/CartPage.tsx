import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, isLoading, subtotal, updateQuantity, removeItem } = useCart();
  const items = cart?.items ?? [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-text">Giỏ hàng</h1>
        <p className="text-text-secondary text-sm mt-1">Kiểm tra sách trước khi đặt hàng COD</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <ShoppingBag className="w-14 h-14 text-gray-300 mx-auto" />
          <h2 className="text-lg font-semibold">Giỏ hàng đang trống</h2>
          <Link to="/books" className="btn-primary">
            Khám phá sách
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {items.map((item) => {
              const book = item.book;
              const coverImage = book.images.length > 0 ? `${API_BASE}${book.images[0]}` : null;
              const itemPrice = book.discountPrice ?? book.price;

              return (
                <div key={item._id} className="p-4 sm:p-5 flex gap-4">
                  <Link to={`/books/${book.slug}`} className="w-20 h-28 bg-background rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    {coverImage ? (
                      <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/40">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/books/${book.slug}`} className="font-semibold text-text hover:text-primary line-clamp-2">
                      {book.title}
                    </Link>
                    <p className="text-xs text-text-secondary mt-1">{book.author}</p>
                    <p className="text-sm font-bold text-primary mt-3">{formatPrice(itemPrice)}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
                      <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          className="p-2 hover:bg-gray-50 disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          onClick={() => void updateQuantity(item._id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          className="p-2 hover:bg-gray-50 disabled:opacity-40"
                          disabled={item.quantity >= book.stockQuantity}
                          onClick={() => void updateQuantity(item._id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
                        onClick={() => void removeItem(item._id)}
                      >
                        <Trash2 className="w-4 h-4" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-5">
            <h2 className="font-heading font-bold text-lg">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Tạm tính</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Phí giao hàng</span>
                <span className="font-semibold">Tính ở bước sau</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="font-semibold">Tổng tạm tính</span>
              <span className="text-xl font-bold text-primary">{formatPrice(subtotal)}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full">
              Tiến hành đặt hàng
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
