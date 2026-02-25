# 📝 Tóm Tắt Dự Án Quản Lý Cửa Hàng Thức Ăn Nhanh

## ✅ Đã Hoàn Thành

### 1. Dự Án Frontend (React + TypeScript + PWA)

**Vị trí:** `fe/`

**Công nghệ sử dụng:**
- ✅ React 19.x + TypeScript
- ✅ Vite 7.x (Build tool nhanh)
- ✅ PWA (Progressive Web App) với vite-plugin-pwa
- ✅ Axios (HTTP client)
- ✅ React Router DOM 7.x

**Cấu hình:**
- ✅ Vite config với PWA plugin
- ✅ Service worker tự động đăng ký
- ✅ Proxy API: `/api` -> `http://localhost:5000/api`
- ✅ Port: 3000
- ✅ Manifest cho PWA
- ✅ Cache strategy cho offline

**Tính năng PWA:**
- ✅ Có thể cài đặt như app
- ✅ Hoạt động offline
- ✅ Cache thông minh
- ✅ Auto-update khi có version mới

**Files đã tạo/chỉnh sửa:**
- ✅ `vite.config.ts` - Cấu hình PWA
- ✅ `index.html` - HTML template với meta tags PWA
- ✅ `src/main.tsx` - Entry point
- ✅ `src/App.tsx` - App component với UI cơ bản
- ✅ `src/App.css` - Styles cho Fast Food theme
- ✅ `src/index.css` - Global styles
- ✅ `README.md` - Documentation đầy đủ
- ✅ `HUONG_DAN_SU_DUNG.md` - Hướng dẫn sử dụng chi tiết

### 2. Dự Án Backend (C# Web API)

**Vị trí:** `fastfood/`

**Đã có sẵn:**
- ✅ C# Web API với .NET 8.0
- ✅ Entity Framework Core
- ✅ SQL Server Database
- ✅ ASP.NET Identity

**Controllers:**
- ✅ CategoriesController - Quản lý danh mục
- ✅ ProductsController - Quản lý sản phẩm
- ✅ CustomersController - Quản lý khách hàng
- ✅ EmployeesController - Quản lý nhân viên
- ✅ OrdersController - Quản lý đơn hàng
- ✅ OrderItemsController - Chi tiết đơn hàng
- ✅ PaymentsController - Thanh toán

**Models:**
- ✅ Category - Danh mục
- ✅ Product - Sản phẩm
- ✅ Customer - Khách hàng
- ✅ Employee - Nhân viên
- ✅ Order - Đơn hàng
- ✅ OrderItem - Chi tiết đơn hàng
- ✅ Payment - Thanh toán
- ✅ III.	Giai đoạn thiết kế Backend – Server Logic Stage
Xử lý logic, tạo API, kết nối database, bảo mật.
 Đây là phần xử lý logic nghiệp vụ + Kết nối database + API
Kết quả giai đoạn này: API server chạy ổn định, xử lý logic, kết nối database và phục vụ dữ liệu cho frontend.
Sử dụng mô hình kiến trúc 3 lớp (3-Layer)
1.	Lớp Presentation: Frontend Giao diện người dùng (UI)
2.	Lớp Application / Logic: Backend Xử lý nghiệp vụ + API
3.	Lớp Data: Database Lưu dữ liệu
ApplicationUser - User account

**Database:**
- ✅ Connection string đã config
- ✅ Migrations đã tạo

## 🚀 Cách Chạy Dự Án

### Backend (API)
```bash
cd fastfood/fastfood
dotnet run
```
API chạy tại: `http://localhost:5000` hoặc `https://localhost:5001`

### Frontend (React)
```bash
cd fe
npm install  # Đã cài đặt sẵn
npm run dev
```
Frontend chạy tại: `http://localhost:3000`

## 📊 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────┐
│   Frontend (React + PWA)       │
│   - Port: 3000                  │
│   - Vite + TypeScript           │
│   - PWA Support                 │
└─────────────┬───────────────────┘
              │ HTTP Proxy
              ▼
┌─────────────────────────────────┐
│   Backend (C# Web API)         │
│   - Port: 5000/5001            │
│   - .NET 8.0                    │
│   - Entity Framework            │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   Database (SQL Server)        │
│   - Database: fastfoodma       │
│   - Server: MSI                │
└─────────────────────────────────┘
```

## 📋 API Endpoints

### Categories
- `GET /api/Categories` - Danh sách danh mục
- `GET /api/Categories/active` - Danh mục đang hoạt động
- `GET /api/Categories/{id}` - Chi tiết danh mục
- `POST /api/Categories` - Tạo mới
- `PUT /api/Categories/{id}` - Cập nhật
- `DELETE /api/Categories/{id}` - Xóa
- `PATCH /api/Categories/{id}/toggle-status` - Bật/tắt

### Products
- `GET /api/Products` - Danh sách sản phẩm
- `GET /api/Products/available` - Sản phẩm còn hàng
- `GET /api/Products/category/{categoryId}` - Theo danh mục
- `GET /api/Products/low-stock` - Sản phẩm sắp hết
- `GET /api/Products/search?name={name}` - Tìm kiếm
- `POST /api/Products` - Tạo mới
- `PUT /api/Products/{id}` - Cập nhật
- `PATCH /api/Products/{id}/update-stock` - Cập nhật tồn kho

### Orders
- `GET /api/Orders` - Danh sách đơn hàng
- `GET /api/Orders/by-status/{status}` - Theo trạng thái
- `GET /api/Orders/by-customer/{customerId}` - Theo khách hàng
- `GET /api/Orders/{id}` - Chi tiết đơn hàng
- `POST /api/Orders` - Tạo đơn hàng mới
- `PUT /api/Orders/{id}` - Cập nhật đơn hàng
- `PATCH /api/Orders/{id}/cancel` - Hủy đơn hàng

### Customers
- `GET /api/Customers` - Danh sách khách hàng
- `GET /api/Customers/vip` - Khách hàng VIP
- `GET /api/Customers/search?query={query}` - Tìm kiếm
- `POST /api/Customers` - Tạo mới

### Employees
- `GET /api/Employees` - Danh sách nhân viên
- `GET /api/Employees/by-role/{role}` - Theo vai trò
- `POST /api/Employees` - Tạo mới

### Payments
- `GET /api/Payments` - Danh sách thanh toán
- `GET /api/Payments/by-order/{orderId}` - Theo đơn hàng
- `POST /api/Payments` - Tạo thanh toán
- `PATCH /api/Payments/{id}/confirm` - Xác nhận thanh toán

## 🎨 Tính Năng PWA

1. **Installable** - Có thể cài đặt như app native
2. **Offline Support** - Hoạt động khi mất mạng
3. **Caching** - Cache API responses thông minh
4. **Auto Update** - Tự động cập nhật khi có version mới
5. **Service Worker** - Service worker tự động đăng ký

## 📝 Đề Tài

**Tên đề tài:** Hệ Thống Quản Lý Cửa Hàng Thức Ăn Nhanh

**Sinh viên:** Trần Thái Thiên - MSSV: 1050080202

**Công nghệ:**
- Backend: C# Web API + Entity Framework + SQL Server
- Frontend: React + TypeScript + PWA
- Build tool: Vite

## 🔄 Bước Tiếp Theo

1. ✅ Cấu hình PWA - **Đã xong**
2. ⏳ Tạo routing với React Router
3. ⏳ Tạo API service layer
4. ⏳ Implement components cho từng tính năng
5. ⏳ Authentication & Authorization
6. ⏳ UI/UX improvements
7. ⏳ Testing
8. ⏳ Deploy

## 📦 Dependencies Đã Cài

**Frontend:**
- react, react-dom
- react-router-dom
- axios
- vite-plugin-pwa
- typescript
- vite

**Backend (sẵn có):**
- .NET 8.0
- Entity Framework Core
- SQL Server
- ASP.NET Identity
- Swagger

## 🎉 Hoàn Thành!

Dự án frontend React TypeScript với PWA đã được thiết lập thành công và sẵn sàng để phát triển!

Để bắt đầu:
```bash
cd fe
npm run dev
```

