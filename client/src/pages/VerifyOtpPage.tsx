/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/authApi';
import { useToast } from '../contexts/ToastContext';
import { Leaf, Mail, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '../utils/errors';

export default function VerifyOtpPage() {
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otp = otpValues.join('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(300);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start the countdown timer
  useEffect(() => {
    if (!email) {
      showToast('Thiếu thông tin email để xác thực.', 'error');
      return;
    }

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email, showToast, startTimer]);

  const handleChange = (value: string, index: number) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    const newVals = [...otpValues];
    
    if (!cleanVal) {
      newVals[index] = '';
      setOtpValues(newVals);
      return;
    }

    const digit = cleanVal[cleanVal.length - 1];
    newVals[index] = digit;
    setOtpValues(newVals);

    // Automatically focus next element
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace') {
      const newVals = [...otpValues];
      if (!otpValues[index] && index > 0) {
        newVals[index - 1] = '';
        setOtpValues(newVals);
        inputRefs.current[index - 1]?.focus();
      } else {
        newVals[index] = '';
        setOtpValues(newVals);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').trim();
    const numbersOnly = pastedData.replace(/[^0-9]/g, '');
    
    if (numbersOnly.length === 6) {
      const digits = numbersOnly.split('').slice(0, 6);
      setOtpValues(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      showToast('Mã OTP phải chứa đúng 6 chữ số.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.verifyGoogleOtp({ email, otp });
      showToast('Xác thực tài khoản thành công! Đang chuyển hướng...', 'success');
      
      // Update local storage and authentication context
      setTimeout(() => {
        loginWithToken(response.token, response.user);
        navigate(response.user.role === 'admin' ? '/admin/dashboard' : '/');
      }, 1500);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;

    setResending(true);

    try {
      const response = await authApi.resendGoogleOtp(email);
      showToast(response.message || 'Mã OTP mới đã được gửi thành công.', 'success');
      setOtpValues(['', '', '', '', '', '']); // Reset inputs
      startTimer();
      // Focus first input box after reset
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại.'), 'error');
    } finally {
      setResending(false);
    }
  };

  // Format time (e.g. 04:59)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      <div className="absolute top-6 left-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-primary-dark">Xác thực tài khoản</h2>
          <p className="text-text-secondary text-sm mt-1.5">
            Nhập mã xác thực đã được gửi tới địa chỉ email của bạn
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          <div className="mb-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <span className="font-semibold text-text-primary text-sm break-all">{email}</span>
          </div>

          <form className="space-y-6" onSubmit={handleVerify}>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block text-center mb-1">
                Mã OTP (6 chữ số)
              </label>
              
              <div className="flex justify-between gap-2 max-w-xs mx-auto mb-6" onPaste={handlePaste}>
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono outline-none border-2 border-gray-100 focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl bg-white transition-all shadow-sm focus:shadow-md"
                    disabled={loading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-sm">
              {timeLeft > 0 ? (
                <span className="text-text-secondary">
                  Mã OTP hết hạn sau <span className="font-bold font-mono text-primary">{formatTime(timeLeft)}</span>
                </span>
              ) : (
                <span className="text-red-500 font-medium">Mã OTP đã hết hạn. Vui lòng gửi lại.</span>
              )}
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full shadow-lg shadow-primary/20">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                'Xác nhận'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm border-t border-gray-100 pt-4">
            <span className="text-text-secondary">Không nhận được mã? </span>
            <button
              onClick={handleResend}
              disabled={timeLeft > 0 || resending}
              className={`font-semibold transition-colors ${
                timeLeft > 0 || resending
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary hover:text-primary-dark'
              }`}
            >
              {resending ? 'Đang gửi...' : 'Gửi lại mã'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
