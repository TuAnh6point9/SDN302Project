import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const delta = 2;

    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);

    if (left > 2) pages.push('...');

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) pages.push('...');

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8" id="pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-text-secondary
                   hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:bg-transparent
                   disabled:hover:text-text-secondary disabled:hover:border-gray-200 transition-all duration-200"
        id="pagination-prev"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-text-secondary text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200
              ${page === p
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'border border-gray-200 text-text-secondary hover:bg-primary-light/20 hover:text-primary hover:border-primary-light'
              }`}
            id={`pagination-page-${p}`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-text-secondary
                   hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:hover:bg-transparent
                   disabled:hover:text-text-secondary disabled:hover:border-gray-200 transition-all duration-200"
        id="pagination-next"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
