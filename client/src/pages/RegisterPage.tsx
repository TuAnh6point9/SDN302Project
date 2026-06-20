import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Lock, Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getApiErrorMessage } from '../utils/errors';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const getFieldError = (field: string, val: string): string => {
    switch (field) {
      case 'name':
        if (!val) return 'Họ và tên không được để trống';
        if (val.trim().length === 0) return 'Họ và tên không được chỉ chứa khoảng trắng';
        if (val.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
        return '';
      case 'email':
        if (!val) return 'Email không được để trống';
        if (!/\S+@\S+\.\S+/.test(val)) return 'Email không đúng định dạng';
        if (!val.toLowerCase().endsWith('@gmail.com')) {
          return 'Email phải có định dạng abc@gmail.com';
        }
        return '';
      case 'phone':
        if (val && val.length < 10) return 'Số điện thoại phải có ít nhất 10 số';
        return '';
      case 'password':
        if (!val) return 'Mật khẩu không được để trống';
        if (val.length < 8) return 'Mật khẩu phải chứa ít nhất 8 ký tự';
        if (!/[A-Z]/.test(val)) return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
        if (!/[a-z]/.test(val)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
        if (!/[0-9]/.test(val)) return 'Mật khẩu phải chứa ít nhất 1 chữ số';
        return '';
      case 'confirmPassword':
        if (!val) return 'Vui lòng xác nhận mật khẩu';
        if (val !== password) return 'Mật khẩu xác nhận không trùng khớp';
        return '';
      default:
        return '';
    }
  };

  const errors: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  if (touched.name) errors.name = getFieldError('name', name) || undefined;
  if (touched.email) errors.email = getFieldError('email', email) || undefined;
  if (touched.phone) errors.phone = getFieldError('phone', phone) || undefined;
  if (touched.password) errors.password = getFieldError('password', password) || undefined;
  if (touched.confirmPassword) errors.confirmPassword = getFieldError('confirmPassword', confirmPassword) || undefined;

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const nameErr = getFieldError('name', name);
    const emailErr = getFieldError('email', email);
    const phoneErr = getFieldError('phone', phone);
    const passErr = getFieldError('password', password);
    const confirmPassErr = getFieldError('confirmPassword', confirmPassword);

    if (nameErr || emailErr || phoneErr || passErr || confirmPassErr) {
      showToast('Vui lòng sửa các lỗi trong biểu mẫu trước khi gửi.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        name,
        email,
        password,
        phone: phone || undefined,
      });
      if ('otpRequired' in response) {
        showToast('Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực!', 'success');
        navigate(`/verify-otp?email=${encodeURIComponent(response.email)}`);
      } else {
        showToast('Đăng ký tài khoản thành công!', 'success');
        navigate(response.role === 'admin' ? '/admin/books' : '/');
      }
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Không thể tạo tài khoản. Vui lòng thử lại.'), 'error');
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
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  placeholder="Họ và tên"
                  className={`input-field !pl-11 ${errors.name ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs font-semibold pl-1 animate-in fade-in duration-200">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  placeholder="Email"
                  className={`input-field !pl-11 ${errors.email ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-semibold pl-1 animate-in fade-in duration-200">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    const cleanPhone = event.target.value.replace(/\D/g, '');
                    setPhone(cleanPhone);
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                  placeholder="Số điện thoại"
                  className={`input-field !pl-11 ${errors.phone ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs font-semibold pl-1 animate-in fade-in duration-200">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="Mật khẩu"
                  className={`input-field !pl-11 !pr-10 ${errors.password ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs font-semibold pl-1 animate-in fade-in duration-200">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                  placeholder="Xác nhận mật khẩu"
                  className={`input-field !pl-11 !pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}`}
                  disabled={loading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-semibold pl-1 animate-in fade-in duration-200">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Đăng ký'}
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
