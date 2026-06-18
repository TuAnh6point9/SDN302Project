import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import type { IBook, ICategory } from '../types';
import { resolveAssetUrl } from '../utils/assetUrl';

interface BookCardProps {
  book: IBook;
}

export default function BookCard({ book }: BookCardProps) {
  const category = typeof book.category === 'object' ? (book.category as ICategory) : null;
  const coverImage = resolveAssetUrl(book.images[0]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <Link
      to={`/books/${book.slug}`}
      className="card-hover group flex flex-col h-full"
      id={`book-card-${book.slug}`}
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-primary-light/20 to-primary/10 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-primary/40 gap-3">
            <BookOpen className="w-12 h-12" strokeWidth={1} />
            <span className="text-xs font-medium">Chưa có ảnh bìa</span>
          </div>
        )}

        {book.isFeatured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
            Nổi bật
          </div>
        )}

        {category && (
          <div className="absolute bottom-3 left-3 badge text-[10px] bg-white/90 backdrop-blur-sm shadow-sm">
            {category.name}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-heading font-semibold text-sm text-text line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {book.title}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-1">{book.author}</p>

        <div className="mt-auto pt-3 flex items-end justify-between">
          {book.price > 0 ? (
            <div className="flex items-baseline gap-2">
              {book.discountPrice ? (
                <>
                  <span className="font-heading font-bold text-primary text-sm">
                    {formatPrice(book.discountPrice)}
                  </span>
                  <span className="text-xs text-text-secondary line-through">
                    {formatPrice(book.price)}
                  </span>
                </>
              ) : (
                <span className="font-heading font-bold text-primary text-sm">
                  {formatPrice(book.price)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-text-secondary italic">Liên hệ</span>
          )}

          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Xem chi tiết →
          </span>
        </div>
      </div>
    </Link>
  );
}
