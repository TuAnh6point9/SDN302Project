import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Leaf, Lock, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/errors';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const registeredUser = await register({
        name,
        email,
        password,
        phone: phone || undefined,
      });
      navigate(registeredUser.role === 'admin' ? '/admin/books' : '/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể tạo tài khoản. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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
          <h2 className="text-3xl font-extrabold font-heading text-primary-dark">Tạo tài khoản</h2>
          <p className="text-text-secondary text-sm mt-1.5">Mua sách và theo dõi đơn hàng của bạn</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Họ và tên"
                className="input-field !pl-11"
                disabled={loading}
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="input-field !pl-11"
                disabled={loading}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Số điện thoại"
                className="input-field !pl-11"
                disabled={loading}
              />
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mật khẩu tối thiểu 8 ký tự"
                className="input-field !pl-11"
                disabled={loading}
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
