# GreenLeaf Books

Nền tảng mua bán sách chủ đề thiên nhiên, động vật, thực vật và môi trường. Backend dùng `Express + TypeScript + MongoDB`, frontend dùng `React + Vite + TailwindCSS`.

## Cập Nhật Mới

- **Hệ thống điểm thưởng (Reward System):** điểm danh nhận thưởng mỗi ngày, tích điểm khi mua hàng (đơn `delivered`) và khi đánh giá sách, đổi điểm lấy voucher giảm giá dùng thật, lịch sử giao dịch điểm có số dư (ledger), dashboard điểm thưởng cho admin (`/admin/rewards`).
- **Đăng ký thông báo hàng về (Back In Stock Subscription):** khách bấm "Báo khi có hàng" trên trang chi tiết sách hết hàng; khi admin nhập kho trở lại, hệ thống tự động gửi notification + email cho toàn bộ người đã đăng ký.

## Chức Năng Chính

- Đăng ký, đăng nhập JWT, phân quyền `customer` và `admin`.
- Cập nhật hồ sơ, địa chỉ giao hàng mặc định và đổi mật khẩu.
- Admin quản lý người dùng: đổi vai trò, khóa/mở tài khoản.
- Duyệt sách, tìm kiếm, lọc theo danh mục, tag, giá, tồn kho, rating.
- Chi tiết sách, giỏ hàng, wishlist, checkout và lịch sử đơn hàng.
- Thanh toán COD.
- Thanh toán online VietQR qua payOS: tạo link thanh toán, redirect sang payOS, nhận webhook và tự cập nhật `paymentStatus = paid`.
- Voucher/mã giảm giá với giới hạn lượt dùng, đơn tối thiểu và giảm tối đa.
- Timeline trạng thái đơn hàng, lý do hủy đơn, hoàn tồn kho khi hủy.
- Review/rating sách sau khi khách đã nhận hàng.
- Điểm thưởng: điểm danh hàng ngày, thưởng mua hàng/đánh giá, đổi điểm lấy voucher, dashboard admin.
- Đăng ký nhận thông báo khi sách hết hàng có lại (notification + email tự động).
- Admin dashboard, quản lý sách, danh mục, đơn hàng, voucher, tồn kho, điểm thưởng.
- Upload ảnh JPG/PNG/WEBP, giới hạn 3MB.
- Seed demo đầy đủ cho MongoDB.

## Cài Đặt Backend

```bash
npm install
cp .env.example .env
npm run build
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

File `.env` backend:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/greenleaf_books
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_API_URL=https://api-merchant.payos.vn
PAYOS_PARTNER_CODE=
```

Không commit `.env` lên GitHub. Chỉ commit `.env.example`.

## Cài Đặt Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

File `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Seed Dữ Liệu MongoDB

Đảm bảo MongoDB local đang chạy, sau đó chạy:

```bash
npm run seed:demo
```

Dữ liệu demo:

```text
Categories: 16
Books: 10
Users: 3
Vouchers: 3
Orders: 3
Reviews: 4
```

Tài khoản demo:

```text
Admin: admin@greenleaf.test / Password123
Customer: customer@greenleaf.test / Password123
Reader: reader@greenleaf.test / Password123
```

## Thanh Toán VietQR/payOS

Luồng thanh toán online:

1. Khách chọn `VietQR qua payOS` ở checkout.
2. Đơn được tạo với `paymentMethod = ONLINE` và `paymentStatus = pending`.
3. Khách vào chi tiết đơn và bấm `Thanh toán VietQR`.
4. Backend gọi payOS API để tạo payment link.
5. Frontend redirect khách sang `checkoutUrl` của payOS.
6. Khách quét VietQR và thanh toán.
7. payOS gửi webhook về backend.
8. Backend verify `signature` bằng `PAYOS_CHECKSUM_KEY`.
9. Nếu webhook hợp lệ, đúng số tiền và đúng mã giao dịch, đơn được cập nhật `paymentStatus = paid`.

Webhook URL cần cấu hình trong dashboard payOS:

```text
https://<backend-public-domain>/api/payments/payos/webhook
```

Khi chạy local, cần public backend bằng ngrok hoặc deploy backend tạm để payOS gọi được webhook.

## Scripts

Backend:

```bash
npm run dev
npm run build
npm start
npm run verify
npm run seed:categories
npm run seed:demo
npm audit --audit-level=high
```

Frontend:

```bash
cd client
npm run dev
npm run lint
npm run build
npm run preview
npm audit --audit-level=high
```

## API Chính

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `PUT /api/auth/password`

Users admin:

- `GET /api/users`
- `PUT /api/users/:id`

Books:

- `GET /api/books`
- `GET /api/books/:idOrSlug`
- `POST /api/books` admin
- `PUT /api/books/:idOrSlug` admin
- `DELETE /api/books/:idOrSlug` admin

Cart:

- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`
- `DELETE /api/cart`

Wishlist:

- `GET /api/wishlist`
- `POST /api/wishlist/:bookId`
- `DELETE /api/wishlist/:bookId`

Orders:

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/all` admin
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status` admin

Payments:

- `POST /api/payments/payos/orders/:orderId/create`
- `POST /api/payments/payos/webhook`

Vouchers:

- `GET /api/vouchers/validate/:code`
- `GET /api/vouchers` admin
- `POST /api/vouchers` admin
- `PUT /api/vouchers/:code` admin

Reviews:

- `GET /api/books/:id/reviews`
- `POST /api/books/:id/reviews`

Inventory admin:

- `GET /api/inventory`
- `POST /api/inventory/:bookId/adjust`

Rewards:

- `GET /api/rewards/status`
- `POST /api/rewards/claim`
- `GET /api/rewards/history`
- `POST /api/rewards/redeem`
- `GET /api/rewards/admin/summary` admin
- `GET /api/rewards/admin/history` admin

Đăng ký thông báo hàng về:

- `GET /api/books/:id/subscribe`
- `POST /api/books/:id/subscribe`
- `DELETE /api/books/:id/subscribe`

Uploads:

- `POST /api/uploads/books` admin

## Kiểm Tra Chất Lượng

Các lệnh nên chạy trước khi commit:

```bash
npm run verify
```

Lệnh `npm run verify` sẽ chạy build/audit backend và lint/build/audit frontend.

## Docker Local

Có thể chạy thử môi trường gần production bằng Docker Compose:

```bash
docker compose up --build
```

Các service mặc định:

```text
Frontend: http://localhost:8080
Backend: http://localhost:5000
MongoDB: mongodb://localhost:27017/greenleaf_books
```

Seed dữ liệu khi dùng Docker:

```bash
docker compose exec api npm run seed:demo
```

## Pre-Deploy Checklist

- Chạy `npm run verify`.
- Đảm bảo `.env` production có `JWT_SECRET` mạnh và `MONGO_URI` đúng.
- Cấu hình `CLIENT_URL` đúng domain frontend.
- Cấu hình SMTP nếu muốn gửi email thật.
- Cấu hình payOS và webhook public khi bật thanh toán online production.
- Backup MongoDB trước khi migrate hoặc seed dữ liệu quan trọng.
- Không commit `.env`, credentials, hoặc file upload thật.

## Ghi Chú Kỹ Thuật

- Tạo đơn trừ tồn kho trong MongoDB transaction để giảm rủi ro oversell.
- Hủy đơn hoàn tồn kho nếu đơn chưa bị hủy trước đó.
- Order lưu snapshot `title` và `price` để lịch sử mua hàng không đổi khi sách cập nhật giá.
- payOS webhook là nguồn xác nhận thanh toán chính; không tin tuyệt đối vào redirect từ frontend.
- Credential payOS phải nằm trong `.env` hoặc secret manager, không hardcode vào code.
- Frontend dùng lazy loading route và manual chunks để giảm bundle tải ban đầu.
- Backend bật `helmet`, compression, rate limit và graceful shutdown để sẵn sàng hơn trước deploy.
