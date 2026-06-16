import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, User, Menu, X, ChevronDown,
  Leaf, PawPrint, TreePine, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categoryApi } from '../api/categoryApi';
import type { ICategory } from '../types';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoryApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    if (name.toLowerCase().includes('động vật')) return <PawPrint className="w-4 h-4" />;
    if (name.toLowerCase().includes('thực vật')) return <TreePine className="w-4 h-4" />;
    return <Leaf className="w-4 h-4" />;
  };

  return (
    <header className="sticky top-0 z-50 glass shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" id="header-logo">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg md:text-xl text-primary-dark">
              GreenLeaf <span className="text-primary">Books</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="btn-ghost text-sm" id="nav-home">
              Trang chủ
            </Link>

            {/* Category Dropdown */}
            <div ref={categoryDropdownRef} className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="btn-ghost text-sm flex items-center gap-1"
                id="nav-categories"
              >
                Danh mục
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pb-2 border-b border-gray-100">
                    <Link
                      to="/books"
                      className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    >
                      Xem tất cả sách →
                    </Link>
                  </div>
                  {categories.map((root) => (
                    <div key={root._id} className="py-2">
                      <Link
                        to={`/books?category=${root.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text hover:bg-primary-light/10 transition-colors"
                        onClick={() => setIsCategoryDropdownOpen(false)}
                      >
                        {getCategoryIcon(root.name)}
                        {root.name}
                      </Link>
                      {root.children?.map((child) => (
                        <Link
                          key={child._id}
                          to={`/books?category=${child.slug}`}
                          className="block pl-10 pr-4 py-1.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light/5 transition-colors"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link to="/books" className="btn-ghost text-sm" id="nav-all-books">
              Tất cả sách
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm sách..."
                    className="input-field !py-2 !pl-10 !pr-4 w-64 text-sm"
                    autoFocus
                    id="search-input"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                    className="ml-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="btn-ghost !p-2.5"
                  id="search-toggle"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Account Dropdown */}
            <div ref={accountDropdownRef} className="relative">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className={`btn-ghost !p-2.5 ${user ? 'text-primary' : ''}`}
                id="account-toggle"
              >
                <User className="w-5 h-5" />
              </button>

              {isAccountDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-text truncate">{user.name}</p>
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      </div>
                      {isAdmin && (
                        <Link
                          to="/admin/books"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light/5 transition-colors"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Quản lý hệ thống
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setIsAccountDropdownOpen(false); navigate('/'); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light/5 transition-colors"
                      onClick={() => setIsAccountDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Đăng nhập (Admin)
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden btn-ghost !p-2"
            id="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sách..."
                className="input-field !pl-10 text-sm"
                id="mobile-search-input"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            <Link to="/" className="block px-3 py-2 text-sm font-medium rounded-xl hover:bg-primary-light/10" onClick={() => setIsMobileMenuOpen(false)}>
              Trang chủ
            </Link>
            <Link to="/books" className="block px-3 py-2 text-sm font-medium rounded-xl hover:bg-primary-light/10" onClick={() => setIsMobileMenuOpen(false)}>
              Tất cả sách
            </Link>

            {/* Mobile Category Tree */}
            {categories.map((root) => (
              <div key={root._id} className="space-y-1">
                <Link
                  to={`/books?category=${root.slug}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-primary-light/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {getCategoryIcon(root.name)} {root.name}
                </Link>
                {root.children?.map((child) => (
                  <Link
                    key={child._id}
                    to={`/books?category=${child.slug}`}
                    className="block pl-9 pr-3 py-1.5 text-sm text-text-secondary hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3">
              {user ? (
                <>
                  <p className="px-3 text-sm font-medium text-text">{user.name}</p>
                  {isAdmin && (
                    <Link to="/admin/books" className="block px-3 py-2 text-sm text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                      Quản lý hệ thống
                    </Link>
                  )}
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="block px-3 py-2 text-sm text-red-500">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2 text-sm text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng nhập (Admin)
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
