/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookApi } from '../api/bookApi';
import { categoryApi } from '../api/categoryApi';
import BookCard from '../components/BookCard';
import BookCardSkeleton from '../components/BookCardSkeleton';
import Pagination from '../components/Pagination';
import CategoryTree from '../components/CategoryTree';
import { BookOpen, SlidersHorizontal, ArrowUpDown, X, Tag, Star } from 'lucide-react';
import type { IBook, IBooksQueryParams, ICategory } from '../types';

const PRESET_TAGS = ['Sách hiếm', 'Khám phá', 'Giáo trình', 'Sách ảnh', 'Sinh thái', 'Hướng dẫn'];

const findCategoryBySlug = (slug: string, catList: ICategory[]): ICategory | null => {
  for (const cat of catList) {
    if (cat.slug === slug) return cat;
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryBySlug(slug, cat.children as unknown as ICategory[]);
      if (found) return found;
    }
  }
  return null;
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [books, setBooks] = useState<IBook[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [bestSellerIds, setBestSellerIds] = useState<Set<string>>(new Set());
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse state from URL params
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = (searchParams.get('sort') || 'newest') as IBooksQueryParams['sort'];
  const page = parseInt(searchParams.get('page') || '1', 10);
  const selectedTag = searchParams.get('tag') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const minRating = searchParams.get('minRating') || '';

  useEffect(() => {
    categoryApi.getCategories()
      .then(setCategories)
      .catch(err => console.error('Error fetching categories:', err));

    bookApi.getBestSellerIds()
      .then((ids) => setBestSellerIds(new Set(ids)))
      .catch(() => {
        // Badge chỉ là tiện ích hiển thị — lỗi thì bỏ qua
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    // Build params for api call
    const params: IBooksQueryParams = {
      page,
      limit: 12,
      sort,
    };

    if (category) params.category = category;
    if (search) params.search = search;
    if (selectedTag) params.tag = selectedTag;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (inStock) params.inStock = true;
    if (minRating) params.minRating = Number(minRating);

    bookApi.getBooks(params)
      .then(res => {
        setBooks(res.books);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(err => console.error('Error fetching books:', err))
      .finally(() => setLoading(false));
  }, [category, search, sort, page, selectedTag, minPrice, maxPrice, inStock, minRating]);

  const updateParam = (key: string, value: string | number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, String(value));
      } else {
        next.delete(key);
      }
      // Reset page when filter changes
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setShowMobileFilters(false);
  };

  const activeCategory = category ? findCategoryBySlug(category, categories) : null;

  return (
    <div className="page-container py-8 space-y-6">
      {/* Title / Info Bar or Category Banner */}
      {activeCategory ? (
        <div className="relative rounded-3xl overflow-hidden shadow-md py-10 px-8 text-white min-h-[160px] flex flex-col justify-center">
          {activeCategory.image ? (
            <img
              src={activeCategory.image}
              alt={activeCategory.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-light bg-white/10 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">Danh mục</span>
              {(category || search || selectedTag || minPrice || maxPrice || inStock || minRating) && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-100 bg-red-950/20 hover:bg-red-900/30 px-2 py-0.5 rounded-lg border border-red-500/20 backdrop-blur-sm transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <h1 className="text-3xl font-bold font-heading">{activeCategory.name}</h1>
            <p className="text-white/80 text-sm leading-relaxed">
              {activeCategory.description || 'Khám phá các cuốn sách thuộc chủ đề này.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-text">
              {search ? `Kết quả tìm kiếm cho "${search}"` : 'Trưng Bày Sách'}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Không gian giới thiệu và tìm hiểu thông tin đa dạng các loài
            </p>
          </div>

          {/* Clear Filters Button (Visible if active filters) */}
          {(category || search || selectedTag || minPrice || maxPrice || inStock || minRating) && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors w-fit"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mobile Filters Toggle Button */}
        <div className="lg:hidden flex gap-4 w-full">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text rounded-xl shadow-sm text-sm font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" /> Bộ lọc
          </button>
          <div className="relative flex-1">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold appearance-none focus:outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="featured">Nổi bật</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          </div>
        </div>

        {/* Left Side: Sidebar Filter (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
          {/* Category Section */}
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-primary-dark border-b border-gray-100 pb-2">
              Danh mục
            </h3>
            <CategoryTree
              categories={categories}
              selectedCategory={category}
              onSelectCategory={(slug) => updateParam('category', slug)}
            />
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-primary-dark border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> Thẻ từ khóa
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => updateParam('tag', selectedTag === tag ? '' : tag)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-250 ${
                    selectedTag === tag
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'bg-background hover:bg-primary-light/10 border-transparent text-text-secondary hover:text-primary'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-primary-dark border-b border-gray-100 pb-2">
              Giá và tình trạng
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                placeholder="Giá từ"
                className="input-field !py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="Giá đến"
                className="input-field !py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Chỉ hiển thị sách còn hàng
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-primary-dark border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Star className="w-4 h-4" /> Đánh giá tối thiểu
            </h3>
            <select
              value={minRating}
              onChange={(e) => updateParam('minRating', e.target.value)}
              className="input-field !py-2 text-sm"
            >
              <option value="">Tất cả đánh giá</option>
              <option value="4">Từ 4 sao</option>
              <option value="3">Từ 3 sao</option>
              <option value="2">Từ 2 sao</option>
              <option value="1">Từ 1 sao</option>
            </select>
          </div>
        </aside>

        {/* Right Side: List & Pagination */}
        <div className="lg:col-span-9 space-y-6">
          {/* Desktop Toolbar */}
          <div className="hidden lg:flex items-center justify-between bg-white border border-gray-100 px-5 py-3 rounded-2xl shadow-sm">
            <span className="text-sm text-text-secondary">
              Hiển thị sách trưng bày
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">Sắp xếp:</span>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-background border-none rounded-xl text-sm font-semibold appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text"
              >
                <option value="newest">Mới nhất</option>
                <option value="featured">Nổi bật</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Book Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))}
            </div>
          ) : books.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map(book => (
                  <BookCard key={book._id} book={book} isBestSeller={bestSellerIds.has(book._id)} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => updateParam('page', p)}
              />
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 p-8 space-y-3">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="text-lg font-semibold text-text">Không tìm thấy cuốn sách nào</h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Hiện tại chưa có đầu sách nào khớp với lựa chọn của bạn. Thử tìm kiếm từ khóa khác hoặc xóa bộ lọc.
              </p>
              <button
                onClick={clearAllFilters}
                className="btn-primary mt-2"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Dialog */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-background/95 backdrop-blur-sm p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
            <h2 className="text-xl font-bold font-heading text-primary-dark">Bộ lọc tìm kiếm</h2>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-gray-200 rounded-lg text-text-secondary"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Categories */}
          <div className="space-y-4 mb-8">
            <h3 className="font-heading font-semibold text-text border-b border-gray-100 pb-1.5">Danh mục</h3>
            <CategoryTree
              categories={categories}
              selectedCategory={category}
              onSelectCategory={(slug) => {
                updateParam('category', slug);
                setShowMobileFilters(false);
              }}
            />
          </div>

          {/* Filter Tags */}
          <div className="space-y-4 mb-8">
            <h3 className="font-heading font-semibold text-text border-b border-gray-100 pb-1.5">Từ khóa</h3>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    updateParam('tag', selectedTag === tag ? '' : tag);
                    setShowMobileFilters(false);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                    selectedTag === tag
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'bg-white border-gray-200 text-text-secondary'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-heading font-semibold text-text border-b border-gray-100 pb-1.5">Giá và tình trạng</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                placeholder="Giá từ"
                className="input-field !py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="Giá đến"
                className="input-field !py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Chỉ hiển thị sách còn hàng
            </label>
            <select
              value={minRating}
              onChange={(e) => updateParam('minRating', e.target.value)}
              className="input-field !py-2 text-sm"
            >
              <option value="">Tất cả đánh giá</option>
              <option value="4">Từ 4 sao</option>
              <option value="3">Từ 3 sao</option>
              <option value="2">Từ 2 sao</option>
              <option value="1">Từ 1 sao</option>
            </select>
          </div>

          <button
            onClick={clearAllFilters}
            className="btn-outline !py-3 w-full mt-auto"
          >
            Mặc định tất cả
          </button>
        </div>
      )}
    </div>
  );
}
