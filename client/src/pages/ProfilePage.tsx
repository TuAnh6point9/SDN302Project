import { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, MapPin, Save, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/errors';
import type { IUserAddress } from '../types';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const defaultAddress = user?.addresses?.find((address) => address.isDefault) ?? user?.addresses?.[0];

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [recipientName, setRecipientName] = useState(defaultAddress?.recipientName ?? user?.name ?? '');
  const [addressPhone, setAddressPhone] = useState(defaultAddress?.phone ?? user?.phone ?? '');
  const [addressLine, setAddressLine] = useState(defaultAddress?.addressLine ?? '');
  const [city, setCity] = useState(defaultAddress?.city ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSubmittingProfile(true);

    const addresses: IUserAddress[] = [{
      recipientName,
      phone: addressPhone,
      addressLine,
      city,
      isDefault: true,
    }];

    try {
      await updateProfile({
        name,
        phone: phone || undefined,
        addresses,
      });
      setProfileSuccess('Đã cập nhật hồ sơ.');
    } catch (err: unknown) {
      setProfileError(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmittingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Đã đổi mật khẩu.');
    } catch (err: unknown) {
      setPasswordError(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-text">Hồ sơ cá nhân</h1>
        <p className="text-text-secondary text-sm mt-1">Quản lý thông tin dùng cho đặt hàng và giao nhận</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Thông tin tài khoản
          </h2>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Họ và tên</label>
            <input
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="input-field mt-1 disabled:bg-gray-50 disabled:text-text-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Số điện thoại</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="input-field mt-1"
            />
          </div>
        </section>

        <section className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Địa chỉ mặc định
          </h2>

          {profileError && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-start gap-2 bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Người nhận</label>
              <input
                required
                minLength={2}
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Số điện thoại nhận hàng</label>
              <input
                required
                minLength={8}
                value={addressPhone}
                onChange={(event) => setAddressPhone(event.target.value)}
                className="input-field mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Địa chỉ</label>
            <input
              required
              minLength={5}
              value={addressLine}
              onChange={(event) => setAddressLine(event.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tỉnh / thành phố</label>
            <input
              required
              minLength={2}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="input-field mt-1"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" disabled={submittingProfile} className="btn-primary disabled:opacity-50">
              {submittingProfile ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu hồ sơ
                </>
              )}
            </button>
          </div>
        </section>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" /> Đổi mật khẩu
        </h2>

        {passwordError && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}
        {passwordSuccess && (
          <div className="flex items-start gap-2 bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Mật khẩu hiện tại</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="input-field mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-field mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button type="submit" disabled={submittingPassword} className="btn-primary disabled:opacity-50">
            {submittingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}
