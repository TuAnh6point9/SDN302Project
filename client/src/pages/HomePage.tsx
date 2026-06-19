import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, Leaf, PawPrint, TreePine } from 'lucide-react';
import { bookApi } from '../api/bookApi';
import { categoryApi } from '../api/categoryApi';
import BookCard from '../components/BookCard';
import BookCardSkeleton from '../components/BookCardSkeleton';
import type { IBook, ICategory } from '../types';

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<IBook[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured books
    bookApi.getBooks({ sort: 'featured', limit: 8 })
      .then((res) => {
        const featured = res.books.filter((book) => book.isFeatured);
        setFeaturedBooks(featured.length > 0 ? featured : res.books.slice(0, 4));
      })
      .catch((err) => console.error('Error fetching featured books:', err))
      .finally(() => setLoading(false));

    // Fetch categories
    categoryApi.getCategories()
      .then(setCategories)
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative bg-gradient-to-br from-primary-dark via-primary/95 to-emerald-900 text-white py-20 md:py-28 overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-xl">
        {/* Animated decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-primary-light/5 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="page-container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 rounded-full text-xs font-semibold tracking-wider text-primary-light uppercase border border-white/10 backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5 animate-spin duration-3000" /> Tri thức xanh - Tương lai lành
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-tight tracking-tight">
              Khám phá thế giới tự nhiên <span className="text-gradient bg-gradient-to-r from-primary-light via-emerald-300 to-green-100 font-extrabold">qua từng trang sách</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              GreenLeaf Books là nền tảng trưng bày và kết nối tri thức chuyên sâu về Động vật, Thực vật học, thiên nhiên và sinh thái học hàng đầu dành cho các bạn trẻ yêu thiên nhiên.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/books" className="btn-primary !bg-white !text-primary hover:!bg-primary-light hover:!text-primary-dark shadow-lg shadow-black/10 hover:shadow-primary-light/20 flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 transition-all">
                Khám phá ngay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/books?category=thuc-vat" className="btn-outline !border-white/30 !text-white hover:!bg-white/10 hover:!border-white/50 backdrop-blur-xs transform hover:-translate-y-0.5 active:scale-95 transition-all">
                Sách Thực vật
              </Link>
            </div>

            {/* Credibility Counter Grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg mx-auto lg:mx-0">
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-extrabold font-heading text-primary-light">12,000+</p>
                <p className="text-xs text-white/60 font-medium">Sách Trưng Bày</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-extrabold font-heading text-primary-light">4,800+</p>
                <p className="text-xs text-white/60 font-medium">Bạn Đọc Tin Cậy</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-extrabold font-heading text-primary-light">50+</p>
                <p className="text-xs text-white/60 font-medium">Đối Tác NXB</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center relative">
            {/* Background glowing circle */}
            <div className="absolute w-72 h-72 rounded-full bg-primary-light/10 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative w-72 h-72 md:w-80 md:h-80 bg-white/10 rounded-[2.5rem] backdrop-blur-md border border-white/20 p-8 flex flex-col justify-between shadow-2xl animate-float cursor-pointer hover:animate-none hover:scale-[1.02] transition-transform duration-500">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">GreenLeaf Showcase</span>
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/10">
                  <BookOpen className="w-5 h-5 text-primary-light" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-white/90 font-medium italic text-lg leading-relaxed">
                  "Trong mọi góc của thiên nhiên đều ẩn chứa một điều kỳ diệu."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary-light animate-ping" />
                  <span className="text-xs text-white/60 font-semibold tracking-wider uppercase">Aristotle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container space-y-8">
        <div className="text-center space-y-2">
          <h2 className="section-title">Chủ đề khám phá</h2>
          <p className="section-subtitle">Lựa chọn lĩnh vực bạn muốn tìm hiểu</p>
        </div>

        {categories.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse h-80 rounded-3xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/books?category=${category.slug}`}
                className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-8"
              >
                {/* Category Cover Image */}
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                  />
                ) : (
                  <div className="absolute inset-0 bg-emerald-950" />
                )}
                {/* Text legibility overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10 z-10" />

                <div className="relative z-20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light/20 flex items-center justify-center text-primary-light border border-primary-light/30 backdrop-blur-md">
                    {category.name.toLowerCase().includes('động vật') ? (
                      <PawPrint className="w-6 h-6" />
                    ) : category.name.toLowerCase().includes('thực vật') ? (
                      <TreePine className="w-6 h-6" />
                    ) : (
                      <Leaf className="w-6 h-6" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white font-heading">{category.name}</h3>
                  <p className="text-white/85 text-sm leading-relaxed max-w-sm line-clamp-3">
                    {category.description || 'Khám phá sách và tài liệu tự nhiên chuyên ngành.'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-primary-light text-sm font-semibold pt-2 group-hover:gap-3 transition-all">
                    Xem danh sách sách <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="page-container space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-text">Sách nổi bật</h2>
              <p className="text-text-secondary text-sm">Những đầu sách được gợi ý cho bạn</p>
            </div>
          </div>
          <Link to="/books" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            Xem tất cả sách <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <BookCardSkeleton key={index} />
            ))}
          </div>
        ) : featuredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Chưa có sách nổi bật</h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              Các đầu sách nổi bật đang được cập nhật.
            </p>
          </div>
        )}
      </section>

      <section className="bg-white py-16 border-y border-gray-200/50">
        <div className="page-container grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Mua sách đơn giản</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Chọn sách, thêm vào giỏ hàng và đặt hàng COD với thông tin giao nhận rõ ràng.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Danh mục dễ tìm</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Cây danh mục Động vật và Thực vật giúp bạn lọc đúng chủ đề cần đọc.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Theo dõi đầy đủ</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Quản lý hồ sơ, sách yêu thích, giỏ hàng và lịch sử đơn hàng trong một nơi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
