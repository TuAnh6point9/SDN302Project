/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRequiredRoute from './components/AuthRequiredRoute';
import PageLoader from './components/PageLoader';

const MainLayout = lazy(() => import('./layouts/MainLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const BooksManagePage = lazy(() => import('./pages/admin/BooksManagePage'));
const CategoriesManagePage = lazy(() => import('./pages/admin/CategoriesManagePage'));
const OrdersManagePage = lazy(() => import('./pages/admin/OrdersManagePage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const VouchersManagePage = lazy(() => import('./pages/admin/VouchersManagePage'));
const UsersManagePage = lazy(() => import('./pages/admin/UsersManagePage'));
const ReviewsManagePage = lazy(() => import('./pages/admin/ReviewsManagePage'));
const InventoryManagePage = lazy(() => import('./pages/admin/InventoryManagePage'));
const RewardDashboardPage = lazy(() => import('./pages/admin/RewardDashboardPage'));

const lazyPage = (element: ReactNode) => (
  <Suspense fallback={<PageLoader />}>
    {element}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: lazyPage(<MainLayout />),
    children: [
      { index: true, element: lazyPage(<HomePage />) },
      { path: 'books', element: lazyPage(<CatalogPage />) },
      { path: 'books/:slug', element: lazyPage(<BookDetailPage />) },
      { path: 'cart', element: lazyPage(<AuthRequiredRoute><CartPage /></AuthRequiredRoute>) },
      { path: 'checkout', element: lazyPage(<AuthRequiredRoute><CheckoutPage /></AuthRequiredRoute>) },
      { path: 'orders', element: lazyPage(<AuthRequiredRoute><OrdersPage /></AuthRequiredRoute>) },
      { path: 'orders/:id', element: lazyPage(<AuthRequiredRoute><OrderDetailPage /></AuthRequiredRoute>) },
      { path: 'profile', element: lazyPage(<AuthRequiredRoute><ProfilePage /></AuthRequiredRoute>) },
      { path: 'wishlist', element: lazyPage(<AuthRequiredRoute><WishlistPage /></AuthRequiredRoute>) },
      { path: 'notifications', element: lazyPage(<AuthRequiredRoute><NotificationsPage /></AuthRequiredRoute>) },
      { path: 'rewards', element: lazyPage(<AuthRequiredRoute><RewardsPage /></AuthRequiredRoute>) },
      { path: '*', element: lazyPage(<NotFoundPage />) },
    ],
  },
  {
    path: 'login',
    element: lazyPage(<LoginPage />),
  },
  {
    path: 'register',
    element: lazyPage(<RegisterPage />),
  },
  {
    path: 'forgot-password',
    element: lazyPage(<ForgotPasswordPage />),
  },
  {
    path: 'reset-password',
    element: lazyPage(<ResetPasswordPage />),
  },
  {
    path: 'auth-callback',
    element: lazyPage(<AuthCallbackPage />),
  },
  {
    path: 'verify-otp',
    element: lazyPage(<VerifyOtpPage />),
  },
  {
    path: 'admin',
    element: lazyPage(
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: lazyPage(<DashboardPage />) },
      { path: 'books', element: lazyPage(<BooksManagePage />) },
      { path: 'categories', element: lazyPage(<CategoriesManagePage />) },
      { path: 'orders', element: lazyPage(<OrdersManagePage />) },
      { path: 'vouchers', element: lazyPage(<VouchersManagePage />) },
      { path: 'reviews', element: lazyPage(<ReviewsManagePage />) },
      { path: 'inventory', element: lazyPage(<InventoryManagePage />) },
      { path: 'rewards', element: lazyPage(<RewardDashboardPage />) },
      { path: 'users', element: lazyPage(<UsersManagePage />) },
      { path: 'notifications', element: lazyPage(<NotificationsPage />) },
    ],
  },
]);
