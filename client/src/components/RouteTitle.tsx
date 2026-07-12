import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titles: Array<[RegExp, string]> = [
  [/^\/$/, 'GreenLeaf Books'],
  [/^\/books$/, 'Danh sách sách | GreenLeaf Books'],
  [/^\/books\/[^/]+$/, 'Chi tiết sách | GreenLeaf Books'],
  [/^\/cart$/, 'Giỏ hàng | GreenLeaf Books'],
  [/^\/checkout$/, 'Thanh toán | GreenLeaf Books'],
  [/^\/orders$/, 'Đơn hàng của tôi | GreenLeaf Books'],
  [/^\/orders\/[^/]+$/, 'Chi tiết đơn hàng | GreenLeaf Books'],
  [/^\/wishlist$/, 'Sách yêu thích | GreenLeaf Books'],
  [/^\/profile$/, 'Hồ sơ cá nhân | GreenLeaf Books'],
  [/^\/notifications$/, 'Thông báo | GreenLeaf Books'],
  [/^\/rewards$/, 'Điểm thưởng | GreenLeaf Books'],
  [/^\/admin\/dashboard$/, 'Tổng quan admin | GreenLeaf Books'],
  [/^\/admin\/books$/, 'Quản lý sách | GreenLeaf Books'],
  [/^\/admin\/categories$/, 'Quản lý danh mục | GreenLeaf Books'],
  [/^\/admin\/orders$/, 'Quản lý đơn hàng | GreenLeaf Books'],
  [/^\/admin\/inventory$/, 'Quản lý tồn kho | GreenLeaf Books'],
  [/^\/admin\/vouchers$/, 'Quản lý voucher | GreenLeaf Books'],
  [/^\/admin\/rewards$/, 'Điểm thưởng | GreenLeaf Books'],
  [/^\/admin\/reviews$/, 'Quản lý đánh giá | GreenLeaf Books'],
  [/^\/admin\/users$/, 'Quản lý người dùng | GreenLeaf Books'],
];

export default function RouteTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = titles.find(([pattern]) => pattern.test(location.pathname))?.[1] || 'GreenLeaf Books';
    document.title = title;
  }, [location.pathname]);

  return null;
}
