# 🍔 Hệ Thống Quản Lý Thức Ăn Nhanh - Frontend

Dự án frontend cho hệ thống quản lý cửa hàng thức ăn nhanh sử dụng React, TypeScript, và PWA.

## 📋 Mô Tả

Dự án này là phần frontend của hệ thống quản lý cửa hàng thức ăn nhanh, sử dụng:
- **React** - UI Library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool nhanh
- **PWA** (Progressive Web App) - Hỗ trợ offline và install như app
- **Axios** - HTTP Client
- **React Router** - Routing

## 🚀 Bắt Đầu

### Cài Đặt Dependencies

```bash
npm install
```

### Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔌 Cấu Hình API

Backend API đang chạy tại: `http://localhost:5000`

Proxy đã được cấu hình trong `vite.config.ts` để tự động chuyển request `/api` sang backend.

## 🎯 Tính Năng

### Quản Lý Sản Phẩm
- 📦 Xem danh sách sản phẩm
- ➕ Thêm/sửa/xóa sản phẩm
- 📊 Quản lý tồn kho
- 🏷️ Quản lý danh mục

### Quản Lý Đơn Hàng
- 🛒 Tạo và xử lý đơn hàng
- 📱 Theo dõi trạng thái đơn hàng
- 💰 Xử lý thanh toán

### Quản Lý Khách Hàng & Nhân Viên
- 👥 Quản lý thông tin khách hàng
- 💼 Quản lý nhân viên
- 📈 Thống kê và báo cáo

## 📱 Progressive Web App (PWA)

Dự án được cấu hình như một PWA với các tính năng:
- ✨ Có thể cài đặt như ứng dụng mobile
- 🔄 Hoạt động offline
- ⚡ Cache thông minh để tăng tốc độ
- 📲 Responsive design

### Cài Đặt PWA

1. Mở ứng dụng trong Chrome/Edge
2. Click vào icon "Install" trong thanh địa chỉ
3. Hoặc vào Menu > Install App

## 🛠️ Cấu Trúc Thư Mục

```
fe/
├── public/          # Static files
├── src/
│   ├── assets/      # Images, fonts
│   ├── components/  # React components
│   ├── services/    # API services
│   ├── types/       # TypeScript types
│   ├── utils/       # Utility functions
│   ├── App.tsx      # Main app component
│   ├── main.tsx     # Entry point
│   └── ...
├── index.html       # HTML template
├── vite.config.ts  # Vite configuration
└── package.json     # Dependencies
```

## 📚 API Endpoints

### Categories
- `GET /api/Categories` - Lấy danh sách danh mục
- `GET /api/Categories/{id}` - Lấy chi tiết danh mục
- `POST /api/Categories` - Tạo danh mục mới
- `PUT /api/Categories/{id}` - Cập nhật danh mục
- `DELETE /api/Categories/{id}` - Xóa danh mục

### Products
- `GET /api/Products` - Lấy danh sách sản phẩm
- `GET /api/Products/available` - Lấy sản phẩm còn hàng
- `POST /api/Products` - Tạo sản phẩm mới
- ... và nhiều endpoints khác

### Orders, Customers, Employees, Payments
Xem thêm trong backend documentation tại `/swagger`

## 🎨 Công Nghệ Sử Dụng

- React 19.x
- TypeScript 5.x
- Vite 7.x
- Axios
- React Router
- vite-plugin-pwa

## 📝 Ghi Chú

Dự án này là frontend cho đề tài tốt nghiệp "Hệ Thống Quản Lý Cửa Hàng Thức Ăn Nhanh".

Backend: C# Web API + Entity Framework + SQL Server

## 👨‍💻 Tác Giả

Trần Thái Thiên - MSSV: 1050080202
