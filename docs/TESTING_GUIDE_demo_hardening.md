# Hướng dẫn test — nhánh `demo-hardening`

Tài liệu này dành cho member test lại 5 tính năng mới thêm trước buổi demo SDN302 + MMA301. Mỗi mục có: cách vào chức năng, các bước thao tác, kết quả mong đợi, và các trường hợp cần thử thêm (edge case).

Branch: `demo-hardening` (6 commit, xem `git log --oneline main..demo-hardening`).

## 0. Chuẩn bị môi trường

1. Checkout đúng branch:
   ```bash
   git checkout demo-hardening
   git pull
   ```
2. MongoDB phải là **replica set** (Atlas hoặc local replica set) — nếu dùng `mongod` standalone, việc tạo đơn hàng sẽ lỗi transaction.
3. Chạy backend:
   ```bash
   npm install
   npm run seed:demo   # nạp lại data demo sạch, nên chạy trước khi test
   npm run dev          # http://localhost:5000
   ```
4. Chạy web:
   ```bash
   cd client
   npm install
   npm run dev           # http://localhost:5173
   ```
5. Chạy mobile (cần điện thoại Android + app Expo Go, cùng Wi-Fi với máy):
   ```bash
   cd mobile
   npm install
   npm start
   ```

**Tài khoản test (sau khi `npm run seed:demo`):**

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@greenleaf.test | Password123 |
| Customer | customer@greenleaf.test | Password123 |
| Reader | reader@greenleaf.test | Password123 |

---

## A1 — Trang 404 + ErrorBoundary (web)

**Vào đâu:** trình duyệt, không cần đăng nhập.

| Bước | Kết quả mong đợi |
|---|---|
| Truy cập `http://localhost:5173/duong-dan-khong-ton-tai` | Hiện trang 404 riêng (icon la bàn, nút "Về trang chủ" và "Khám phá sách") — **không** tự động redirect về `/` |
| Từ trang 404, bấm "Về trang chủ" | Về `/`, hiển thị đúng HomePage |
| Từ trang 404, bấm "Khám phá sách" | Vào `/books` |
| Thử với URL admin sai, ví dụ `/admin/khong-ton-tai` khi đã đăng nhập admin | Cũng hiện trang 404 (route `*` nằm trong cả layout công khai) |

**Edge case cần thử:** mở DevTools Console, xem có lỗi JS đỏ nào khi vào 404 không (không được có).

*(ErrorBoundary khó test thủ công vì cần một lỗi render thật sự xảy ra — chỉ cần xác nhận app không bị "màn hình trắng" khi gặp lỗi bất ngờ trong lúc test các mục khác. Nếu gặp màn trắng ở bất kỳ đâu, đó là bug cần báo — lẽ ra phải hiện màn "Đã có lỗi xảy ra" với nút Tải lại trang.)*

---

## A2 — Admin Dashboard: biểu đồ doanh thu + top sách bán chạy (web)

**Vào đâu:** đăng nhập `admin@greenleaf.test` → `/admin/dashboard`.

| Bước | Kết quả mong đợi |
|---|---|
| Mở trang Dashboard | 4 thẻ số liệu cũ (Doanh thu đã giao, Đơn chờ xác nhận, Số đầu sách, Sách nổi bật) vẫn hiển thị như trước |
| Cuộn xuống dưới 4 thẻ | Xuất hiện **2 biểu đồ mới**: "Doanh thu 14 ngày" (area chart) và "Top 5 sách bán chạy" (bar chart ngang) |
| Hover vào 1 điểm trên biểu đồ doanh thu | Hiện tooltip có ngày + số tiền |
| Hover vào 1 cột trong biểu đồ top sách | Hiện tooltip số lượng đã bán |

**⚠️ Lưu ý quan trọng khi test:** với data seed mặc định, các đơn "đã giao" có thể cũ hơn 14 ngày → biểu đồ doanh thu **phẳng, toàn số 0**. Đây không phải bug. Để thấy biểu đồ có số liệu thật:

1. Đăng nhập `customer@greenleaf.test`, đặt 1 đơn COD bất kỳ.
2. Đăng nhập admin → `/admin/orders` → chuyển trạng thái đơn đó thành **"Đã giao"**.
3. Quay lại `/admin/dashboard`, reload trang → cột doanh thu hôm nay sẽ lên số ngay.

**Test lỗi endpoint (optional, để chắc phần "an toàn khi API lỗi"):**
- Tắt backend trong khi đang mở `/admin/dashboard` rồi reload → 4 thẻ cũ vẫn phải hiển thị (dùng data cache/cũ hoặc rỗng gọn gàng), phần biểu đồ tự ẩn đi, không được làm vỡ cả trang.

**Test bằng API trực tiếp (dành cho người quen curl/Postman):**
```bash
# Lấy token admin
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@greenleaf.test","password":"Password123"}'

# Gọi endpoint stats với token vừa lấy
curl http://localhost:5000/api/stats/admin/overview -H "Authorization: Bearer <token>"

# Gọi KHÔNG có token — phải trả về 401
curl http://localhost:5000/api/stats/admin/overview
```

---

## A3 — Cảnh báo đơn VietQR quá hạn thanh toán (web, admin)

**Vào đâu:** đăng nhập admin → `/admin/orders`.

Quy tắc: đơn được coi là "quá hạn" khi đồng thời — phương thức **VietQR (ONLINE)**, thanh toán **chưa xong (pending)**, trạng thái đơn **chờ xác nhận (pending)**, và đã tạo **quá 24 giờ**.

Vì data seed thường là đơn mới tạo (chưa đủ 24h), cần tạo dữ liệu giả lập bằng `mongosh` để thấy tính năng hoạt động:

```js
// Kết nối vào DB (đổi tên DB nếu khác)
use greenleaf_books

// Tìm 1 đơn ONLINE + pending để chỉnh giờ tạo lùi lại 25 tiếng
db.orders.updateOne(
  { paymentMethod: "ONLINE", paymentStatus: "pending", orderStatus: "pending" },
  { $set: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } }
)
```

Nếu seed không có sẵn đơn ONLINE nào, tạo 1 đơn mới: đăng nhập customer → checkout chọn "VietQR qua payOS" (không cần thanh toán thật, chỉ cần tạo đơn) → dùng lệnh trên để chỉnh giờ.

| Bước | Kết quả mong đợi |
|---|---|
| Mở `/admin/orders` sau khi có ≥1 đơn quá hạn | Banner vàng cảnh báo phía trên bảng: "Có N đơn VietQR quá hạn thanh toán..." |
| Nhìn dòng đơn quá hạn trong bảng | Có nhãn nhỏ màu vàng "Quá hạn thanh toán" dưới cột Thanh toán, và nút "Hủy & hoàn kho" dưới cột Cập nhật |
| Bấm "Hủy & hoàn kho" | Hiện hộp thoại xác nhận → OK → đơn chuyển trạng thái "Đã hủy", banner/nhãn/nút biến mất khỏi dòng đó |
| Vào `/admin/inventory` sau khi hủy | Thấy log nhập/hoàn kho tương ứng với số lượng sách trong đơn vừa hủy (tồn kho được cộng lại) |
| Đơn VietQR nhưng **đã thanh toán** hoặc **chưa đủ 24h** | KHÔNG hiện badge/nút — kiểm tra không bị hiện nhầm |
| Đơn COD dù pending lâu | KHÔNG hiện badge/nút (chỉ áp dụng VietQR) |

---

## A4 — Quên mật khẩu (mobile)

**Vào đâu:** app mobile (Expo Go) → màn hình Đăng nhập.

| Bước | Kết quả mong đợi |
|---|---|
| Ở màn Login, nhìn phía trên nút Đăng nhập | Có link "Quên mật khẩu?" |
| Bấm vào link | Chuyển sang màn "Quên mật khẩu" mới |
| Để trống email, bấm "Gửi liên kết đặt lại" | Hiện lỗi "Vui lòng nhập email" |
| Nhập email hợp lệ đã đăng ký (`customer@greenleaf.test`), bấm gửi | Chuyển sang trạng thái "Đã gửi yêu cầu" với hướng dẫn kiểm tra email |
| Nhập email KHÔNG tồn tại trong hệ thống | Vẫn hiện "Đã gửi yêu cầu" (không tiết lộ email có tồn tại hay không — đây là chủ đích bảo mật, không phải bug) |
| Bấm "Về đăng nhập" ở màn thành công | Quay lại màn Login |
| Nếu server đã cấu hình SMTP thật | Kiểm tra hộp mail có nhận được link reset không; bấm link phải mở được trang web reset password (`client`) và đổi mật khẩu thành công |

**Lưu ý:** nếu backend chưa cấu hình SMTP (`.env` không có `SMTP_*`), email sẽ không thực sự được gửi (email service tự bỏ qua) nhưng API vẫn trả về thành công — đây là hành vi đã biết, không phải lỗi của tính năng này.

---

## A5 — Chỉnh sửa hồ sơ (mobile)

**Vào đâu:** app mobile → đăng nhập → tab Profile → "Chỉnh sửa hồ sơ".

| Bước | Kết quả mong đợi |
|---|---|
| Vào màn Chỉnh sửa hồ sơ | Form hiện sẵn tên, SĐT hiện tại (nếu có); email hiển thị nhưng không sửa được (ô mờ) |
| Xóa hết Họ tên, còn 1 ký tự, bấm Lưu | Báo lỗi "Tên tối thiểu 2 ký tự" |
| Điền Họ tên hợp lệ + SĐT, để trống toàn bộ phần địa chỉ, bấm Lưu | Lưu thành công, quay về màn Profile, tên mới hiển thị ngay |
| Điền **một phần** địa chỉ (ví dụ chỉ điền Người nhận, để trống 3 ô còn lại), bấm Lưu | Báo lỗi "Địa chỉ mặc định cần điền đủ 4 trường (hoặc để trống toàn bộ)" |
| Điền đủ cả 4 trường địa chỉ (Người nhận, SĐT người nhận, Địa chỉ, Tỉnh/Thành), bấm Lưu | Lưu thành công |
| Vào lại Checkout (đặt hàng thử) sau khi lưu địa chỉ | Địa chỉ vừa lưu phải được điền sẵn làm địa chỉ mặc định |
| Thoát app, mở lại, vào lại Profile | Tên/SĐT vừa sửa vẫn còn (đã lưu lên server, không chỉ lưu tạm trên máy) |

---

## Cách báo lỗi khi test xong

Nếu phát hiện sai khác so với "Kết quả mong đợi", ghi lại theo mẫu sau rồi gửi lại cho người phụ trách:

```
Tính năng: [A1/A2/A3/A4/A5]
Bước thực hiện: ...
Kết quả mong đợi: ...
Kết quả thực tế: ...
Ảnh chụp màn hình (nếu có): ...
Môi trường: web/mobile, trình duyệt hoặc phiên bản Expo Go
```

## Phạm vi KHÔNG cần test (đã biết, chưa làm trong đợt này)

- Pull-to-refresh mở rộng cho các màn mobile khác ngoài Orders
- "Voucher của tôi" (xem lại mã voucher đã đổi điểm)
- Sửa/xóa danh mục (category) ở admin
- HomePage vẫn còn banner/số liệu mẫu (chưa thay bằng dữ liệu thật)

Đây là các mục đã ghi nhận, không phải phạm vi buổi test này — không cần báo lại trừ khi phát hiện chúng gây crash hoặc lỗi nghiêm trọng khác thường.
