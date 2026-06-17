import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '../utils/errors';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      const from = location.state?.from as string | undefined;
      navigate(from || (loggedInUser.role === 'admin' ? '/admin/dashboard' : '/'));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.'));
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
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Địa chỉ Email
              </label>
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
