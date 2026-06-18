/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { reviewApi } from '../../api/reviewApi';
import type { IReview } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

export default function ReviewsManagePage() {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [deletingId, setDeletingId] = useState('');

  const fetchReviews = () => {
    setLoading(true);
    setError('');
    reviewApi.getAllReviews()
      .then(setReviews)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể tải đánh giá.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const book = typeof review.book === 'object' ? review.book : null;
      const matchesRating = rating === 'all' || review.rating === Number(rating);
      const matchesSearch = !keyword
        || review.user.name.toLowerCase().includes(keyword)
        || Boolean(book?.title.toLowerCase().includes(keyword))
        || Boolean(review.comment?.toLowerCase().includes(keyword));

      return matchesRating && matchesSearch;
    });
  }, [rating, reviews, search]);

  const handleDelete = async (review: IReview) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    setDeletingId(review._id);
    setError('');
    try {
      await reviewApi.deleteReview(review._id);
      setReviews((current) => current.filter((item) => item._id !== review._id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể xóa đánh giá.'));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản lý đánh giá</h2>
          <p className="text-xs text-text-secondary">Theo dõi và xóa đánh giá spam hoặc không phù hợp</p>
        </div>
        <button onClick={fetchReviews} className="btn-outline !py-2.5 text-sm">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-field !py-2.5 !pl-9 text-sm"
              placeholder="Tìm theo sách, người đánh giá hoặc nội dung"
            />
          </div>
          <select value={rating} onChange={(event) => setRating(event.target.value as typeof rating)} className="input-field !py-2.5 text-sm">
            <option value="all">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </section>

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <span className="text-sm text-text-secondary mt-3 block">Đang tải đánh giá...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Không có đánh giá phù hợp</h3>
          </div>
        ) : (
          <div className="divide-y divide-gray-150">
            {filteredReviews.map((review) => {
              const book = typeof review.book === 'object' ? review.book : null;
              return (
                <article key={review._id} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-text">{book?.title || 'Sách đã xóa'}</h3>
                      <p className="text-xs text-text-secondary">
                        {review.user.name} • {new Date(review.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-sm text-yellow-600 font-semibold">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> {review.rating}/5
                    </div>
                    {review.comment && <p className="text-sm text-text-secondary max-w-3xl">{review.comment}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === review._id}
                    onClick={() => void handleDelete(review)}
                    className="btn-outline !py-2 text-xs text-red-600 border-red-100 hover:bg-red-50 self-start"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
