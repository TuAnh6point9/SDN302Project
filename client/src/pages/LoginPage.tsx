import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Leaf, Lock, Mail, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '../utils/errors';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      showToast(errorParam, 'error');
    }
  }, [searchParams, showToast]);

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      const from = location.state?.from as string | undefined;
      showToast('Đăng nhập thành công!', 'success');
      navigate(from || (loggedInUser.role === 'admin' ? '/admin/dashboard' : '/'));
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="absolute top-6 left-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-primary-dark">GreenLeaf Books</h2>
          <p className="text-text-secondary text-sm mt-1.5">Đăng nhập để mua sách hoặc quản trị hệ thống</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Địa chỉ Email
              </label>
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary-dark">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-field !pl-11"
                  disabled={loading}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="input-field !pl-11"
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Đăng nhập'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-text-secondary font-medium">Hoặc</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2.5 py-3 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-text-primary hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm focus:outline-none disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="mt-6 text-center text-xs text-text-secondary leading-relaxed border-t border-gray-100 pt-4">
            Khách hàng có thể đăng nhập để mua sách và theo dõi đơn hàng. Tài khoản admin sẽ được chuyển tới khu vực quản trị.
          </div>
          <div className="mt-4 text-center text-sm text-text-secondary">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-dark">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
