export const formatPrice = (value: number): string =>
  `${value.toLocaleString('vi-VN')}đ`;

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán lỗi',
};

export const REWARD_REASON_LABELS: Record<string, string> = {
  daily_login: 'Điểm danh hàng ngày',
  purchase: 'Thưởng mua hàng',
  review: 'Thưởng đánh giá',
  redeem_voucher: 'Đổi voucher',
};
