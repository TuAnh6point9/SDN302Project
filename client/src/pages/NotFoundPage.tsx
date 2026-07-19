import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center space-y-4">
        <Compass className="w-14 h-14 text-gray-300 mx-auto" />
        <p className="text-5xl font-bold font-heading text-text">404</p>
        <h1 className="text-lg font-semibold">Không tìm thấy trang bạn cần</h1>
        <p className="text-text-secondary text-sm">
          Đường dẫn không tồn tại hoặc đã bị thay đổi. Hãy quay về trang chủ hoặc tiếp tục khám phá kho sách.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/" className="btn-primary">
            Về trang chủ
          </Link>
          <Link
            to="/books"
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-text hover:border-primary hover:text-primary transition-colors"
          >
            Khám phá sách
          </Link>
        </div>
      </div>
    </div>
  );
}
