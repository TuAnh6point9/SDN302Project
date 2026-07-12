import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ClipboardList,
  FolderTree,
  Gift,
  Home,
  Leaf,
  LogOut,
  Menu,
  MessageSquare,
  TicketPercent,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RouteTitle from '../components/RouteTitle';
import TopLoadingBar from '../components/TopLoadingBar';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: BarChart3 },
  { to: '/admin/books', label: 'Quản lý sách', icon: BookOpen },
  { to: '/admin/categories', label: 'Quản lý danh mục', icon: FolderTree },
  { to: '/admin/orders', label: 'Quản lý đơn hàng', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Quản lý tồn kho', icon: Boxes },
  { to: '/admin/vouchers', label: 'Quản lý voucher', icon: TicketPercent },
  { to: '/admin/rewards', label: 'Điểm thưởng', icon: Gift },
  { to: '/admin/reviews', label: 'Quản lý đánh giá', icon: MessageSquare },
  { to: '/admin/users', label: 'Quản lý người dùng', icon: Users },
  { to: '/notifications', label: 'Thông báo', icon: Bell },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TopLoadingBar />
      <RouteTitle />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary-dark text-white flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-light" />
            </div>
            <span className="font-heading font-bold text-sm">Admin Panel</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
          <div className="px-3 py-2 text-xs text-white/50 truncate">
            {user?.name} ({user?.email})
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-heading font-semibold text-lg text-text">Bảng điều khiển</h1>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
