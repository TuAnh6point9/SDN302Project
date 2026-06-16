import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookApi } from '../api/bookApi';
import { ArrowLeft, BookOpen, Calendar, Globe, Hash, FileText, Star, Award, ChevronRight, Bookmark } from 'lucide-react';
import type { IBook, ICategory } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<IBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSampleModal, setShowSampleModal] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    bookApi.getBookBySlug(slug)
      .then(setBook)
      .catch(err => {
        console.error('Error fetching book detail:', err);
        setError('Không tìm thấy cuốn sách này hoặc đã có lỗi xảy ra.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

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
  const coverImage = book.images.length > 0 ? `${API_BASE}${book.images[0]}` : null;
  const formattedPrice = book.price > 0
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)
    : 'Liên hệ';

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
            <button
              onClick={() => setShowSampleModal(true)}
              className="btn-primary flex-1 min-w-[200px]"
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
