# GreenLeaf Books

Nền tảng mua bán sách chủ đề thiên nhiên, động vật, thực vật và môi trường. Project gồm backend `Express + TypeScript + MongoDB` và frontend `React + Vite + TailwindCSS`.

## Chức Năng Đã Hoàn Thiện

- Đăng ký, đăng nhập JWT, lấy thông tin tài khoản hiện tại.
- Cập nhật hồ sơ cá nhân, địa chỉ giao hàng mặc định và đổi mật khẩu.
- Phân quyền `customer` và `admin`.
- Admin quản lý người dùng: xem danh sách, đổi vai trò, khóa/mở tài khoản.
- Tài khoản bị khóa không thể đăng nhập hoặc gọi API bảo vệ.
- Duyệt sách, tìm kiếm, lọc theo danh mục, tag, khoảng giá, tồn kho, rating và sắp xếp.
- Trang chi tiết sách với thông tin tồn kho, rating, review và nút thêm vào giỏ hàng.
- Giỏ hàng đầy đủ: thêm, sửa số lượng, xóa item, xóa toàn bộ.
- Wishlist: lưu/xóa sách yêu thích và xem danh sách yêu thích.
- Checkout với địa chỉ nhận hàng, phí giao hàng, voucher và phương thức thanh toán.
- Thanh toán `COD`.
- Thanh toán online demo: tạo đơn online, sau đó xác nhận thanh toán demo để chuyển đơn sang `paid`.
- Lịch sử đơn hàng và trang chi tiết đơn hàng cho khách.
- Timeline trạng thái đơn hàng.
- Admin quản lý đơn hàng: cập nhật trạng thái, tự đánh dấu paid khi delivered, nhập lý do khi hủy.
- Khi admin hủy đơn, tồn kho được hoàn lại một lần.
- Voucher/mã giảm giá: tạo voucher, áp dụng trong checkout, giới hạn lượt dùng, giá trị tối thiểu, giảm tối đa.
- Review/rating sách, chỉ cho phép review khi khách đã có đơn delivered chứa sách đó.
- Admin dashboard tổng quan doanh thu, đơn hàng và tồn kho.
- Admin quản lý sách, danh mục.
- Upload ảnh bìa sách JPG/PNG/WEBP, giới hạn 3MB.
- Seed demo đầy đủ cho MongoDB: category, book, user, voucher, order, review, cart, wishlist.

## Cấu Trúc Chính

```text
SDN302Project/
  src/                 Backend Express + TypeScript
  client/              Frontend React + Vite
  uploads/             Ảnh upload khi chạy local
  .env.example         Mẫu cấu hình backend
  client/.env.example  Mẫu cấu hình frontend
```

## Cài Đặt Backend

```bash
npm install
cp .env.example .env
npm run build
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

File `.env` backend cần có:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/greenleaf_books
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

## Cài Đặt Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

File `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Seed Dữ Liệu MongoDB

Đảm bảo MongoDB local đang chạy, sau đó chạy:

```bash
npm run seed:demo
```

Seed hiện tạo dữ liệu demo:

```text
Database: greenleaf_books
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

Ghi chú seed:

- Script nằm tại `src/scripts/seedDemo.ts`.
- Script có thể chạy lại nhiều lần.
- Sách/user/voucher được upsert để tránh nhân bản.
- Các đơn demo có mã `GL-DEMO-*` sẽ được làm mới khi chạy seed.
- Text index của sách đã cấu hình `default_language: "none"` để tránh lỗi MongoDB với `language: "vi"`.

## Scripts

Backend:

```bash
npm run dev
npm run build
npm start
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

## Kiểm Tra Đã Chạy

Các lệnh đã được dùng để kiểm tra trạng thái hiện tại:

```bash
npm run build
npm audit --audit-level=high
cd client
npm run lint
npm run build
npm audit --audit-level=high
```

Kết quả gần nhất:

- Backend build: pass.
- Frontend lint: pass.
- Frontend build: pass.
- Backend audit high: 0 vulnerabilities.
- Frontend audit high: 0 vulnerabilities.
- Seed MongoDB demo: pass.

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

Categories:

- `GET /api/categories`
- `POST /api/categories` admin
- `PUT /api/categories/:idOrSlug` admin
- `DELETE /api/categories/:idOrSlug` admin

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
- `PUT /api/orders/:id/pay-online-demo`

Vouchers:

- `GET /api/vouchers/validate/:code`
- `GET /api/vouchers` admin
- `POST /api/vouchers` admin
- `PUT /api/vouchers/:code` admin

Reviews:

- `GET /api/books/:id/reviews`
- `POST /api/books/:id/reviews`

Uploads:

- `POST /api/uploads/books` admin

## Ghi Chú Thanh Toán Online

Thanh toán online hiện là luồng demo nội bộ để project có sẵn nền tảng trạng thái online payment:

- Khách chọn `Online demo` ở checkout.
- Đơn được tạo với `paymentMethod = ONLINE` và `paymentStatus = pending`.
- Khách vào chi tiết đơn và bấm `Thanh toán online demo`.
- API chuyển `paymentStatus` sang `paid` và ghi timeline.

Để tích hợp thật VNPay/MoMo/Stripe, cần thêm merchant credentials, return URL, IPN/callback verification và đối soát giao dịch. Không nên hardcode secret thanh toán vào repository.

## Ghi Chú Kỹ Thuật

- Khi tạo đơn, tồn kho được trừ trong MongoDB transaction để giảm rủi ro oversell.
- Khi hủy đơn, tồn kho được hoàn lại nếu đơn chưa hủy trước đó.
- Order lưu snapshot `title` và `price` để lịch sử mua hàng không bị thay đổi khi sách cập nhật giá.
- Voucher được kiểm tra hiệu lực, thời gian, giới hạn lượt dùng và giá trị đơn tối thiểu.
- `.env` không nên commit lên GitHub; chỉ commit `.env.example`.
