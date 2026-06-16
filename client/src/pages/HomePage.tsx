import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, BookOpen, PawPrint, TreePine, Award } from 'lucide-react';
import { bookApi } from '../api/bookApi';
import BookCard from '../components/BookCard';
import type { IBook } from '../types';

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<IBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookApi.getBooks({ sort: 'featured', limit: 8 })
      .then(res => {
        // Filter featured books just in case backend gets all
        const featured = res.books.filter(b => b.isFeatured);
        // Fallback to first few books if none are featured
        setFeaturedBooks(featured.length > 0 ? featured : res.books.slice(0, 4));
      })
      .catch(err => console.error('Error fetching featured books:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-dark via-primary/90 to-primary-light/80 text-white py-20 md:py-28 overflow-hidden rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-white blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full bg-white blur-3xl animate-pulse"></div>
        </div>

        <div className="page-container relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wider text-primary-light uppercase">
              <Leaf className="w-4 h-4" /> Tri thức xanh - Tương lai lành
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading leading-tight">
              Khám phá thế giới tự nhiên <span className="text-primary-light">qua từng trang sách</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
              GreenLeaf Books là không gian trưng bày và lưu trữ tri thức chuyên sâu về Động vật & Thực vật. Nơi kết nối những tâm hồn yêu thiên nhiên, học sinh, sinh viên và các nhà nghiên cứu sinh học.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="/books" className="btn-primary !bg-white !text-primary hover:!bg-primary-light hover:!text-primary-dark shadow-md flex items-center gap-2">
                Khám phá ngay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/books?category=thuc-vat" className="btn-outline !border-white/30 !text-white hover:!bg-white/10">
                Sách Thực vật
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            {/* Visual element representing nature and books */}
            <div className="relative w-72 h-72 md:w-80 md:h-80 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 p-6 flex flex-col justify-between shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">GreenLeaf Showcase</span>
                <BookOpen className="w-8 h-8 text-primary-light" />
              </div>
              <div className="space-y-4">
                <p className="text-white/90 font-medium italic text-lg leading-snug">
                  "Trong mọi góc của thiên nhiên đều ẩn chứa một điều kỳ diệu."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-light"></div>
                  <span className="text-xs text-white/60">Aristotle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="page-container space-y-8">
        <div className="text-center space-y-2">
          <h2 className="section-title">Chủ Đề Khám Phá</h2>
          <p className="section-subtitle">Lựa chọn lĩnh vực bạn muốn tìm hiểu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Animal Category Card */}
          <Link
            to="/books?category=dong-vat"
            className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-8"
          >
            {/* Decorative background color/gradient since no physical image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-emerald-950/80 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
              <PawPrint className="w-32 h-32 text-white/5 absolute -right-6 -bottom-6 rotate-12" />
            </div>

            <div className="relative z-20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-light/20 flex items-center justify-center text-primary-light border border-primary-light/30">
                <PawPrint className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-heading">Thế Giới Động Vật</h3>
              <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                Khám phá sự đa dạng của các sinh vật có vú, các loài chim, sinh vật biển và côn trùng kỳ bí.
              </p>
              <span className="inline-flex items-center gap-1.5 text-primary-light text-sm font-semibold pt-2 group-hover:gap-3 transition-all">
                Xem danh sách sách <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Plant Category Card */}
          <Link
            to="/books?category=thuc-vat"
            className="group relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-end p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-teal-950/80 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
              <TreePine className="w-32 h-32 text-white/5 absolute -right-6 -bottom-6 rotate-12" />
            </div>

            <div className="relative z-20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-light/20 flex items-center justify-center text-primary-light border border-primary-light/30">
                <TreePine className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white font-heading">Thế Giới Thực Vật</h3>
              <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                Tìm hiểu thực vật học đại cương, nghệ thuật làm vườn, các loại thảo dược y học quý hiếm.
              </p>
              <span className="inline-flex items-center gap-1.5 text-primary-light text-sm font-semibold pt-2 group-hover:gap-3 transition-all">
                Xem danh sách sách <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="page-container space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-text">Sách Nổi Bật</h2>
              <p className="text-text-secondary text-sm">Những tác phẩm đặc sắc khuyên đọc</p>
            </div>
          </div>
          <Link to="/books" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            Xem tất cả sách <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse aspect-[3/4] bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : featuredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredBooks.map(book => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Chưa có tác phẩm nổi bật nào</h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">Các đầu sách nổi bật đang được chúng tôi cập nhật và chuẩn bị đưa lên kệ trưng bày.</p>
          </div>
        )}
      </section>

      {/* Mission & Purpose */}
      <section className="bg-white py-16 border-y border-gray-200/50">
        <div className="page-container grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Không Gian Phi Thương Mại</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Trang web trưng bày sách thuần túy, phi lợi nhuận nhằm mục đích lan tỏa và chia sẻ tri thức sinh vật học rộng rãi.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Chất Lượng & Tin Cậy</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Nguồn tư liệu, tác phẩm được chọn lọc kỹ càng từ các nhà xuất bản khoa học, giáo trình đại học chuẩn xác.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-lg text-primary-dark">Đồng Hành Học Tập</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Cung cấp các công cụ tìm kiếm, phân lọc thông minh giúp học sinh, giáo viên dễ dàng tiếp cận đề mục cần tra cứu.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
