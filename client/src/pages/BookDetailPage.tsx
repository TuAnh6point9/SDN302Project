/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookApi } from '../api/bookApi';
import { reviewApi } from '../api/reviewApi';
import { subscriptionApi } from '../api/subscriptionApi';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { ArrowLeft, Bell, BellRing, BookOpen, Calendar, Globe, Hash, FileText, Star, Award, ChevronRight, Bookmark, ShoppingCart, AlertCircle, Heart } from 'lucide-react';
import type { IBook, ICategory } from '../types';
import type { IReview } from '../types';
import { getApiErrorMessage } from '../utils/errors';
import { resolveAssetUrl } from '../utils/assetUrl';

export default function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [book, setBook] = useState<IBook | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    bookApi.getBookBySlug(slug)
      .then((nextBook) => {
        setBook(nextBook);
        return reviewApi.getBookReviews(nextBook._id);
      })
      .then(setReviews)
      .catch(err => {
        console.error('Error fetching book detail:', err);
        setError('Không tìm thấy cuốn sách này hoặc đã có lỗi xảy ra.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!book || !user || book.stockQuantity > 0) return;
    subscriptionApi.getStatus(book._id)
      .then((res) => setSubscribed(res.subscribed))
      .catch(() => {
        // Trạng thái đăng ký chỉ là tiện ích hiển thị — lỗi thì bỏ qua
      });
  }, [book, user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="page-container py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text">{error || 'Không tìm thấy sách'}</h2>
        <Link to="/books" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách sách
        </Link>
      </div>
    );
  }

  const category = typeof book.category === 'object' ? (book.category as ICategory) : null;
  const coverImage = resolveAssetUrl(book.images[0]);
  const formattedPrice = book.price > 0
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)
    : 'Liên hệ';

  const handleAddToCart = async () => {
    setCartError('');
    setCartMessage('');

    if (!user) {
      navigate('/login', { state: { from: `/books/${book.slug}` } });
      return;
    }

    try {
      await addToCart(book._id, quantity);
      setCartMessage('Đã thêm sách vào giỏ hàng.');
    } catch (err: unknown) {
      setCartError(getApiErrorMessage(err, 'Không thể thêm vào giỏ hàng.'));
    }
  };

  const handleToggleSubscribe = async () => {
    setSubscribeError('');

    if (!user) {
      navigate('/login', { state: { from: `/books/${book.slug}` } });
      return;
    }

    setSubscribing(true);
    try {
      if (subscribed) {
        await subscriptionApi.unsubscribe(book._id);
        setSubscribed(false);
      } else {
        await subscriptionApi.subscribe(book._id);
        setSubscribed(true);
      }
    } catch (err: unknown) {
      setSubscribeError(getApiErrorMessage(err, 'Không thể cập nhật đăng ký thông báo.'));
    } finally {
      setSubscribing(false);
    }
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!user) {
      navigate('/login', { state: { from: `/books/${book.slug}` } });
      return;
    }

    setSubmittingReview(true);
    try {
      const review = await reviewApi.createReview(book._id, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setReviews((current) => [review, ...current]);
      setReviewComment('');
      setReviewSuccess('Đã gửi đánh giá của bạn.');

      const refreshedBook = await bookApi.getBookBySlug(book.slug);
      setBook(refreshedBook);
    } catch (err: unknown) {
      setReviewError(getApiErrorMessage(err, 'Không thể gửi đánh giá.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleWishlist = async () => {
    setWishlistMessage('');

    if (!user) {
      navigate('/login', { state: { from: `/books/${book.slug}` } });
      return;
    }

    const isAdded = await toggleWishlist(book._id);
    setWishlistMessage(isAdded ? 'Đã thêm vào sách yêu thích.' : 'Đã bỏ khỏi sách yêu thích.');
  };

  return (
    <div className="page-container py-8 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-text-secondary">
        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/books" className="hover:text-primary transition-colors">Tất cả sách</Link>
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/books?category=${category.slug}`} className="hover:text-primary transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl border border-gray-150/50 p-6 md:p-8 shadow-sm">
        {/* Left: Image Showcase */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-primary-light/10 to-primary/5 rounded-2xl overflow-hidden shadow-md group">
            {coverImage ? (
              <img
                src={coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-primary/45 gap-3">
                <BookOpen className="w-16 h-16" strokeWidth={1} />
                <span className="text-sm font-medium">Chưa có ảnh bìa</span>
              </div>
            )}
            
            {book.isFeatured && (
              <div className="absolute top-4 left-4 inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg">
                <Award className="w-3.5 h-3.5" /> Nổi bật
              </div>
            )}
          </div>
        </div>

        {/* Right: Technical Specification & Info */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Tags list */}
            {book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.tags.map((t: string) => (
                  <span key={t} className="badge-accent text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold font-heading text-text leading-tight">
              {book.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span>Tác giả: <strong className="text-text">{book.author}</strong></span>
              {book.publisher && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Nhà xuất bản: <strong className="text-text">{book.publisher}</strong></span>
                </>
              )}
            </div>

            {/* Price section */}
            <div className="p-4 bg-background/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-text-secondary block">Giá tham khảo</span>
                <span className="text-xl font-heading font-extrabold text-primary">
                  {formattedPrice}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100/50 text-yellow-700 px-2.5 py-1 rounded-xl text-xs font-semibold">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span>{book.ratingAverage.toFixed(1)} / 5</span>
              </div>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block uppercase tracking-wider font-semibold">Mã ISBN</span>
                  <span className="text-xs text-text font-medium">{book.isbn || 'Đang cập nhật'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block uppercase tracking-wider font-semibold">Số trang</span>
                  <span className="text-xs text-text font-medium">{book.pages ? `${book.pages} trang` : 'Đang cập nhật'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block uppercase tracking-wider font-semibold">Năm xuất bản</span>
                  <span className="text-xs text-text font-medium">{book.publishedYear || 'Đang cập nhật'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary block uppercase tracking-wider font-semibold">Ngôn ngữ</span>
                  <span className="text-xs text-text font-medium">{book.language === 'vi' ? 'Tiếng Việt' : book.language === 'en' ? 'Tiếng Anh' : book.language}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-3 w-full">
              <label className="text-sm font-semibold text-text-secondary">Số lượng</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, book.stockQuantity)}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                className="input-field !w-24 !py-2 text-sm"
                disabled={book.stockQuantity <= 0}
              />
              <span className="text-xs text-text-secondary">Còn {book.stockQuantity} cuốn</span>
            </div>
            {cartMessage && <p className="text-sm text-primary font-semibold w-full">{cartMessage}</p>}
            {wishlistMessage && <p className="text-sm text-primary font-semibold w-full">{wishlistMessage}</p>}
            {cartError && (
              <p className="text-sm text-red-600 font-semibold w-full inline-flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {cartError}
              </p>
            )}
            {subscribeError && (
              <p className="text-sm text-red-600 font-semibold w-full inline-flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {subscribeError}
              </p>
            )}
            {book.stockQuantity > 0 ? (
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 min-w-[200px]"
              >
                <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
              </button>
            ) : (
              <button
                onClick={() => void handleToggleSubscribe()}
                disabled={subscribing}
                className={`flex-1 min-w-[200px] disabled:opacity-50 ${subscribed ? 'btn-outline !border-primary !text-primary' : 'btn-primary'}`}
              >
                {subscribed ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {subscribing ? 'Đang xử lý...' : subscribed ? 'Đã đăng ký ✓' : 'Báo khi có hàng'}
              </button>
            )}
            <button
              onClick={handleToggleWishlist}
              className="btn-outline flex-1 min-w-[200px]"
            >
              <Heart className={`w-4 h-4 ${wishlistIds.has(book._id) ? 'fill-primary text-primary' : ''}`} />
              {wishlistIds.has(book._id) ? 'Bỏ yêu thích' : 'Yêu thích'}
            </button>
            <button
              onClick={() => setShowSampleModal(true)}
              className="btn-outline flex-1 min-w-[200px]"
            >
              <BookOpen className="w-4 h-4" /> Đọc thử một phần
            </button>
            <Link to="/books" className="btn-outline flex-1 min-w-[200px] hover:!bg-primary/5">
              Quay lại danh mục
            </Link>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-3xl border border-gray-150/50 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-heading text-primary-dark border-b border-gray-100 pb-3 flex items-center gap-2">
          <Bookmark className="w-5 h-5" /> Tóm tắt nội dung tác phẩm
        </h2>
        <div className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">
          {book.description}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-150/50 p-6 md:p-8 shadow-sm space-y-5">
        <h2 className="text-xl font-bold font-heading text-primary-dark border-b border-gray-100 pb-3 flex items-center gap-2">
          <Star className="w-5 h-5" /> Đánh giá từ độc giả
        </h2>
        <form onSubmit={handleSubmitReview} className="border border-gray-100 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-semibold text-text">Viết đánh giá</h3>
              <p className="text-xs text-text-secondary mt-0.5">Chỉ khách hàng đã nhận sách mới có thể đánh giá.</p>
            </div>
            <select
              value={reviewRating}
              onChange={(event) => setReviewRating(Number(event.target.value))}
              className="input-field !py-2 text-sm sm:!w-36"
            >
              <option value={5}>5 sao</option>
              <option value={4}>4 sao</option>
              <option value={3}>3 sao</option>
              <option value={2}>2 sao</option>
              <option value={1}>1 sao</option>
            </select>
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
            className="input-field text-sm"
          />
          {reviewError && (
            <p className="text-sm text-red-600 inline-flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {reviewError}
            </p>
          )}
          {reviewSuccess && <p className="text-sm text-primary font-semibold">{reviewSuccess}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submittingReview} className="btn-primary !py-2.5 text-sm disabled:opacity-50">
              {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-secondary">Chưa có đánh giá nào cho cuốn sách này.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-text">{review.user.name}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {review.rating}/5
                  </span>
                </div>
                {review.comment && <p className="text-sm text-text-secondary mt-2">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sample reading Modal */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center bg-primary text-white p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-light" />
                <h3 className="font-heading font-bold text-base line-clamp-1">Trích đoạn đọc thử: {book.title}</h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 font-serif text-text leading-relaxed text-sm md:text-base space-y-4">
              <p className="font-bold text-center text-lg text-primary-dark mb-4">Chương I: Lời Ngỏ Từ Tự Nhiên</p>
              <p>
                Thế giới quanh ta luôn ẩn chứa những kỳ quan diệu kỳ mà mắt thường đôi khi lướt qua quá nhanh để nhận thấy. Mỗi nhành cây, mỗi loài thú đều đóng vai trò thiết yếu tạo nên bức tranh hài hòa và cân bằng sinh thái tuyệt đối.
              </p>
              <p>
                Tác phẩm này được kỳ công thực hiện nhằm mục tiêu đưa quý độc giả bước gần hơn vào thế giới sống động đó. Qua các trang sách, bạn sẽ bắt gặp những khám phá sinh động, những câu chuyện nghiên cứu thực nghiệm và hệ thống phân loại thực vật, động vật đa dạng một cách trực quan nhất.
              </p>
              <p className="italic text-text-secondary text-center text-xs pt-8">
                --- Hết nội dung trích đoạn trưng bày ---
              </p>
            </div>

            {/* Footer */}
            <div className="bg-background/80 p-4 border-t border-gray-150 text-center">
              <button
                onClick={() => setShowSampleModal(false)}
                className="btn-primary !px-8 !py-2.5 text-sm"
              >
                Đóng trích đoạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
