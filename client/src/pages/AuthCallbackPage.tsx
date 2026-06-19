/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/authApi';
import { Leaf, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '../utils/errors';

export default function AuthCallbackPage() {
  const { loginWithToken } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Mã xác thực không hợp lệ.');
      return;
    }

    // Save token temporarily so API client can load current user
    localStorage.setItem('greenleaf_token', token);

    authApi.getMe()
      .then((user) => {
        loginWithToken(token, user);
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/');
      })
      .catch((err: unknown) => {
        localStorage.removeItem('greenleaf_token');
        setError(getApiErrorMessage(err, 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.'));
      });
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-primary-dark">GreenLeaf Books</h2>
          <p className="text-text-secondary text-sm mt-1.5">Đang xử lý đăng nhập bằng Google...</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10 text-center">
          {error ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full shadow-lg shadow-primary/20"
              >
                Quay lại trang Đăng nhập
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <p className="text-text-secondary text-sm">Vui lòng chờ trong giây lát...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
