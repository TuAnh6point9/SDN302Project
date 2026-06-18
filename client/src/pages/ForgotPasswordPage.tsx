import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Leaf, Mail } from 'lucide-react';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../utils/errors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      setMessage(result);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-6 left-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold font-heading text-primary-dark">Quên mật khẩu</h1>
          <p className="text-text-secondary text-sm mt-1.5">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form onSubmit={handleSubmit} className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10 space-y-5">
          {message && (
            <div className="flex items-start gap-2.5 bg-green-50 text-green-700 p-3.5 rounded-xl text-sm border border-green-100">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field !pl-11"
                placeholder="you@example.com"
                disabled={loading}
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Gửi liên kết'}
          </button>
        </form>
      </div>
    </div>
  );
}
