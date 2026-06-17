import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import BookCard from '../components/BookCard';
import { useWishlist } from '../contexts/WishlistContext';

export default function WishlistPage() {
  const { wishlist, isLoading } = useWishlist();

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
        <h1 className="text-3xl font-bold font-heading text-text">Sách yêu thích</h1>
        <p className="text-text-secondary text-sm mt-1">Lưu lại các đầu sách bạn muốn xem hoặc mua sau</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
          <Heart className="w-14 h-14 text-gray-300 mx-auto" />
          <h2 className="text-lg font-semibold">Chưa có sách yêu thích</h2>
          <Link to="/books" className="btn-primary">
            Khám phá sách
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
