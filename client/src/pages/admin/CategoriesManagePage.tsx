/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';
import { Plus, FolderTree, AlertCircle, Folder, Leaf } from 'lucide-react';
import type { ICategory } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

export default function CategoriesManagePage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    categoryApi.getCategories()
      .then(setCategories)
      .catch(err => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAddForm = () => {
    setName('');
    setDescription('');
    setParentId('');
    setError('');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!parentId) {
      setError('Vui lòng chọn danh mục cấp cha (Động vật hoặc Thực vật).');
      return;
    }

    setSubmitting(true);
    try {
      await categoryApi.createCategory({
        name,
        description: description || undefined,
        parent: parentId
      });
      setIsAdding(false);
      fetchCategories();
    } catch (err: unknown) {
      console.error('Error creating category:', err);
      setError(getApiErrorMessage(err, 'Có lỗi xảy ra khi tạo danh mục.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản Lý Cây Danh Mục</h2>
          <p className="text-xs text-text-secondary">Chỉnh sửa phân loại chủ đề Động vật & Thực vật</p>
        </div>
        {!isAdding && (
          <button
            onClick={handleOpenAddForm}
            className="btn-primary inline-flex items-center gap-1.5 !py-2.5"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục con
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Tree representation */}
        <div className="lg:col-span-7 bg-white border border-gray-200/60 p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="font-heading font-bold text-base text-primary-dark border-b border-gray-100 pb-3 flex items-center gap-2">
            <FolderTree className="w-5 h-5" /> Sơ đồ cây phân loại hiện tại
          </h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto" />
              <span className="text-sm text-text-secondary mt-3 block">Đang tải cây danh mục...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map(root => (
                <div key={root._id} className="border border-gray-100 rounded-2xl p-4 bg-background/30">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-heading font-bold text-sm text-primary flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary" /> {root.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                      Gốc
                    </span>
                  </div>
                  {root.children && root.children.length > 0 ? (
                    <div className="mt-3 pl-6 space-y-2 border-l-2 border-primary-light/30">
                      {root.children.map((child: ICategory) => (
                        <div key={child._id} className="flex flex-col p-2 bg-white rounded-xl border border-gray-100/80 shadow-sm text-xs gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-text flex items-center gap-1.5">
                              <Leaf className="w-3.5 h-3.5 text-primary-light" />
                              {child.name}
                            </span>
                            <span className="text-[10px] text-text-secondary italic">
                              /{child.slug}
                            </span>
                          </div>
                          {child.description && (
                            <p className="text-[11px] text-text-secondary">{child.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary italic mt-3 pl-6">
                      Chưa có danh mục con nào thuộc nhóm này.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-text-secondary">
              Không có dữ liệu danh mục.
            </div>
          )}
        </div>

        {/* Right Side: Add Form Side-panel */}
        <div className="lg:col-span-5">
          {isAdding ? (
            <div className="bg-white border border-gray-200/60 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-heading font-bold text-base text-primary-dark">Tạo Danh Mục Con Mới</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-text-secondary hover:text-text"
                >
                  Đóng lại
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Tên danh mục con *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Động vật có vú, Chim cảnh..."
                    className="input-field !py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Thuộc danh mục cha *</label>
                  <select
                    required
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="input-field !py-2.5 text-sm"
                  >
                    <option value="">-- Chọn danh mục gốc --</option>
                    {categories.map(root => (
                      <option key={root._id} value={root._id}>
                        {root.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Mô tả ngắn</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt ý nghĩa phân loại..."
                    className="input-field !py-2.5 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="btn-ghost flex-1 text-sm"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 text-sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-background/40 border border-gray-150 p-6 rounded-3xl text-center space-y-3">
              <Folder className="w-10 h-10 text-primary-light mx-auto" />
              <h4 className="font-heading font-semibold text-sm text-text-secondary">Thêm mới nhánh danh mục</h4>
              <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                Tất cả danh mục cấp 1 chỉ được phép là "Động vật" hoặc "Thực vật". Hãy tạo thêm các danh mục cấp con để dễ dàng phân lọc và quản lý sách trưng bày.
              </p>
              <button
                onClick={handleOpenAddForm}
                className="btn-outline !py-2 !px-4 text-xs font-semibold mt-2"
              >
                Tạo nhánh con mới
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
