import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-sm p-10 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-lg font-semibold">Đã có lỗi xảy ra</h1>
          <p className="text-sm text-gray-500">
            Ứng dụng gặp sự cố không mong muốn. Tải lại trang để tiếp tục.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Tải lại trang
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium hover:border-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      </div>
    );
  }
}
