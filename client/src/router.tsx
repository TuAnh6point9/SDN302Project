import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRequiredRoute from './components/AuthRequiredRoute';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';

import BooksManagePage from './pages/admin/BooksManagePage';
import CategoriesManagePage from './pages/admin/CategoriesManagePage';
import OrdersManagePage from './pages/admin/OrdersManagePage';
import DashboardPage from './pages/admin/DashboardPage';
import VouchersManagePage from './pages/admin/VouchersManagePage';
import UsersManagePage from './pages/admin/UsersManagePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'books', element: <CatalogPage /> },
      { path: 'books/:slug', element: <BookDetailPage /> },
      { path: 'cart', element: <AuthRequiredRoute><CartPage /></AuthRequiredRoute> },
      { path: 'checkout', element: <AuthRequiredRoute><CheckoutPage /></AuthRequiredRoute> },
      { path: 'orders', element: <AuthRequiredRoute><OrdersPage /></AuthRequiredRoute> },
      { path: 'orders/:id', element: <AuthRequiredRoute><OrderDetailPage /></AuthRequiredRoute> },
      { path: 'profile', element: <AuthRequiredRoute><ProfilePage /></AuthRequiredRoute> },
      { path: 'wishlist', element: <AuthRequiredRoute><WishlistPage /></AuthRequiredRoute> },
    ],
  },
  {
    path: 'login',
    element: <LoginPage />,
  },
  {
    path: 'register',
    element: <RegisterPage />,
  },
  {
    path: 'admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'books', element: <BooksManagePage /> },
      { path: 'categories', element: <CategoriesManagePage /> },
      { path: 'orders', element: <OrdersManagePage /> },
      { path: 'vouchers', element: <VouchersManagePage /> },
      { path: 'users', element: <UsersManagePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
