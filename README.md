# GreenLeaf Books API

Backend MVP cho nền tảng bán sách chủ đề động vật và thực vật. Phase 1 chỉ hỗ trợ thanh toán khi nhận hàng (`COD`), không tích hợp bất kỳ cổng thanh toán online nào.

## Chạy dự án

```bash
npm install
cp .env.example .env
npm run seed:categories
npm run dev
```

Trên Windows PowerShell, tạo `.env` bằng cách copy nội dung từ `.env.example`.

## Environment

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/greenleaf_books
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

## Scripts

- `npm run dev`: chạy server TypeScript bằng `ts-node-dev`
- `npm run build`: compile TypeScript ra `dist`
- `npm start`: chạy build production
- `npm run seed:categories`: seed đúng 2 nhóm gốc `Động vật` và `Thực vật`

## Tài liệu

Xem thiết kế backend, models, controller/route mapping, endpoint list, setup Atlas/Compass và UI guideline tại [docs/BACKEND_DESIGN.md](docs/BACKEND_DESIGN.md).
