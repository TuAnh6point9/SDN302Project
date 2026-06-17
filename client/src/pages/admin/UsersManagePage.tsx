/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import type { IUser, UserRole } from '../../types';
import { getApiErrorMessage } from '../../utils/errors';

const roleLabels: Record<UserRole, string> = {
  customer: 'Khách hàng',
  admin: 'Quản trị',
};

export default function UsersManagePage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    userApi.getUsers()
      .then(setUsers)
      .catch((err: unknown) => setError(getApiErrorMessage(err, 'Không thể tải danh sách người dùng.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id: string, payload: { role?: UserRole; isActive?: boolean }) => {
    setUpdatingId(id);
    setError('');
    try {
      const updated = await userApi.updateUser(id, payload);
      setUsers((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật người dùng.'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-text">Quản lý người dùng</h2>
          <p className="text-xs text-text-secondary">Phân quyền và khóa tài khoản khi cần kiểm soát truy cập</p>
        </div>
        <button onClick={fetchUsers} className="btn-outline !py-2.5 text-sm">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto" />
            <span className="text-sm text-text-secondary mt-3 block">Đang tải người dùng...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-semibold text-text">Chưa có người dùng</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 text-text-secondary text-xs uppercase tracking-wider font-semibold border-b border-gray-150">
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {users.map((user) => {
                  const isSelf = user._id === currentUser?._id;
                  return (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && <ShieldCheck className="w-4 h-4 text-primary" />}
                        </p>
                        <p className="text-xs text-text-secondary">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{user.phone || 'Chưa có'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          disabled={updatingId === user._id}
                          onChange={(event) => void updateUser(user._id, { role: event.target.value as UserRole })}
                          className="input-field !py-2 text-sm min-w-32"
                        >
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge text-[11px] ${user.isActive ? '' : 'bg-red-50 text-red-700'}`}>
                          {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4">
                        <button
                          disabled={updatingId === user._id || isSelf}
                          onClick={() => void updateUser(user._id, { isActive: !user.isActive })}
                          className={user.isActive ? 'btn-outline !py-2 text-xs' : 'btn-primary !py-2 text-xs'}
                        >
                          {user.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
