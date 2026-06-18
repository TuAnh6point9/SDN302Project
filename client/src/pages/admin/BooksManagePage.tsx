/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { bookApi } from '../../api/bookApi';
import { categoryApi } from '../../api/categoryApi';
import { uploadApi } from '../../api/uploadApi';
import { Plus, Edit, Trash2, Search, X, Upload, AlertCircle, Award, FileText, Download } from 'lucide-react';
import type { IBook, IBookCreatePayload, ICategory } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function BooksManagePage() {
  const [books, setBooks] = useState<IBook[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
  const [stockQuantity, setStockQuantity] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isbn, setIsbn] = useState('');
  const [pagesCount, setPagesCount] = useState<number | undefined>(undefined);
  const [publishedYear, setPublishedYear] = useState<number | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvMessage, setCsvMessage] = useState('');

  useEffect(() => {
    // Fetch categories for dropdown (flatten list to child categories only)
    categoryApi.getCategories()
      .then(roots => {
        setCategories(roots);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    bookApi.getBooks({
      page,
      limit: 8,
      search: searchQuery,
      stockStatus,
    })
      .then(res => {
        setBooks(res.books);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(err => console.error('Error fetching books:', err))
      .finally(() => setLoading(false));
  }, [page, searchQuery, stockStatus]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenAddModal = () => {
    setEditingBookId(null);
    setTitle('');
    setAuthor('');
    setPublisher('');
    setDescription('');
    setPrice(0);
    setDiscountPrice(undefined);
    setStockQuantity(10);
    setCategoryId('');
    setTagsInput('');
    setIsbn('');
    setPagesCount(undefined);
    setPublishedYear(undefined);
    setIsFeatured(false);
    setUploadedImages([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: IBook) => {
    const catId = typeof book.category === 'object' ? book.category._id : book.category;
    setEditingBookId(book._id);
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher || '');
    setDescription(book.description);
    setPrice(book.price);
    setDiscountPrice(book.discountPrice);
    setStockQuantity(book.stockQuantity);
    setCategoryId(catId || '');
    setTagsInput(book.tags.join(', '));
    setIsbn(book.isbn || '');
    setPagesCount(book.pages);
    setPublishedYear(book.publishedYear);
    setIsFeatured(book.isFeatured);
    setUploadedImages(book.images);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError('');
    try {
      const url = await uploadApi.uploadBookImage(file);
      setUploadedImages(prev => [...prev, url]);
    } catch (err: unknown) {
      console.error('Image upload failed:', err);
      setFormError(getApiErrorMessage(err, 'Không thể upload ảnh bìa.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sách này khỏi showroom?')) return;
    try {
      await bookApi.deleteBook(id);
      fetchBooks();
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      alert(getApiErrorMessage(err, 'Không thể xóa sách.'));
    }
  };

  const handleExportCsv = async () => {
    setCsvMessage('');
    try {
      const blob = await bookApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `books-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setCsvMessage(getApiErrorMessage(err, 'Không thể xuất file CSV.'));
    }
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportingCsv(true);
    setCsvMessage('');
    try {
      const csv = await file.text();
      const result = await bookApi.importCsv(csv);
      setCsvMessage(`Đã nhập ${result.importedCount} sách. ${result.errors.length ? `${result.errors.length} dòng lỗi.` : ''}`);
      fetchBooks();
    } catch (err: unknown) {
      setCsvMessage(getApiErrorMessage(err, 'Không thể nhập file CSV.'));
    } finally {
      setImportingCsv(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!categoryId) {
      setFormError('Vui lòng chọn danh mục cho sách.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload: IBookCreatePayload = {
      title,
      author,
      publisher: publisher || undefined,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stockQuantity: Number(stockQuantity),
      category: categoryId,
      tags,
      isbn: isbn || undefined,
      pages: pagesCount ? Number(pagesCount) : undefined,
      publishedYear: publishedYear ? Number(publishedYear) : undefined,
      isFeatured,
      images: uploadedImages,
    };

    setSubmitting(true);
    try {
      if (editingBookId) {
        await bookApi.updateBook(editingBookId, payload);
      } else {
        await bookApi.createBook(payload);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err: unknown) {
      console.error('Submit failed:', err);
      setFormError(getApiErrorMessage(err, 'Lỗi khi lưu sách. Hãy kiểm tra các trường dữ liệu.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản Lý Trưng Bày Sách</h2>
          <p className="text-xs text-text-secondary">Thêm mới, chỉnh sửa thông tin sách</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-ghost inline-flex items-center gap-1.5 !py-2.5"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <label className="btn-ghost inline-flex items-center gap-1.5 !py-2.5 cursor-pointer">
            <Upload className="w-4 h-4" /> {importingCsv ? 'Đang nhập...' : 'Nhập CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              className="hidden"
              disabled={importingCsv}
            />
          </label>
          <button
            onClick={handleOpenAddModal}
            className="btn-primary inline-flex items-center gap-1.5 !py-2.5"
          >
            <Plus className="w-4 h-4" /> Thêm sách mới
          </button>
        </div>
      </div>

      {csvMessage && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-2xl text-sm">
          {csvMessage}
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-gray-200/60 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm sách theo tên, tác giả..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="input-field !py-2.5 !pl-10 text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <select
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock');
            setPage(1);
          }}
          className="input-field !py-2.5 text-sm md:max-w-56"
        >
          <option value="all">Tất cả tồn kho</option>
          <option value="in_stock">Còn hàng</option>
          <option value="low_stock">Sắp hết hàng</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
      </div>

      {/* Book table list */}
      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <span className="text-sm text-text-secondary mt-3 block">Đang tải dữ liệu...</span>
          </div>
        ) : books.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-gray-150">
                  <th className="px-6 py-4">Ảnh bìa</th>
                  <th className="px-6 py-4">Tên tác phẩm / Tác giả</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Giá tham khảo</th>
                  <th className="px-6 py-4">Nổi bật</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {books.map(book => {
                  const coverImage = book.images.length > 0 ? `${API_BASE}${book.images[0]}` : null;
                  const cat = typeof book.category === 'object' ? (book.category as ICategory) : null;
                  return (
                    <tr key={book._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 shrink-0">
                        <div className="w-12 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          {coverImage ? (
                            <img src={coverImage} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-text line-clamp-1">{book.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{book.author}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge text-[11px]">{cat?.name || 'Chưa phân loại'}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary">
                        {book.price > 0
                          ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)
                          : 'Liên hệ'}
                      </td>
                      <td className="px-6 py-4">
                        {book.isFeatured ? (
                          <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-200 font-medium">
                            <Award className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> Nổi bật
                          </span>
                        ) : (
                          <span className="text-xs text-text-secondary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(book)}
                          className="p-2 text-primary hover:bg-primary-light/10 rounded-xl transition-colors inline-flex items-center"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination inside table container */}
            <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between">
              <span className="text-xs text-text-secondary">Trang {page} / {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center space-y-2">
            <FileText className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Không có đầu sách nào</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">Chưa có đầu sách nào phù hợp với bộ tìm kiếm của bạn.</p>
          </div>
        )}
      </div>

      {/* Book Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-primary text-white p-5">
              <h3 className="font-heading font-bold text-base">
                {editingBookId ? 'Cập Nhật Sách Trưng Bày' : 'Thêm Sách Trưng Bày Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tiêu đề sách *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề sách"
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tác giả *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nhập tên tác giả"
                    className="input-field !py-2 text-sm"
                  />
                </div>
              </div>

              {/* Grid 2: Publisher & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Tên nhà xuất bản"
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Danh mục *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-field !py-2 text-sm"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(root => (
                      <optgroup key={root._id} label={root.name}>
                        {root.children?.map(child => (
                          <option key={child._id} value={child._id}>
                            {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Mô tả tóm tắt nội dung *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Viết nội dung mô tả chi tiết, trích dẫn về cuốn sách..."
                  className="input-field !py-2 text-sm"
                />
              </div>

              {/* Grid 3: Numbers & Spec */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Giá gốc (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Mã ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="ISBN"
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Số trang</label>
                  <input
                    type="number"
                    min={1}
                    value={pagesCount || ''}
                    onChange={(e) => setPagesCount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ví dụ: 320"
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Năm XB</label>
                  <input
                    type="number"
                    min={0}
                    value={publishedYear || ''}
                    onChange={(e) => setPublishedYear(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ví dụ: 2026"
                    className="input-field !py-2 text-sm"
                  />
                </div>
              </div>

              {/* Tags & Feature Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tags (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Ví dụ: Sách hiếm, Khám phá, Sinh học"
                    className="input-field !py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6 pl-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-semibold text-text cursor-pointer select-none">
                    Ghim sách nổi bật lên trang chủ
                  </label>
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">Ảnh bìa showroom</label>
                
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Upload Card */}
                  <label className="w-24 h-32 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-background/50 hover:bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] text-text-secondary font-semibold">Tải ảnh</span>
                      </>
                    )}
                  </label>

                  {/* Render uploaded image previews */}
                  {uploadedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-24 h-32 rounded-xl overflow-hidden group border border-gray-200">
                      <img src={`${API_BASE}${imgUrl}`} alt="Book preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-lg p-1 hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
